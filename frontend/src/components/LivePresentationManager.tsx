import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  Send,
  People,
  QuestionAnswer,
  Cancel
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useSignalR } from "../hooks/useSignalR";
import { apiService } from "../services/api";
import type { Question } from "../types/question";
import { QuestionType } from "../types/question";
import type { ResponseReceivedEvent, AudienceCountUpdatedEvent } from "../types/signalr";

const LiveCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  color: theme.palette.success.contrastText,
  marginBottom: theme.spacing(2),
}));

const QuestionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  border: `2px solid ${theme.palette.primary.main}`,
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

interface LivePresentationManagerProps {
  presentationId: string;
  questions: Question[];
  onRefreshQuestions: () => void;
}

interface LiveSessionStatus {
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
  activeQuestionId?: string;
  activeQuestionText?: string;
  activeQuestionType?: number;
  activeQuestionStartedAt?: string;
  totalQuestions: number;
}

interface QuestionResults {
  questionId: string;
  questionText: string;
  questionType: number;
  isLive: boolean;
  totalResponses: number;
  uniqueSessions: number;
  responses: Array<{
    id: string;
    value: string;
    sessionId: string;
    timestamp: string;
  }>;
  choiceCounts?: Record<string, number>;
  numericStats?: {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  };
  yesNoCounts?: {
    yes: number;
    no: number;
  };
}

