import React from 'react';
import { Box, Typography } from '@mui/material';

interface WordCloudData {
  text: string;
  count: number;
  relevance: number;
  percentage: number;
}

interface WordCloudChartProps {
  keywords: WordCloudData[];
  maxWords?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

const WordCloudChart: React.FC<WordCloudChartProps> = ({
  keywords,
  maxWords = 50,
  minFontSize = 12,
  maxFontSize = 48
}) => {
  // Sort keywords by relevance and take top words
  const sortedKeywords = keywords
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxWords);

  if (sortedKeywords.length === 0) {
    return (
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
          No keywords available for word cloud
        </Typography>
      </Box>
    );
  }

  // Calculate font size based on relevance
  const getFontSize = (relevance: number) => {
    const minRelevance = Math.min(...sortedKeywords.map(k => k.relevance));
    const maxRelevance = Math.max(...sortedKeywords.map(k => k.relevance));
    
    if (maxRelevance === minRelevance) return maxFontSize;
    
    const normalizedRelevance = (relevance - minRelevance) / (maxRelevance - minRelevance);
    return minFontSize + (normalizedRelevance * (maxFontSize - minFontSize));
  };

  // Generate colors based on relevance
  const getColor = (relevance: number) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
      '#00796b', '#5d4037', '#455a64', '#e64a19', '#303f9f',
      '#689f38', '#fbc02d', '#c2185b', '#0097a7', '#795548'
    ];
    
    // Use relevance to determine color intensity
    const colorIndex = Math.floor(relevance * colors.length);
    return colors[Math.min(colorIndex, colors.length - 1)];
  };

  // Generate random positions for words (simple layout)
  const getRandomPosition = () => ({
    x: Math.random() * 80 + 10, // 10% to 90% of container width
    y: Math.random() * 80 + 10, // 10% to 90% of container height
    rotation: Math.random() * 60 - 30 // -30 to 30 degrees
  });

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      height: 400,
      backgroundColor: '#fafafa',
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      overflow: 'hidden',
      p: 2
    }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        Keyword Word Cloud
      </Typography>
      
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        height: 'calc(100% - 60px)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1
      }}>
        {sortedKeywords.map((keyword, index) => {
          const fontSize = getFontSize(keyword.relevance);
          const color = getColor(keyword.relevance);
          const position = getRandomPosition();
          
          return (
            <Box
              key={`${keyword.text}-${index}`}
              sx={{
                position: 'absolute',
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `rotate(${position.rotation}deg)`,
                transformOrigin: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: `rotate(${position.rotation}deg) scale(1.1)`,
                  zIndex: 10
                }
              }}
              title={`${keyword.text}: ${keyword.count} occurrences, ${(keyword.relevance * 100).toFixed(1)}% relevance`}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: `${fontSize}px`,
                  fontWeight: keyword.relevance > 0.7 ? 'bold' : 'medium',
                  color: color,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}
              >
                {keyword.text}
              </Typography>
            </Box>
          );
        })}
      </Box>
      
      {/* Legend */}
      <Box sx={{ 
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 1,
        borderRadius: 1,
        border: '1px solid #e0e0e0'
      }}>
        <Typography variant="caption" color="text.secondary">
          Size = Relevance • Hover for details
        </Typography>
      </Box>
    </Box>
  );
};

export default WordCloudChart;
