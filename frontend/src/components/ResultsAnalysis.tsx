import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Question } from '../types/question';
import { QuestionType } from '../types/question';
import QuestionResponseAccordion from './QuestionResponseAccordion';

const QuestionCard = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const QuestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const QuestionInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));

interface ResultsAnalysisProps {
  presentationId: string;
  presentationName?: string;
  questions: Question[];
  isLoading?: boolean;
}

const ResultsAnalysis: React.FC<ResultsAnalysisProps> = ({
  presentationId,
  presentationName,
  questions,
  isLoading = false
}) => {
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const handleAccordionToggle = (questionId: string) => {
    setExpandedAccordion(expandedAccordion === questionId ? null : questionId);
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

  const getQuestionTypeColor = (type: number): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case QuestionType.MultipleChoiceSingle:
      case QuestionType.MultipleChoiceMultiple:
        return 'primary';
      case QuestionType.NumericRating:
        return 'info';
      case QuestionType.YesNo:
        return 'success';
      case QuestionType.OpenEnded:
      case QuestionType.WordCloud:
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert severity="info">
        No questions available for analysis. Add questions to your presentation to see results and analysis.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Results & Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        View detailed results and analysis for each question in your presentation. Click on any question to see response data, statistics, and insights.
      </Typography>

      {questions.map((question) => (
        <Box key={question.id}>
          <QuestionCard>
            <QuestionHeader>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {question.order}. {question.text}
              </Typography>
            </QuestionHeader>
            
            <QuestionInfo>
              <Chip
                label={getQuestionTypeName(question.type)}
                size="small"
                color={getQuestionTypeColor(question.type)}
                variant="outlined"
              />
              {question.isLive && (
                <Chip
                  label="Currently Live"
                  size="small"
                  color="error"
                  variant="filled"
                />
              )}
            </QuestionInfo>
          </QuestionCard>
          
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

export default ResultsAnalysis;
