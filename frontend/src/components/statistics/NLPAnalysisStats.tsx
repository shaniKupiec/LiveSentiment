import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import type { Question } from '../../types/question';
import type { QuestionResults } from '../../hooks/useQuestionResults';
import { QuestionType } from '../../types/question';

// Import new chart components
import WordCloudChart from '../charts/WordCloudChart';
import SentimentAnalysisChart from '../charts/SentimentAnalysisChart';
import EmotionDetectionChart from '../charts/EmotionDetectionChart';

interface NLPAnalysisStatsProps {
  question: Question;
  results: QuestionResults | null;
}

const NLPAnalysisStats: React.FC<NLPAnalysisStatsProps> = ({ question, results }) => {
  if ((question.type !== QuestionType.OpenEnded && question.type !== QuestionType.WordCloud) || 
      !results?.nlpAnalysis) {
    return null;
  }

  // Helper function to build keyword data from individual responses if topKeywords is not available
  const buildKeywordData = () => {
    if (results?.nlpAnalysis?.topKeywords && results.nlpAnalysis.topKeywords.length > 0) {
      return results.nlpAnalysis.topKeywords.map(k => ({
        text: k.text,
        count: k.count,
        relevance: k.averageRelevance,
        percentage: k.percentage
      }));
    }

    // Fallback: build from individual response data
    const keywordMap = new Map<string, { count: number; totalRelevance: number; relevanceCount: number }>();
    
    results?.responses?.forEach(response => {
      if (response.analysisResults?.Keywords?.length > 0) {
        // Use only the first 2 keywords (most relevant) from each response
        response.analysisResults.Keywords.slice(0, 2).forEach((keyword: any) => {
          const existing = keywordMap.get(keyword.Text) || { count: 0, totalRelevance: 0, relevanceCount: 0 };
          keywordMap.set(keyword.Text, {
            count: existing.count + 1,
            totalRelevance: existing.totalRelevance + keyword.Relevance,
            relevanceCount: existing.relevanceCount + 1
          });
        });
      }
    });

    return Array.from(keywordMap.entries())
      .map(([text, data]) => ({
        text,
        count: data.count,
        relevance: data.relevanceCount > 0 ? data.totalRelevance / data.relevanceCount : 0,
        percentage: results?.nlpAnalysis?.analyzedResponses ? (data.count / results.nlpAnalysis.analyzedResponses) * 100 : 0
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 50); // Limit to top 50 keywords
  };

  // Helper function to build sentiment data from individual responses if not available
  const buildSentimentData = () => {
    if (results?.nlpAnalysis?.sentimentCounts && Object.keys(results.nlpAnalysis.sentimentCounts).length > 0) {
      return Object.entries(results.nlpAnalysis.sentimentCounts).map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: results.nlpAnalysis?.sentimentPercentages?.[sentiment] || 0
      }));
    }

    // Fallback: build from individual response data
    const sentimentMap = new Map<string, number>();
    
    results?.responses?.forEach(response => {
      if (response.analysisResults?.Sentiment?.Label) {
        const sentiment = response.analysisResults.Sentiment.Label;
        sentimentMap.set(sentiment, (sentimentMap.get(sentiment) || 0) + 1);
      }
    });

    const totalSentimentResponses = Array.from(sentimentMap.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(sentimentMap.entries())
      .map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: totalSentimentResponses > 0 ? (count / totalSentimentResponses) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Helper function to build emotion data from individual responses if not available
  const buildEmotionData = () => {
    if (results?.nlpAnalysis?.emotionCounts && Object.keys(results.nlpAnalysis.emotionCounts).length > 0) {
      return Object.entries(results.nlpAnalysis.emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: results.nlpAnalysis?.emotionPercentages?.[emotion] || 0
      }));
    }

    // Fallback: build from individual response data
    const emotionMap = new Map<string, number>();
    
    results?.responses?.forEach(response => {
      if (response.analysisResults?.Emotion?.Label) {
        const emotion = response.analysisResults.Emotion.Label;
        emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1);
      }
    });

    const totalEmotionResponses = Array.from(emotionMap.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(emotionMap.entries())
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: totalEmotionResponses > 0 ? (count / totalEmotionResponses) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            NLP Analysis Statistics
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Analysis Quality Metrics Dashboard */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Analysis Quality Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Analysis Coverage
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {results!.nlpAnalysis?.analyzedResponses || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      of {results!.nlpAnalysis?.totalResponses || 0} total responses
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={results!.nlpAnalysis?.totalResponses ? (results!.nlpAnalysis.analyzedResponses / results!.nlpAnalysis.totalResponses) * 100 : 0}
                      sx={{ mt: 1, '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' } }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: results!.nlpAnalysis?.totalResponses === results!.nlpAnalysis?.analyzedResponses ? '#4caf50' : '#ff9800' 
                      }} />
                      <Typography variant="caption" color="text.secondary">
                        {results!.nlpAnalysis?.totalResponses === results!.nlpAnalysis?.analyzedResponses ? 'Complete' : 
                         `${(results!.nlpAnalysis?.totalResponses || 0) - (results!.nlpAnalysis?.analyzedResponses || 0)} pending`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, borderLeft: '4px solid #2196f3' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Average Confidence
                    </Typography>
                    <Typography variant="h5" color="primary.main">
                      {((results!.nlpAnalysis?.averageConfidence || 0) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Model confidence score
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(results!.nlpAnalysis?.averageConfidence || 0) * 100}
                      sx={{ mt: 1, '& .MuiLinearProgress-bar': { backgroundColor: '#2196f3' } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {((results!.nlpAnalysis?.averageConfidence || 0) * 100) >= 80 ? 'High' : 
                       ((results!.nlpAnalysis?.averageConfidence || 0) * 100) >= 60 ? 'Medium' : 'Low'} confidence
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, borderLeft: '4px solid #ff9800' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      Keyword Diversity
                    </Typography>
                    <Typography variant="h5" color="warning.main">
                      {results!.nlpAnalysis?.uniqueKeywords || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      unique keywords found
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Density:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {results!.nlpAnalysis?.totalResponses ? (results!.nlpAnalysis.uniqueKeywords / results!.nlpAnalysis.totalResponses).toFixed(2) : 0} keywords/response
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
              </Box>
            </Box>

            {/* Enhanced Sentiment Analysis Charts */}
            {buildSentimentData().length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Sentiment Analysis
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Pie Chart */}
                  <SentimentAnalysisChart
                    sentimentData={buildSentimentData()}
                    chartType="pie"
                    showStats={true}
                  />
                  
                  {/* Bar Chart */}
                  <SentimentAnalysisChart
                    sentimentData={buildSentimentData()}
                    chartType="bar"
                    showStats={false}
                  />
                </Box>
              </Box>
            )}

            {/* Enhanced Emotion Detection Charts */}
            {buildEmotionData().length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Emotion Detection
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Bar Chart */}
                  <EmotionDetectionChart
                    emotionData={buildEmotionData()}
                    chartType="bar"
                    showStats={true}
                  />
                  
                  {/* Pie Chart */}
                  <EmotionDetectionChart
                    emotionData={buildEmotionData()}
                    chartType="pie"
                    showStats={false}
                  />
                </Box>
              </Box>
            )}

            {/* Enhanced Keyword Analysis with Word Cloud */}
            {((results!.nlpAnalysis?.topKeywords?.length || 0) > 0 || 
              (results?.responses?.some(r => r.analysisResults?.Keywords?.length > 0) || false)) && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Keyword Analysis
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Word Cloud */}
                  <WordCloudChart
                    keywords={buildKeywordData()}
                    maxWords={50}
                    minFontSize={12}
                    maxFontSize={48}
                  />
                  
                  {/* Horizontal Bar Chart for Top Keywords */}
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                    <Box sx={{ flex: '1 1 500px', minWidth: '500px' }}>
                      <Bar
                        data={{
                          labels: buildKeywordData().slice(0, 15).map(k => k.text),
                          datasets: [{
                            label: 'Frequency',
                            data: buildKeywordData().slice(0, 15).map(k => k.count),
                            backgroundColor: buildKeywordData().slice(0, 15).map((_, index) => {
                              const colors = [
                                '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
                                '#00796b', '#5d4037', '#455a64', '#e64a19', '#303f9f',
                                '#689f38', '#fbc02d', '#c2185b', '#0097a7', '#795548'
                              ];
                              return colors[index % colors.length];
                            }),
                            borderColor: buildKeywordData().slice(0, 15).map((_, index) => {
                              const colors = [
                                '#0d47a1', '#1b5e20', '#e65100', '#b71c1c', '#4a148c',
                                '#004d40', '#3e2723', '#263238', '#bf360c', '#1a237e',
                                '#33691e', '#f57f17', '#880e4f', '#006064', '#4e342e'
                              ];
                              return colors[index % colors.length];
                            }),
                            borderWidth: 1,
                            borderRadius: 4,
                            borderSkipped: false,
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                            callbacks: {
                              label: function(context) {
                                const keyword = buildKeywordData()[context.dataIndex];
                                if (keyword) {
                                  return `${keyword.text}: ${keyword.count} occurrences (${keyword.percentage.toFixed(1)}%)`;
                                }
                                return `${context.label}: ${context.parsed.x}`;
                              }
                            }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1
                              },
                              grid: {
                                color: 'rgba(0,0,0,0.1)'
                              }
                            },
                            y: {
                              grid: {
                                display: false
                              }
                            }
                          }
                        }}
                        height={Math.min(400, buildKeywordData().length * 25 + 100)}
                      />
                    </Box>
                    
                    {/* Keyword Stats */}
                    <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Top Keywords
                      </Typography>
                      {buildKeywordData().slice(0, 10).map((keyword, index) => (
                        <Box key={keyword.text} sx={{ mb: 2 }}>
                          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, borderLeft: `4px solid #1976d2` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                #{index + 1} {keyword.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {keyword.relevance.toFixed(2)} relevance
                              </Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                              {keyword.count}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {keyword.percentage.toFixed(1)}% of responses
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={keyword.percentage}
                              sx={{ mt: 1, '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NLPAnalysisStats;
