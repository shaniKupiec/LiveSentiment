import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import type { Question } from '../../types/question';
import type { QuestionResults } from '../../hooks/useQuestionResults';
import { QuestionType } from '../../types/question';
import { chartOptions, pieChartOptions } from '../../utils/chartOptions';

// Import chart components
import NumericRatingChart from '../charts/NumericRatingChart';
import ChoiceChart from '../charts/ChoiceChart';
import YesNoChart from '../charts/YesNoChart';
import ResponseTrendChart from '../charts/ResponseTrendChart';

// Import statistics components
import NumericStats from '../statistics/NumericStats';
import YesNoStats from '../statistics/YesNoStats';
import ChoiceStats from '../statistics/ChoiceStats';
import NLPAnalysisStats from '../statistics/NLPAnalysisStats';

interface DashboardTabProps {
  question: Question;
  results: QuestionResults | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isExpanded: boolean;
  onRefresh: () => Promise<void>;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  question,
  results,
  loading,
  error,
  lastUpdated,
  isExpanded,
  onRefresh
}) => {

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!results) {
    return (
      <Alert severity="info">
        No results available for this question.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">
            Analysis Dashboard
          </Typography>
          {question.isLive && isExpanded ? (
            <Chip
              label="Live Updates"
              size="small"
              color="success"
              variant="filled"
            />
          ) : question.isLive ? (
            <Chip
              label="Live (Not Active)"
              size="small"
              color="warning"
              variant="outlined"
            />
          ) : (
            <Chip
              label="Static Data"
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh data">
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {results.totalResponses} responses from {results.uniqueSessions} participants
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {/* Charts Row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Numeric Rating - Histogram */}
          {question.type === QuestionType.NumericRating && (
            <NumericRatingChart results={results} chartOptions={chartOptions} />
          )}

          {/* Choice Questions - Pie Chart */}
          {(question.type === QuestionType.MultipleChoiceSingle || 
            question.type === QuestionType.MultipleChoiceMultiple) && (
            <ChoiceChart 
              results={results} 
              chartOptions={chartOptions} 
              pieChartOptions={pieChartOptions} 
              showPieChart={true}
            />
          )}

          {/* Yes/No Questions - Doughnut Chart */}
          {question.type === QuestionType.YesNo && (
            <YesNoChart results={results} pieChartOptions={pieChartOptions} />
          )}

          {/* Choice Questions - Bar Chart */}
          {(question.type === QuestionType.MultipleChoiceSingle || 
            question.type === QuestionType.MultipleChoiceMultiple) && (
            <ChoiceChart 
              results={results} 
              chartOptions={chartOptions} 
              pieChartOptions={pieChartOptions} 
              showPieChart={false}
            />
          )}
        </Box>

        {/* NLP Analysis Statistics */}
        <NLPAnalysisStats question={question} results={results} />

        {/* Response Trends */}
        <ResponseTrendChart results={results} chartOptions={chartOptions} />

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Numeric Statistics */}
            <NumericStats results={results} />

            {/* Yes/No Statistics */}
            <YesNoStats results={results} />
          </Box>

          {/* Choice Statistics */}
          <ChoiceStats question={question} results={results} />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardTab;
