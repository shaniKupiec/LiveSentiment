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
  DialogActions
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  People,
  QuestionAnswer
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useSignalR } from "../hooks/useSignalR";
import { useMultipleQuestionResults } from "../hooks/useQuestionResults";
import { useQuestions } from "../contexts/QuestionsContext";
import QuestionItem from "./QuestionItem";

import { apiService } from "../services/api";
import type { ResponseReceivedEvent, AudienceCountUpdatedEvent } from "../types/signalr";

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
  onLiveSessionEnd?: () => void;
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


const LivePresentationManager: React.FC<LivePresentationManagerProps> = ({
  presentationId,
  presentationName,
  onLiveSessionEnd
}) => {
  const [liveStatus, setLiveStatus] = useState<LiveSessionStatus | null>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Use questions context
  const { activeQuestions, fetchQuestions, setQuestionLive } = useQuestions();
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

  // Use consolidated question results management
  const {
    expandedQuestions,
    toggleQuestion
  } = useMultipleQuestionResults(
    presentationId,
    activeQuestions.map(q => q.id),
    {
      pollingInterval: 10000,
      enableRealTime: true,
      enablePolling: true
    }
  );

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions(presentationId);
  }, [presentationId, fetchQuestions]);

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

  // Load initial audience count (no polling - relies on SignalR for updates)
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
      loadAudienceCount(); // Only load once initially
    }
  }, [presentationId, liveStatus?.isLive]);

  // Set up SignalR event handlers
  useEffect(() => {
    onResponseReceived((data: ResponseReceivedEvent) => {
      console.log('New response received:', data);
      // Refresh question results if this is the active question
      // Note: Individual question results will be refreshed automatically via their individual hooks
    });

    onAudienceCountUpdated((data: AudienceCountUpdatedEvent) => {
      setAudienceCount(data.count);
    });

    onJoinedPresenterSession(() => {
      console.log('Joined presenter session successfully');
    });
  }, [onResponseReceived, onAudienceCountUpdated, onJoinedPresenterSession, liveStatus?.activeQuestionId]);



  const handleActivateQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      await activateQuestion(questionId);
      const status = await apiService.getLiveSessionStatus(presentationId);
      setLiveStatus(status);
      
      // Update question live status in context
      setQuestionLive(questionId, true);
      
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
      
      // Update question live status in context
      setQuestionLive(questionId, false);
      
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
          // Question results are managed by the consolidated hook
          setError('');
          
          // Notify parent component that live session has ended
          if (onLiveSessionEnd) {
            onLiveSessionEnd();
          }
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
                <Typography variant="h4" color="primary.main">
                  {activeQuestions.reduce((total, q) => total + (q.responseCount || 0), 0)}
                </Typography>
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



  const renderQuestions = () => {

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Questions ({activeQuestions.length})
        </Typography>
        
        {activeQuestions.map((question, index) => (
          <QuestionItem
            key={question.id}
            questionId={question.id}
            presentationId={presentationId}
            presentationName={presentationName}
            index={index}
            onActivateQuestion={handleActivateQuestion}
            onDeactivateQuestion={handleDeactivateQuestion}
            loading={loading}
            expandedQuestions={expandedQuestions}
            toggleQuestion={toggleQuestion}
          />
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