const LivePresentationManager: React.FC<LivePresentationManagerProps> = ({
  presentationId,
  questions,
  onRefreshQuestions
}) => {
  const [liveStatus, setLiveStatus] = useState<LiveSessionStatus | null>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {}
  });

  const {
    isConnected,
    isConnecting,
    connect,
    joinPresenterSession,
    startLiveSession,
    endLiveSession,
    activateQuestion,
    deactivateQuestion,
    onResponseReceived,
    onAudienceCountUpdated,
    onJoinedPresenterSession
  } = useSignalR({ autoConnect: false });

  // Initialize SignalR connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setLoading(true);
        await connect();
        await joinPresenterSession(presentationId);
      } catch (err) {
        console.error('Failed to initialize SignalR connection:', err);
        setError('Failed to connect to live session');
      } finally {
        setLoading(false);
      }
    };

    initializeConnection();
  }, [presentationId, connect, joinPresenterSession]);

  // Load live session status
  useEffect(() => {
    const loadLiveStatus = async () => {
      try {
        const status = await apiService.getLiveSessionStatus(presentationId);
        setLiveStatus(status);
      } catch (err) {
        console.error('Failed to load live status:', err);
      }
    };

    loadLiveStatus();
  }, [presentationId]);

  // Load audience count
  useEffect(() => {
    const loadAudienceCount = async () => {
      try {
        const count = await apiService.getAudienceCount(presentationId);
        setAudienceCount(count.audienceCount);
      } catch (err) {
        console.error('Failed to load audience count:', err);
      }
    };

    if (liveStatus?.isLive) {
      loadAudienceCount();
      const interval = setInterval(loadAudienceCount, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [presentationId, liveStatus?.isLive]);

  // Set up SignalR event handlers
  useEffect(() => {
    onResponseReceived((data: ResponseReceivedEvent) => {
      console.log('New response received:', data);
      // Refresh question results if this is the active question
      if (liveStatus?.activeQuestionId === data.questionId) {
        loadQuestionResults(liveStatus.activeQuestionId);
      }
    });

    onAudienceCountUpdated((data: AudienceCountUpdatedEvent) => {
      setAudienceCount(data.count);
    });

    onJoinedPresenterSession(() => {
      console.log('Joined presenter session successfully');
    });
  }, [onResponseReceived, onAudienceCountUpdated, onJoinedPresenterSession, liveStatus?.activeQuestionId]);

  const loadQuestionResults = async (questionId: string) => {
    try {
      const results = await apiService.getQuestionResults(presentationId, questionId);
      setQuestionResults(results);
    } catch (err) {
      console.error('Failed to load question results:', err);
    }
  };

  const handleStartLiveSession = () => {
    setConfirmDialog({
      open: true,
      title: 'Start Live Session',
      message: 'Are you sure you want to start the live session? This will make the presentation available to the audience.',
      action: async () => {
        try {
          setLoading(true);
          await startLiveSession(presentationId);
          const status = await apiService.getLiveSessionStatus(presentationId);
          setLiveStatus(status);
          setError('');
        } catch (err) {
          console.error('Failed to start live session:', err);
          setError('Failed to start live session');
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };

  const handleStopLiveSession = () => {
    setConfirmDialog({
      open: true,
      title: 'Stop Live Session',
      message: 'Are you sure you want to stop the live session? This will end the presentation for all audience members.',
      action: async () => {
        try {
          setLoading(true);
          await endLiveSession(presentationId);
          const status = await apiService.getLiveSessionStatus(presentationId);
          setLiveStatus(status);
          setQuestionResults(null);
          setError('');
        } catch (err) {
          console.error('Failed to stop live session:', err);
          setError('Failed to stop live session');
        } finally {
          setLoading(false);
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };

  const handleActivateQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      await activateQuestion(questionId);
      const status = await apiService.getLiveSessionStatus(presentationId);
      setLiveStatus(status);
      await loadQuestionResults(questionId);
      setError('');
    } catch (err) {
      console.error('Failed to activate question:', err);
      setError('Failed to activate question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      await deactivateQuestion(questionId);
      const status = await apiService.getLiveSessionStatus(presentationId);
      setLiveStatus(status);
      setQuestionResults(null);
      setError('');
    } catch (err) {
      console.error('Failed to deactivate question:', err);
      setError('Failed to deactivate question');
    } finally {
      setLoading(false);
    }
  };

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

  const renderLiveStatus = () => {
    if (!liveStatus) return null;

    if (liveStatus.isLive) {
      return (
        <LiveCard>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" gutterBottom>
                  🟢 Live Session Active
                </Typography>
                <Typography variant="body2">
                  Started: {new Date(liveStatus.liveStartedAt!).toLocaleTimeString()}
                </Typography>
                {liveStatus.activeQuestionId && (
                  <Typography variant="body2">
                    Active Question: {liveStatus.activeQuestionText}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={1}>
                {renderConnectionStatus()}
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopLiveSession}
                  disabled={loading}
                >
                  Stop Live
                </Button>
              </Box>
            </Box>
          </CardContent>
        </LiveCard>
      );
    }

    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                ⚫ Session Not Live
              </Typography>
              <Typography variant="body2">
                Start the live session to allow audience participation
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              {renderConnectionStatus()}
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={handleStartLiveSession}
                disabled={loading || !isConnected}
              >
                Start Live
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderAudienceStats = () => {
    if (!liveStatus?.isLive) return null;

    return (
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <StatsCard sx={{ flex: 1 }}>
          <People fontSize="large" />
          <Typography variant="h4">{audienceCount}</Typography>
          <Typography variant="body2">Audience Members</Typography>
        </StatsCard>
        <StatsCard sx={{ flex: 1 }}>
          <QuestionAnswer fontSize="large" />
          <Typography variant="h4">{questionResults?.totalResponses || 0}</Typography>
          <Typography variant="body2">Total Responses</Typography>
        </StatsCard>
      </Box>
    );
  };

  const renderQuestions = () => {
    const activeQuestions = questions.filter(q => q.isActive);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Questions ({activeQuestions.length})
        </Typography>
        <List>
          {activeQuestions.map((question) => (
            <QuestionCard key={question.id}>
              <ListItem>
                <ListItemText
                  primary={question.text}
                  secondary={`Type: ${getQuestionTypeName(question.type)} • Order: ${question.order}`}
                />
                <ListItemSecondaryAction>
                  {liveStatus?.activeQuestionId === question.id ? (
                    <Box display="flex" gap={1}>
                      <Chip label="ACTIVE" color="success" size="small" />
                      <IconButton
                        color="error"
                        onClick={() => handleDeactivateQuestion(question.id)}
                        disabled={loading}
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                  ) : (
                    <IconButton
                      color="primary"
                      onClick={() => handleActivateQuestion(question.id)}
                      disabled={loading || !liveStatus?.isLive}
                    >
                      <Send />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            </QuestionCard>
          ))}
        </List>
      </Box>
    );
  };

  const renderQuestionResults = () => {
    if (!questionResults || !liveStatus?.activeQuestionId) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Live Results
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {questionResults.questionText}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {questionResults.totalResponses} responses from {questionResults.uniqueSessions} participants
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {questionResults.choiceCounts && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Choice Distribution:</Typography>
              {Object.entries(questionResults.choiceCounts).map(([choice, count]) => (
                <Box key={choice} display="flex" justifyContent="space-between" mb={1}>
                  <Typography>{choice}</Typography>
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </Box>
          )}
          
          {questionResults.numericStats && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Numeric Statistics:</Typography>
              <Typography>Average: {questionResults.numericStats.average.toFixed(2)}</Typography>
              <Typography>Min: {questionResults.numericStats.min}</Typography>
              <Typography>Max: {questionResults.numericStats.max}</Typography>
              <Typography>Median: {questionResults.numericStats.median}</Typography>
            </Box>
          )}
          
          {questionResults.yesNoCounts && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Yes/No Results:</Typography>
              <Typography>Yes: {questionResults.yesNoCounts.yes}</Typography>
              <Typography>No: {questionResults.yesNoCounts.no}</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const getQuestionTypeName = (type: number): string => {
    switch (type) {
      case QuestionType.MultipleChoiceSingle: return 'Multiple Choice (Single)';
      case QuestionType.MultipleChoiceMultiple: return 'Multiple Choice (Multiple)';
      case QuestionType.NumericRating: return 'Numeric Rating';
      case QuestionType.YesNo: return 'Yes/No';
      case QuestionType.SliderScale: return 'Slider Scale';
      case QuestionType.OpenEnded: return 'Open Ended';
      case QuestionType.WordCloud: return 'Word Cloud';
      default: return 'Unknown';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {renderLiveStatus()}
      {renderAudienceStats()}
      {renderQuestions()}
      {renderQuestionResults()}

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={confirmDialog.action} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LivePresentationManager;
