import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface NumericStatsProps {
  results: QuestionResults | null;
}

const NumericStats: React.FC<NumericStatsProps> = ({ results }) => {
  if (!results?.numericStats) return null;

  return (
    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Numeric Statistics
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Average
              </Typography>
              <Typography variant="h4" color="primary">
                {results.numericStats.average.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Median
              </Typography>
              <Typography variant="h4" color="secondary">
                {results.numericStats.median.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Range: {results.numericStats.min} - {results.numericStats.max}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Count
              </Typography>
              <Typography variant="h6">
                {results.numericStats.count}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NumericStats;
