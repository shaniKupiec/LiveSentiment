import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  QuestionAnswer
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useQuestions } from '../contexts/QuestionsContext';
import QuestionResponseAccordion from './QuestionResponseAccordion';
import { getQuestionTypeDisplayName } from '../utils/questionTypeUtils';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
}));

const QuestionContent = styled(Box)(() => ({
  flexGrow: 1,
}));

const QuestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
}));

const QuestionActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
}));

interface QuestionItemProps {
  questionId: string;
  presentationId: string;
  presentationName?: string;
  index: number;
  onActivateQuestion: (questionId: string) => Promise<void>;
  onDeactivateQuestion: (questionId: string) => Promise<void>;
  loading: boolean;
  expandedQuestions: Set<string>;
  toggleQuestion: (questionId: string) => void;
  getQuestionResults: (questionId: string) => any;
  getLoadingState: (questionId: string) => boolean;
  getErrorState: (questionId: string) => string | null;
  lastUpdated: Date | null;
  refreshQuestionResults: (questionId: string) => Promise<void>;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  questionId,
  presentationId,
  presentationName,
  index,
  onActivateQuestion,
  onDeactivateQuestion,
  loading,
  expandedQuestions,
  toggleQuestion,
  getQuestionResults,
  getLoadingState,
  getErrorState,
  lastUpdated,
  refreshQuestionResults
}) => {
  const { getQuestionById } = useQuestions();
  
  const question = getQuestionById(questionId);
  
  if (!question) {
    return (
      <StyledPaper>
        <Typography variant="body2" color="error">
          Question not found: {questionId}
        </Typography>
      </StyledPaper>
    );
  }

  const handleActivateQuestion = () => {
    onActivateQuestion(questionId);
  };

  const handleDeactivateQuestion = () => {
    onDeactivateQuestion(questionId);
  };

  const handleAccordionToggle = () => {
    toggleQuestion(questionId);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <StyledPaper>
        <QuestionContent>
          <QuestionHeader>
            <Typography variant="body1" fontWeight="medium">
              {index + 1}. {question.text}
            </Typography>
            {question.isLive && (
              <Chip
                label="LIVE"
                color="success"
                size="small"
                sx={{
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            )}
          </QuestionHeader>
          <Typography variant="body2" color="text.secondary">
            Type: {getQuestionTypeDisplayName(question.type, true)}
          </Typography>
        </QuestionContent>
        
        <QuestionActions>
          {loading && <CircularProgress size={20} />}
          
          {question.isLive ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={handleDeactivateQuestion}
              disabled={loading}
              size="small"
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleActivateQuestion}
              disabled={loading}
              size="small"
            >
              Activate
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<QuestionAnswer />}
            onClick={handleAccordionToggle}
            size="small"
            sx={{
              color: '#2196F3',
              borderColor: '#2196F3',
              '&:hover': {
                backgroundColor: '#f3f8ff',
              }
            }}
          >
            View Responses
          </Button>
        </QuestionActions>
      </StyledPaper>
      
      {/* Accordion for this question */}
      <QuestionResponseAccordion
        question={question}
        presentationId={presentationId}
        presentationName={presentationName}
        isExpanded={expandedQuestions.has(questionId)}
        onToggle={handleAccordionToggle}
        sharedResults={getQuestionResults(questionId)}
        sharedLoading={getLoadingState(questionId)}
        sharedError={getErrorState(questionId)}
        sharedLastUpdated={lastUpdated}
        onRefresh={() => refreshQuestionResults(questionId)}
      />
    </Box>
  );
};

export default QuestionItem;
