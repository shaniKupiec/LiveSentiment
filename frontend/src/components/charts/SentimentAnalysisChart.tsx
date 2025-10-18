import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}

interface SentimentAnalysisChartProps {
  sentimentData: SentimentData[];
  chartType?: 'pie' | 'bar' | 'doughnut';
  showStats?: boolean;
}

const SentimentAnalysisChart: React.FC<SentimentAnalysisChartProps> = ({
  sentimentData,
  chartType = 'pie',
  showStats = true
}) => {
  if (!sentimentData || sentimentData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sentiment Analysis
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
              No sentiment data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const colors = {
    positive: '#4caf50',
    negative: '#f44336',
    neutral: '#ff9800'
  };

  const chartData = {
    labels: sentimentData.map(s => s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1)),
    datasets: [{
      data: sentimentData.map(s => s.count),
      backgroundColor: sentimentData.map(s => colors[s.sentiment as keyof typeof colors] || '#666'),
      borderColor: sentimentData.map(s => colors[s.sentiment as keyof typeof colors] || '#666'),
      borderWidth: 2,
      hoverBorderWidth: 3,
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
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} responses (${percentage}%)`;
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
      case 'bar':
        return <Bar data={chartData} options={barChartOptions} height={250} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} height={250} />;
      default:
        return <Pie data={chartData} options={chartOptions} height={250} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sentiment Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Chart */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            {renderChart()}
          </Box>
          
          {/* Stats */}
          {showStats && (
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Sentiment Breakdown
              </Typography>
              {sentimentData.map((sentiment) => {
                const color = colors[sentiment.sentiment as keyof typeof colors] || '#666';
                return (
                  <Box key={sentiment.sentiment} sx={{ mb: 2 }}>
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
                        {sentiment.sentiment}
                      </Typography>
                      <Typography variant="h5" sx={{ color }}>
                        {sentiment.count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sentiment.percentage.toFixed(1)}%
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

export default SentimentAnalysisChart;
