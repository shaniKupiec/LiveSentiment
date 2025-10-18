import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface YesNoStatsProps {
  results: QuestionResults | null;
}

const YesNoStats: React.FC<YesNoStatsProps> = ({ results }) => {
  if (!results?.yesNoCounts) return null;

  return (
    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yes/No Statistics
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Yes Responses
              </Typography>
              <Typography variant="h4" color="success.main">
                {results.yesNoCounts.yes}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(results.yesNoCounts.yes / (results.yesNoCounts.yes + results.yesNoCounts.no)) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                No Responses
              </Typography>
              <Typography variant="h4" color="error.main">
                {results.yesNoCounts.no}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(results.yesNoCounts.no / (results.yesNoCounts.yes + results.yesNoCounts.no)) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default YesNoStats;
