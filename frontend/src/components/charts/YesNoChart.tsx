import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface YesNoChartProps {
  results: QuestionResults | null;
  pieChartOptions: any;
}

const YesNoChart: React.FC<YesNoChartProps> = ({ results, pieChartOptions }) => {
  const getYesNoChartData = () => {
    if (!results?.yesNoCounts) return null;

    const { yes, no } = results.yesNoCounts;

    return {
      labels: ['Yes', 'No'],
      datasets: [
        {
          data: [yes, no],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = getYesNoChartData();
  
  if (!chartData) return null;

  return (
    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yes/No Distribution
          </Typography>
          <Box sx={{ height: 300 }}>
            <Doughnut data={chartData} options={pieChartOptions} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default YesNoChart;
