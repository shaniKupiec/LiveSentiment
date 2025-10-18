import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface ResponseTrendChartProps {
  results: QuestionResults | null;
  chartOptions: any;
}

const ResponseTrendChart: React.FC<ResponseTrendChartProps> = ({ results, chartOptions }) => {
  const getResponseTrendData = () => {
    if (!results?.responses || results.responses.length === 0) return null;

    // Group responses by time intervals - use seconds intervals for better granularity
    const timeGroups: Record<string, number> = {};
    const intervalSeconds = 10; // Use 10-second intervals

    results.responses.forEach((response: any) => {
      const date = new Date(response.timestamp);
      const intervalStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        Math.floor(date.getSeconds() / intervalSeconds) * intervalSeconds
      );
      const key = intervalStart.toISOString();
      timeGroups[key] = (timeGroups[key] || 0) + 1;
    });

    const sortedTimes = Object.keys(timeGroups).sort();
    
    // If we have too many data points, group them into larger intervals
    if (sortedTimes.length > 30) {
      const largerIntervalSeconds = Math.ceil(sortedTimes.length / 15) * intervalSeconds;
      const largerTimeGroups: Record<string, number> = {};
      
      results.responses.forEach((response: any) => {
        const date = new Date(response.timestamp);
        const intervalStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          Math.floor(date.getSeconds() / largerIntervalSeconds) * largerIntervalSeconds
        );
        const key = intervalStart.toISOString();
        largerTimeGroups[key] = (largerTimeGroups[key] || 0) + 1;
      });
      
      const largerSortedTimes = Object.keys(largerTimeGroups).sort();
      const labels = largerSortedTimes.map(time => {
        const date = new Date(time);
        return `${date.toLocaleTimeString()}.${date.getSeconds().toString().padStart(2, '0')}`;
      });
      const data = largerSortedTimes.map(time => largerTimeGroups[time]);
      
      return {
        labels,
        datasets: [
          {
            label: 'Responses',
            data,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
          },
        ],
      };
    }

    const labels = sortedTimes.map(time => {
      const date = new Date(time);
      return `${date.toLocaleTimeString()}.${date.getSeconds().toString().padStart(2, '0')}`;
    });
    const data = sortedTimes.map(time => timeGroups[time]);

    return {
      labels,
      datasets: [
        {
          label: 'Responses',
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartData = getResponseTrendData();
  
  if (!chartData) return null;

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Response Trends Over Time
          </Typography>
          <Box sx={{ height: 300 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResponseTrendChart;
