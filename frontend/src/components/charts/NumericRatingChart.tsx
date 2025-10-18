import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import type { QuestionResults } from '../../hooks/useQuestionResults';

interface NumericRatingChartProps {
  results: QuestionResults | null;
  chartOptions: any;
}

const NumericRatingChart: React.FC<NumericRatingChartProps> = ({ results, chartOptions }) => {
  const getNumericRatingChartData = () => {
    if (!results?.responses || results.responses.length === 0) return null;

    // Extract numeric values from responses
    const numericValues = results.responses
      .map(r => parseFloat(r.value))
      .filter(val => !isNaN(val));

    if (numericValues.length === 0) return null;

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const range = max - min;

    // For small ranges (like 1-10), use integer bins
    if (range <= 20 && Number.isInteger(min) && Number.isInteger(max)) {
      const labels = [];
      const histogramData = [];
      
      for (let i = min; i <= max; i++) {
        labels.push(i.toString());
        const count = numericValues.filter(val => val === i).length;
        histogramData.push(count);
      }

      return {
        labels,
        datasets: [
          {
            label: 'Response Count',
            data: histogramData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    // For larger ranges, use bins
    const bins = Math.min(10, Math.max(5, Math.ceil(range / 2)));
    const binSize = range / bins;
    const histogramData = [];
    const labels = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + (i * binSize);
      const binEnd = min + ((i + 1) * binSize);
      
      // For the last bin, include the max value
      const isLastBin = i === bins - 1;
      const count = numericValues.filter(val => {
        if (isLastBin) {
          return val >= binStart && val <= binEnd;
        }
        return val >= binStart && val < binEnd;
      }).length;
      
      labels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
      histogramData.push(count);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Response Count',
          data: histogramData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = getNumericRatingChartData();
  
  if (!chartData) return null;

  return (
    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Response Distribution (Histogram)
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={chartData} options={chartOptions} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NumericRatingChart;
