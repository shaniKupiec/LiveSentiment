import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface ChoiceChartProps {
  results: QuestionResults | null;
  chartOptions: any;
  pieChartOptions: any;
  showPieChart?: boolean;
}

const ChoiceChart: React.FC<ChoiceChartProps> = ({ 
  results, 
  chartOptions, 
  pieChartOptions, 
  showPieChart = false 
}) => {
  const getChoiceChartData = () => {
    if (!results?.responses) return null;

    // Process responses to handle comma-separated values for multiple choice
    const choiceCounts: Record<string, number> = {};
    
    results.responses.forEach((response: any) => {
      // Split by comma and trim whitespace for multiple choice questions
      const choices = response.value.split(',').map((choice: string) => choice.trim());
      
      choices.forEach((choice: string) => {
        if (choice) {
          choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
        }
      });
    });

    const labels = Object.keys(choiceCounts);
    const data = Object.values(choiceCounts);
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 205, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
      'rgba(83, 102, 255, 0.6)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Response Count',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => color.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = getChoiceChartData();
  
  if (!chartData) return null;

  const ChartComponent = showPieChart ? Pie : Bar;
  const title = showPieChart ? 'Response Distribution (Pie Chart)' : 'Response Count (Bar Chart)';

  return (
    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height: 300 }}>
            <ChartComponent 
              data={chartData} 
              options={showPieChart ? pieChartOptions : chartOptions} 
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChoiceChart;
