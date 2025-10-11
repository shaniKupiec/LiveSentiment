import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  keyframes
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Share as ShareIcon,
  RadioButtonUnchecked as LiveIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { apiService } from '../services/api';
import { useSignalR } from '../hooks/useSignalR';
import { usePresentations } from '../contexts/PresentationContext';
import { usePresentationOperations, useLiveSessionOperations } from '../hooks/usePresentationOperations';
import type { Presentation } from '../types/presentation';
import type { Question as QuestionType } from '../types/question';
import { QuestionType as QuestionTypeEnum } from '../types/question';
import QuestionsManagement from './QuestionsManagement';
import PresentationForm from './PresentationForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { formatDate } from '../utils/dateUtils';
import QRCode from 'qrcode';

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

const LiveIndicator = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  fontWeight: 'bold',
}));

// Helper function to get question type label
const getQuestionTypeLabel = (type: number): string => {
  switch (type) {
    case QuestionTypeEnum.MultipleChoiceSingle:
      return 'Multiple Choice (Single)';
    case QuestionTypeEnum.MultipleChoiceMultiple:
      return 'Multiple Choice (Multiple)';
    case QuestionTypeEnum.NumericRating:
      return 'Numeric Rating';
    case QuestionTypeEnum.YesNo:
      return 'Yes/No';
    case QuestionTypeEnum.SliderScale:
      return 'Slider Scale';
    case QuestionTypeEnum.OpenEnded:
      return 'Open-ended Text';
    case QuestionTypeEnum.WordCloud:
      return 'Word Cloud';
    default:
      return 'Unknown Type';
  }
};

interface PresentationDetailViewProps {
  presentation: Presentation;
  onPresentationUpdate: () => void;
  onPresentationDelete: () => void;
  onBack: () => void;
}

