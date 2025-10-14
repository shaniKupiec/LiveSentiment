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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  Send,
  People,
  QuestionAnswer,
  Cancel
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";
import { useSignalR } from "../hooks/useSignalR";

// Pulse animation for live status
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
`;
import { apiService } from "../services/api";
import type { Question } from "../types/question";
import { QuestionType } from "../types/question";
import type { ResponseReceivedEvent, AudienceCountUpdatedEvent } from "../types/signalr";
import QuestionResponseAccordion from "./QuestionResponseAccordion";

const CombinedStatusCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.success.main}20`, // 20% opacity
  backgroundColor: `${theme.palette.success.main}08`, // 8% opacity
}));

const StatusSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRight: `1px solid ${theme.palette.divider}`,
  flex: 1,
}));

const StatsSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  display: 'flex',
  gap: theme.spacing(2),
}));

const StatItem = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  flex: 1,
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.primary.main}20`, // 20% opacity
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.primary.main}08`, // 8% opacity
}));

interface LivePresentationManagerProps {
  presentationId: string;
  presentationName?: string;
  questions: Question[];
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
  presentationName,
  questions
}) => {
  const [liveStatus, setLiveStatus] = useState<LiveSessionStatus | null>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
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
      return results;
    } catch (err) {
      console.error('Failed to load question results:', err);
      throw err;
    }
  };

  const handleAccordionToggle = (questionId: string) => {
    setExpandedAccordion(expandedAccordion === questionId ? null : questionId);
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
        <CombinedStatusCard>
          <Box display="flex">
            <StatusSection>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color="success.main">
                  🟢 Live Session Active
                </Typography>
                <Box display="flex" gap={1}>
                  {renderConnectionStatus()}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleStopLiveSession}
                    disabled={loading}
                    size="small"
                  >
                    Stop Live
                  </Button>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Started: {new Date(liveStatus.liveStartedAt!).toLocaleTimeString()}
              </Typography>
              {liveStatus.activeQuestionId && (
                <Typography variant="body2" color="text.secondary">
                  Active Question: {liveStatus.activeQuestionText}
                </Typography>
              )}
            </StatusSection>
            <StatsSection>
              <StatItem>
                <People fontSize="large" color="primary" />
                <Typography variant="h4" color="primary.main">{audienceCount}</Typography>
                <Typography variant="body2" color="text.secondary">Audience Members</Typography>
              </StatItem>
              <StatItem>
                <QuestionAnswer fontSize="large" color="primary" />
                <Typography variant="h4" color="primary.main">{questionResults?.totalResponses || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Responses</Typography>
              </StatItem>
            </StatsSection>
          </Box>
        </CombinedStatusCard>
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
    // This function is no longer needed as stats are now integrated into the status card
    return null;
  };

  const getQuestionTypeName = (type: number): string => {
    switch (type) {
      case QuestionType.MultipleChoiceSingle: return 'Single Choice';
      case QuestionType.MultipleChoiceMultiple: return 'Multiple Choice';
      case QuestionType.NumericRating: return 'Numeric Rating';
      case QuestionType.YesNo: return 'Yes/No';
      case QuestionType.OpenEnded: return 'Open Ended';
      case QuestionType.WordCloud: return 'Word Cloud';
      default: return 'Unknown';
    }
  };

  const renderQuestions = () => {
    const activeQuestions = questions.filter(q => q.isActive);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Questions ({activeQuestions.length})
        </Typography>
        
        {activeQuestions.map((question, index) => (
          <Box key={question.id} sx={{ mb: 2 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {index + 1}. {question.text}
                  </Typography>
                  {question.isLive && (
                    <Chip
                      label="LIVE"
                      size="small"
                      sx={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: `${pulse} 2s infinite`
                      }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {getQuestionTypeName(question.type)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {liveStatus?.activeQuestionId === question.id ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => handleDeactivateQuestion(question.id)}
                    disabled={loading}
                    sx={{
                      backgroundColor: 'transparent',
                      color: '#4CAF50',
                      borderColor: '#4CAF50',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                  >
                    Finish Live
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Send />}
                    onClick={() => handleActivateQuestion(question.id)}
                    disabled={loading || !liveStatus?.isLive}
                    sx={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#45a049',
                      }
                    }}
                  >
                    Go Live
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAccordionToggle(question.id)}
                  sx={{
                    borderColor: '#2196F3',
                    color: '#2196F3',
                    '&:hover': {
                      backgroundColor: '#f3f8ff',
                    }
                  }}
                >
                  View Responses
                </Button>
              </Box>
            </Paper>
            
            {/* Accordion for this question */}
            <QuestionResponseAccordion
              question={question}
              presentationId={presentationId}
              presentationName={presentationName}
              isExpanded={expandedAccordion === question.id}
              onToggle={handleAccordionToggle}
            />
          </Box>
        ))}
      </Box>
    );
  };



  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {renderLiveStatus()}
      {renderQuestions()}

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
