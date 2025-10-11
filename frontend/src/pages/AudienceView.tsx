import React, { useState, useEffect, useCallback } from "react";
import { 
  Typography, 
  Box, 
  AppBar, 
  Toolbar, 
  Container, 
  Paper, 
  CircularProgress,
  Alert,
  Chip,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Slider
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams } from "react-router-dom";
import { useSignalR } from "../hooks/useSignalR";
import { apiService } from "../services/api";
import { QuestionType } from "../types/question";
import type { QuestionActivatedEvent, ErrorEvent } from "../types/signalr";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

interface PresentationInfo {
  id: string;
  title: string;
  presenterName: string;
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
  labelName?: string;
  labelColor?: string;
}

interface ActiveQuestion {
  id: string;
  text: string;
  type: number;
  configuration?: any;
  liveStartedAt?: string;
  enableSentimentAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  enableKeywordExtraction: boolean;
}

type AudienceState = 
  | 'loading'
  | 'connecting'
  | 'connected'
  | 'waiting'
  | 'question_active'
  | 'response_submitted'
  | 'session_ended'
  | 'presentation_ended'
  | 'question_ended'
  | 'error';

const AudienceView: React.FC = () => {
  const { presentationId } = useParams<{ presentationId?: string }>();
  const [state, setState] = useState<AudienceState>('loading');
  const [presentation, setPresentation] = useState<PresentationInfo | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [response, setResponse] = useState<string>('');
  const [sessionId] = useState<string>(() => `audience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [error, setError] = useState<string>('');
  const [hasResponded, setHasResponded] = useState<boolean>(false);

  const {
    isConnected,
    isConnecting,
    connect,
    joinPresentation,
    submitResponse,
    onQuestionActivated,
    onQuestionDeactivated,
    onLiveSessionEnded,
    onResponseSubmitted,
    onJoinedPresentation,
    onError
  } = useSignalR({ autoConnect: false, requireAuth: false });

  // Initialize presentation data
  useEffect(() => {
    const loadPresentation = async () => {
      if (!presentationId) {
        setError('No presentation ID provided');
        setState('error');
        return;
      }

      try {
        setState('loading');
        const presentationData = await apiService.getAudiencePresentation(presentationId);
        console.log('Presentation data received:', presentationData);
        
        setPresentation(presentationData);
        
        if (!presentationData.isLive) {
          setState('presentation_ended');
          setError('This presentation is not currently live');
          return;
        }

        // Connect to SignalR
        setState('connecting');
        await connect();
        
      } catch (err) {
        console.error('Failed to load presentation:', err);
        setError('Failed to load presentation');
        setState('error');
      }
    };

    loadPresentation();
  }, [presentationId, connect]);

  // Join presentation when connected
  useEffect(() => {
    if (isConnected && presentationId && state === 'connecting') {
      joinPresentation(presentationId).then(() => {
        setState('connected');
      }).catch((err) => {
        console.error('Failed to join presentation:', err);
        setError('Failed to join presentation');
        setState('error');
      });
    }
  }, [isConnected, presentationId, joinPresentation, state]);

  // Set up SignalR event handlers
  useEffect(() => {
    onJoinedPresentation(() => {
      setState('connected');
      setError('');
    });

    onQuestionActivated((data: QuestionActivatedEvent) => {
      setActiveQuestion({
        id: data.questionId,
        text: data.text,
        type: data.type,
        configuration: data.configuration,
        liveStartedAt: data.startedAt,
        enableSentimentAnalysis: false, // These would come from the question data
        enableEmotionAnalysis: false,
        enableKeywordExtraction: false
      });
      setState('question_active');
      setHasResponded(false);
      setResponse('');
    });

    onQuestionDeactivated(() => {
      setActiveQuestion(null);
      setState('question_ended');
    });

    onLiveSessionEnded(() => {
      setState('presentation_ended');
      setActiveQuestion(null);
    });

    onResponseSubmitted(() => {
      setHasResponded(true);
      setState('response_submitted');
    });

    onError((data: ErrorEvent) => {
      setError(data.message);
      setState('error');
    });
  }, [onJoinedPresentation, onQuestionActivated, onQuestionDeactivated, onLiveSessionEnded, onResponseSubmitted, onError]);

  // Check for active question on connection
  useEffect(() => {
    const checkActiveQuestion = async () => {
      if (isConnected && presentationId && state === 'connected') {
        try {
          // Check if there's an active question when first connecting
          const activeQuestionData = await apiService.getActiveQuestionForPresentation(presentationId);
          if (activeQuestionData) {
            setActiveQuestion({
              id: activeQuestionData.id,
              text: activeQuestionData.text,
              type: activeQuestionData.type,
              configuration: activeQuestionData.configuration,
              liveStartedAt: activeQuestionData.liveStartedAt,
              enableSentimentAnalysis: activeQuestionData.enableSentimentAnalysis || false,
              enableEmotionAnalysis: activeQuestionData.enableEmotionAnalysis || false,
              enableKeywordExtraction: activeQuestionData.enableKeywordExtraction || false
            });
            setState('question_active');
          }
        } catch (err) {
          console.error('Failed to check active question:', err);
          // If no active question found, stay in connected state
        }
      }
    };

    checkActiveQuestion();
  }, [isConnected, presentationId, state]);

  const handleSubmitResponse = useCallback(async () => {
    if (!activeQuestion || !response.trim()) return;

    try {
      await submitResponse(activeQuestion.id, response, sessionId);
    } catch (err) {
      console.error('Failed to submit response:', err);
      setError('Failed to submit response');
    }
  }, [activeQuestion, response, sessionId, submitResponse]);

  const renderConnectionStatus = () => {
    if (isConnecting) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2">Connecting...</Typography>
        </Box>
      );
    }

    if (isConnected) {
      return <Chip label="Connected" color="success" size="small" />;
    }

    return <Chip label="Disconnected" color="error" size="small" />;
  };

  const renderQuestionForm = () => {
    if (!activeQuestion) return null;

    const { type, configuration } = activeQuestion;

    switch (type) {
      case QuestionType.MultipleChoiceSingle:
        return (
          <RadioGroup value={response} onChange={e => setResponse(e.target.value)}>
            {configuration?.options?.map((option: string, index: number) => (
              <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
            ))}
          </RadioGroup>
        );

      case QuestionType.MultipleChoiceMultiple:
        const currentResponses = response ? response.split(',') : [];
        return (
          <>
            {configuration?.options?.map((option: string, index: number) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={currentResponses.includes(option)}
                    onChange={e => {
                      if (e.target.checked) {
                        setResponse([...currentResponses, option].join(','));
                      } else {
                        setResponse(currentResponses.filter((v: string) => v !== option).join(','));
                      }
                    }}
                  />
                }
                label={option}
              />
            ))}
          </>
        );

      case QuestionType.NumericRating:
        const minRating = configuration?.minValue || 1;
        const maxRating = configuration?.maxValue || 10;
        return (
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>
              {configuration?.labels?.min} ({minRating}) - {configuration?.labels?.max} ({maxRating})
            </Typography>
            <Slider
              min={minRating}
              max={maxRating}
              step={configuration?.step || 1}
              value={response === "" ? minRating : parseInt(response)}
              onChange={(_, v) => setResponse(v.toString())}
              valueLabelDisplay="auto"
            />
          </Box>
        );

      case QuestionType.YesNo:
        return (
          <RadioGroup value={response} onChange={e => setResponse(e.target.value)}>
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>
        );


      case QuestionType.OpenEnded:
        return (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Type your answer..."
          />
        );

      case QuestionType.WordCloud:
        return (
          <TextField
            fullWidth
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter words separated by commas"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
          />
        );
    }
  };

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (state === 'error') {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (state === 'session_ended') {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6">Thank you for participating!</Typography>
          <Typography>The presentation has ended.</Typography>
        </Alert>
      );
    }

    if (state === 'presentation_ended') {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="h6">Presentation No Longer Live</Typography>
          <Typography>The presenter has ended the live session. Thank you for participating!</Typography>
        </Alert>
      );
    }

    if (state === 'question_ended') {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6">Question Ended</Typography>
          <Typography>The current question is no longer active. Please wait for the next question.</Typography>
        </Alert>
      );
    }

    if (state === 'response_submitted') {
      return (
        <StyledPaper>
          <Typography variant="h5" gutterBottom>
            Thank you for your responses!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your answers have been saved.
          </Typography>
        </StyledPaper>
      );
    }

    if (state === 'question_active' && activeQuestion) {
      return (
        <StyledPaper>
          {/* Question text */}
          <Typography variant="body1" gutterBottom>
            {activeQuestion.text}
          </Typography>
          {/* Render input for current question */}
          <Box sx={{ my: 2 }}>
            {renderQuestionForm()}
          </Box>
          {/* Submit button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmitResponse}
              disabled={!response.trim() || hasResponded}
              size="large"
            >
              {hasResponded ? 'Response Submitted' : 'Submit Response'}
            </Button>
          </Box>
        </StyledPaper>
      );
    }

    if (state === 'connected' || state === 'waiting') {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="h6">Waiting for Questions</Typography>
          <Typography>Please wait for the presenter to send a question.</Typography>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LiveSentiment - Audience View
          </Typography>
          {renderConnectionStatus()}
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        {presentation && (
          <StyledPaper>
            <Typography variant="h4" gutterBottom>
              {presentation.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Presented by: {presentation.presenterName}
            </Typography>
          </StyledPaper>
        )}

        {renderContent()}
      </Container>
    </Box>
  );
};

export default AudienceView; 