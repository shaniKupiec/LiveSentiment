import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import type { Question } from '../../types/question';
import type { QuestionResults } from '../../hooks/useQuestionResults';
import { QuestionType } from '../../types/question';

interface ChoiceStatsProps {
  question: Question;
  results: QuestionResults | null;
}

const ChoiceStats: React.FC<ChoiceStatsProps> = ({ question, results }) => {
  if ((question.type !== QuestionType.MultipleChoiceSingle && 
       question.type !== QuestionType.MultipleChoiceMultiple) || 
      !results?.responses) {
    return null;
  }

  // Process responses to handle comma-separated values
  const choiceCounts: Record<string, number> = {};
  
  results!.responses.forEach((response: any) => {
    const choices = response.value.split(',').map((choice: string) => choice.trim());
    choices.forEach((choice: string) => {
      if (choice) {
        choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
      }
    });
  });

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Choice Statistics
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Object.entries(choiceCounts).map(([choice, count]) => {
              const percentage = (count / results!.totalResponses) * 100;
              return (
                <Box key={choice} sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {choice}
                    </Typography>
                    <Typography variant="h5">
                      {count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {percentage.toFixed(1)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChoiceStats;
