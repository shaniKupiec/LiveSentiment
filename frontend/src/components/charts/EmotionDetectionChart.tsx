import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

interface EmotionData {
  emotion: string;
  count: number;
  percentage: number;
}

interface EmotionDetectionChartProps {
  emotionData: EmotionData[];
  chartType?: 'pie' | 'bar' | 'doughnut';
  showStats?: boolean;
}

const EmotionDetectionChart: React.FC<EmotionDetectionChartProps> = ({
  emotionData,
  chartType = 'bar',
  showStats = true
}) => {
  if (!emotionData || emotionData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Emotion Detection
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 300,
            border: '2px dashed #ccc',
            borderRadius: 2,
            backgroundColor: '#fafafa'
          }}>
            <Typography variant="body1" color="text.secondary">
              No emotion data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const colors = {
    joy: '#2196f3',
    anger: '#e91e63',
    fear: '#9c27b0',
    sadness: '#00bcd4',
    surprise: '#4caf50',
    disgust: '#ff9800',
    neutral: '#795548'
  };

  const chartData = {
    labels: emotionData.map(e => e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)),
    datasets: [{
      label: 'Response Count',
      data: emotionData.map(e => e.count),
      backgroundColor: emotionData.map(e => colors[e.emotion as keyof typeof colors] || '#666'),
      borderColor: emotionData.map(e => colors[e.emotion as keyof typeof colors] || '#666'),
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
      hoverBorderWidth: 2,
      hoverBorderColor: '#fff'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value} responses`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return <Pie data={chartData} options={chartOptions} height={250} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} height={250} />;
      default:
        return <Bar data={chartData} options={barChartOptions} height={250} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Emotion Detection
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Chart */}
          <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            {renderChart()}
          </Box>
          
          {/* Stats */}
          {showStats && (
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Emotion Breakdown
              </Typography>
              {emotionData.map((emotion) => {
                const color = colors[emotion.emotion as keyof typeof colors] || '#666';
                return (
                  <Box key={emotion.emotion} sx={{ mb: 2 }}>
                    <Box sx={{ 
                      p: 2, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      borderLeft: `4px solid ${color}` 
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        textTransform: 'capitalize', 
                        fontWeight: 'medium' 
                      }}>
                        {emotion.emotion}
                      </Typography>
                      <Typography variant="h5" sx={{ color }}>
                        {emotion.count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {emotion.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmotionDetectionChart;