const PresentationDetailView: React.FC<PresentationDetailViewProps> = ({
  presentation: initialPresentation,
  onPresentationUpdate,
  onPresentationDelete,
  onBack
}) => {
  // Use the new context and hooks
  const { selectedPresentation } = usePresentations();
  const { updatePresentation, deletePresentation } = usePresentationOperations();
  const { startLiveSession, stopLiveSession, activateQuestion, loading: liveSessionLoading } = useLiveSessionOperations();
  
  // Use selected presentation from context or fallback to initial
  const presentation = selectedPresentation || initialPresentation;
  const isLive = presentation.isLive;
  
  const [activeTab, setActiveTab] = useState(0);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Live session states
  const [confirmStartDialogOpen, setConfirmStartDialogOpen] = useState(false);
  
  // QR Code states
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  
  // SignalR hook for live session management
  const {
    connect,
    joinPresenterSession,
    startLiveSession: signalRStartLiveSession,
    activateQuestion: signalRActivateQuestion
  } = useSignalR({ autoConnect: false });

  // Presentation state is now managed by the context

  // Load questions when component mounts
  useEffect(() => {
    loadQuestions();
  }, [presentation.id]);


  const loadQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const questionsData = await apiService.getQuestions(presentation.id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load questions:', error);
      setError('Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditPresentation = () => {
    setFormOpen(true);
  };

  const handleDeletePresentation = () => {
    setDeleteDialogOpen(true);
  };

  const handleStartPresentation = () => {
    setConfirmStartDialogOpen(true);
  };

  const handleConfirmStartLiveSession = async () => {
    try {
      setConfirmStartDialogOpen(false);
      
      // Initialize SignalR connection
      await connect();
      await joinPresenterSession(presentation.id);
      
      // Start live session via API (with optimistic updates)
      await startLiveSession(presentation.id);
      
      // Start live session via SignalR
      await signalRStartLiveSession(presentation.id);
      
    } catch (error) {
      console.error('Failed to start live session:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to start live session');
      }
    }
  };

  const handleActivateQuestion = async (questionId: string) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const isCurrentlyLive = question.isLive;
      
      // Update local state optimistically
      setQuestions(prevQuestions => 
        prevQuestions.map(q => ({
          ...q,
          isLive: q.id === questionId ? !isCurrentlyLive : false, // Toggle current question, deactivate others
          liveStartedAt: q.id === questionId && !isCurrentlyLive ? new Date().toISOString() : undefined,
          liveEndedAt: q.id === questionId && isCurrentlyLive ? new Date().toISOString() : q.liveEndedAt
        }))
      );
      
      if (isCurrentlyLive) {
        // Deactivate question via API
        await apiService.deactivateQuestion(presentation.id, questionId);
        console.log('✅ Question deactivated successfully');
      } else {
        // Activate question via API
        await activateQuestion(presentation.id, questionId);
        
        // Activate question via SignalR
        await signalRActivateQuestion(questionId);
        console.log('✅ Question activated successfully');
      }
      
    } catch (error) {
      console.error('Failed to toggle question status:', error);
      setError('Failed to toggle question status');
      
      // Rollback optimistic update on error
      setQuestions(prevQuestions => 
        prevQuestions.map(q => ({
          ...q,
          isLive: false,
          liveStartedAt: undefined,
          liveEndedAt: undefined
        }))
      );
    }
  };

  const handleStopLiveSession = async () => {
    try {
      // Update local state optimistically - deactivate all questions
      setQuestions(prevQuestions => 
        prevQuestions.map(q => ({
          ...q,
          isLive: false,
          liveEndedAt: new Date().toISOString()
        }))
      );
      
      // Stop live session via API (with optimistic updates)
      await stopLiveSession(presentation.id);
      
    } catch (error) {
      console.error('Failed to stop live session:', error);
      setError('Failed to stop live session');
    }
  };

  const handleUpdatePresentation = async (formData: any) => {
    try {
      setFormLoading(true);
      await updatePresentation(presentation.id, formData);
      setFormOpen(false);
      
      // Only call parent update if needed (for other components that might depend on this data)
      onPresentationUpdate();
    } catch (error) {
      console.error('Failed to update presentation:', error);
      setError('Failed to update presentation');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deletePresentation(presentation.id);
      setDeleteDialogOpen(false);
      onPresentationDelete();
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      setError('Failed to delete presentation');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuestionsChange = () => {
    loadQuestions();
  };

  const generateQRCode = async () => {
    if (!presentation) return;
    
    setQrCodeLoading(true);
    try {
      const audienceUrl = `${window.location.origin}/audience/${presentation.id}`;
      const qrDataUrl = await QRCode.toDataURL(audienceUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleShowQRCode = () => {
    setQrCodeDialogOpen(true);
    if (!qrCodeDataUrl) {
      generateQRCode();
    }
  };

  const handleCopyLink = async () => {
    try {
      const audienceUrl = `${window.location.origin}/audience/${presentation.id}`;
      await navigator.clipboard.writeText(audienceUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
      setError('Failed to copy link');
    }
  };

  return (
    <Box>
      {/* Header with back button and presentation info */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ mr: 2 }}
        >
          ← Back to Presentations
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h2">
              {presentation.title}
            </Typography>
            {presentation.isLive && (
              <LiveIndicator 
                label="LIVE" 
                size="small"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            {presentation.label && (
              <Chip
                label={presentation.label.name}
                style={{ backgroundColor: presentation.label.color, color: 'white' }}
                size="small"
              />
            )}
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(presentation.createdDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Questions: {questions.length}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Presentation">
            <IconButton onClick={handleEditPresentation}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Presentation">
            <IconButton onClick={handleDeletePresentation} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      {/* Tabs for different views */}
      <Paper>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Questions Management" />
          <Tab label="Live Session" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Questions for this presentation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add, edit, and organize questions for your live presentation. Questions can be multiple choice, yes/no, numeric ratings, or open-ended text.
              </Typography>
              
              {questionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <QuestionsManagement
                  presentation={presentation}
                  questions={questions}
                  onQuestionsChange={handleQuestionsChange}
                  isLoading={questionsLoading}
                />
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Live Session Management
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {!isLive ? (
                // Not Live - Show Start Live Session Button
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Start a live session to share this presentation with your audience and collect real-time responses.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<StartIcon />}
                      onClick={handleStartPresentation}
                      disabled={questions.length === 0 || liveSessionLoading}
                      sx={{
                        background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049 30%, #3d8b40 90%)',
                        }
                      }}
                    >
                      {liveSessionLoading ? 'Starting...' : 'Start Live Session'}
                    </Button>
                    
                    {questions.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Add questions before starting a live session
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : (
                // Live - Show Share Link and Questions Management
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Your presentation is now live! Share the link below with your audience, then activate questions to collect responses.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleStopLiveSession}
                      disabled={liveSessionLoading}
                      sx={{ ml: 2 }}
                    >
                      {liveSessionLoading ? 'Stopping...' : 'Stop Live Session'}
                    </Button>
                  </Box>
                  
                  {/* Share Link Section */}
                  <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" gutterBottom>
                      📱 Share with Audience
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Share this link or QR code with your audience so they can join the presentation:
                    </Typography>
                    
                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                       <Button
                         variant="outlined"
                         startIcon={<ShareIcon />}
                         onClick={handleCopyLink}
                       >
                         Copy Link
                       </Button>
                       <Button
                         variant="outlined"
                         startIcon={<QrCodeIcon />}
                         onClick={handleShowQRCode}
                       >
                         Show QR Code
                       </Button>
                       <Typography variant="body2" color="text.secondary">
                         {`${window.location.origin}/audience/${presentation.id}`}
                       </Typography>
                     </Box>
                  </Paper>
                  
                  {/* Questions List with Live Buttons */}
                  <Typography variant="h6" gutterBottom>
                    🎯 Questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Click "Go Live" on any question to start collecting responses from your audience.
                  </Typography>
                  
                  {questions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No questions available. Add questions in the Questions Management tab.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {questions.map((question, index) => (
                        <Paper key={question.id} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                              {getQuestionTypeLabel(question.type)}
                            </Typography>
                          </Box>
                          <Button
                            variant={question.isLive ? "outlined" : "contained"}
                            size="small"
                            startIcon={<LiveIcon />}
                            onClick={() => handleActivateQuestion(question.id)}
                            disabled={liveSessionLoading}
                            sx={{
                              backgroundColor: question.isLive ? 'transparent' : '#4CAF50',
                              color: question.isLive ? '#4CAF50' : 'white',
                              borderColor: '#4CAF50',
                              '&:hover': {
                                backgroundColor: question.isLive ? '#f5f5f5' : '#45a049',
                              }
                            }}
                          >
                            {liveSessionLoading ? 'Activating...' : question.isLive ? 'Finish Live' : 'Go Live'}
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Presentation Form */}
      <PresentationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdatePresentation}
        presentation={presentation}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={presentation.title}
        isLoading={deleteLoading}
      />

      {/* Confirmation Dialog for Starting Live Session */}
      <Dialog
        open={confirmStartDialogOpen}
        onClose={() => setConfirmStartDialogOpen(false)}
        aria-labelledby="confirm-start-dialog-title"
        aria-describedby="confirm-start-dialog-description"
      >
        <DialogTitle id="confirm-start-dialog-title">
          Start Live Session
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-start-dialog-description">
            Are you sure you want to start the live session for "{presentation.title}"? 
            This will make your presentation available to the audience and enable real-time responses.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStartDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmStartLiveSession} 
            color="primary" 
            variant="contained"
            disabled={liveSessionLoading}
            autoFocus
          >
            {liveSessionLoading ? 'Starting...' : 'Start Live Session'}
           </Button>
         </DialogActions>
       </Dialog>

       {/* QR Code Dialog */}
       <Dialog
         open={qrCodeDialogOpen}
         onClose={() => setQrCodeDialogOpen(false)}
         aria-labelledby="qr-code-dialog-title"
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle id="qr-code-dialog-title">
           QR Code for Audience
         </DialogTitle>
         <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
           <Typography variant="body2" color="text.secondary" paragraph>
             Scan this QR code with your mobile device to join the presentation:
           </Typography>
           
           {qrCodeLoading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
               <CircularProgress />
             </Box>
           ) : qrCodeDataUrl ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
               <img 
                 src={qrCodeDataUrl} 
                 alt="QR Code for presentation" 
                 style={{ maxWidth: '100%', height: 'auto' }}
               />
             </Box>
           ) : null}
           
           <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
             {`${window.location.origin}/audience/${presentation.id}`}
           </Typography>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setQrCodeDialogOpen(false)} color="primary">
             Close
           </Button>
           <Button 
             onClick={handleCopyLink} 
             color="primary" 
             variant="outlined"
           >
             Copy Link
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };
 
 export default PresentationDetailView;
