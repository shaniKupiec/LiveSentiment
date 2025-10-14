import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  Analytics,
  TableChart,
  QuestionAnswer,
  Refresh,
  Search,
  Download,
  GetApp
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import type { Question } from '../types/question';
import { QuestionType } from '../types/question';
import { useQuestionResults } from '../hooks/useQuestionResults';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: theme.spacing(1, 0),
  },
}));

const QuestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%',
}));

const ResponseStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginLeft: 'auto',
}));

const TabPanel = styled(Box)(({ theme }) => ({
  height: '400px', // Fixed height as requested
  overflow: 'auto',
  padding: theme.spacing(2),
}));

interface QuestionResponseAccordionProps {
  question: Question;
  presentationId: string;
  presentationName?: string;
  isExpanded: boolean;
  onToggle: (questionId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`question-tabpanel-${index}`}
      aria-labelledby={`question-tab-${index}`}
      {...other}
    >
      {value === index && (
        <TabPanel>
          {children}
        </TabPanel>
      )}
    </div>
  );
}

const QuestionResponseAccordion: React.FC<QuestionResponseAccordionProps> = ({
  question,
  presentationId,
  presentationName,
  isExpanded,
  onToggle
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState<keyof any>('timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  
  // Reset pagination when search changes to prevent jumping
  React.useEffect(() => {
    setPage(0);
  }, [searchText]);
  
  // Use the new hook for data management
  const {
    results,
    loading,
    error,
    refresh,
    lastUpdated
  } = useQuestionResults({
    presentationId,
    questionId: question.id,
    isExpanded,
    pollingInterval: 10000, // Poll every 10 seconds when expanded
    enableRealTime: question.isLive && isExpanded, // Only enable real-time updates when question is live AND expanded
    enablePolling: question.isLive && isExpanded // Only enable polling when question is live AND expanded
  });

  

  const handleAccordionChange = () => {
    onToggle(question.id);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (property: keyof any) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleExportCSV = () => {
    if (!results?.responses) return;
    
    const showAnalysis = shouldShowAnalysisResults(question.type);
    const headers = showAnalysis 
      ? ['Response Value', 'Response Time', 'Analysis Results']
      : ['Response Value', 'Response Time'];
    
    const csvContent = [
      headers.join(','),
      ...results.responses.map(response => {
        const baseRow = [
          `"${response.value.replace(/"/g, '""')}"`,
          `"${new Date(response.timestamp).toLocaleString()}"`
        ];
        if (showAnalysis) {
          baseRow.push(`"${getAnalysisResult(response)}"`);
        }
        return baseRow.join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename: presentationName-questionName-questionType-date
    const safePresentationName = (presentationName || 'presentation').replace(/[^a-zA-Z0-9]/g, '-');
    const questionName = question.text.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    const questionType = getQuestionTypeName(question.type).replace(/[^a-zA-Z0-9]/g, '-');
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `Respons-${safePresentationName}-${questionName}-${questionType}-${date}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleExportMenuClose();
  };

  const getAnalysisResult = (response: any): string => {
    // This would be enhanced based on actual analysis data structure
    if (question.type === QuestionType.NumericRating) {
      return `Numeric: ${response.value}`;
    } else if (question.type === QuestionType.YesNo) {
      return `Yes/No: ${response.value}`;
    } else if (question.type === QuestionType.OpenEnded || question.type === QuestionType.WordCloud) {
      return `Text length: ${response.value.length} chars`;
    } else {
      return `Choice: ${response.value}`;
    }
  };


  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getQuestionTypeName = (type: number): string => {
    switch (type) {
      case QuestionType.MultipleChoiceSingle: return 'Single Choice';
      case QuestionType.MultipleChoiceMultiple: return 'Multiple Choice';
      case QuestionType.NumericRating: return 'Numeric Rating';
      case QuestionType.YesNo: return 'Yes/No';
      case QuestionType.OpenEnded: return 'Open Ended';
      case QuestionType.WordCloud: return 'Word Cloud';
      default: return 'Unknown';
    }
  };

  // Determine if this question type should show analysis results
  const shouldShowAnalysisResults = (type: number): boolean => {
    return type === QuestionType.OpenEnded || type === QuestionType.WordCloud;
  };

  // Filter and sort responses
  const filteredAndSortedResponses = useMemo(() => {
    if (!results?.responses) return [];
    
    let filtered = results.responses;
    
    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(response => 
        response.value.toLowerCase().includes(searchLower) ||
        formatTimestamp(response.timestamp).toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      if (orderBy === 'value') {
        aValue = a.value;
        bValue = b.value;
      } else if (orderBy === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
      } else {
        aValue = a.value;
        bValue = b.value;
      }
      
      if (orderBy !== 'timestamp' && typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  }, [results?.responses, searchText, orderBy, order]);

  // Get paginated responses
  const paginatedResponses = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedResponses.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedResponses, page, rowsPerPage]);

  // Memoize table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    const showAnalysis = shouldShowAnalysisResults(question.type);
    return paginatedResponses.map((response) => (
      <TableRow key={response.id} hover>
        <TableCell>
          <Box sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {response.value}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {formatTimestamp(response.timestamp)}
          </Typography>
        </TableCell>
        {showAnalysis && (
          <TableCell>
            <Chip 
              label={getAnalysisResult(response)} 
              size="small" 
              color="info" 
              variant="outlined"
            />
          </TableCell>
        )}
      </TableRow>
    ));
  }, [paginatedResponses, question.type]);

  // Chart generation functions
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

  const getChoiceChartData = () => {
    if (!results?.responses) return null;

    // Process responses to handle comma-separated values for multiple choice
    const choiceCounts: Record<string, number> = {};
    
    results.responses.forEach(response => {
      // Split by comma and trim whitespace for multiple choice questions
      const choices = response.value.split(',').map(choice => choice.trim());
      
      choices.forEach(choice => {
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

  const getResponseTrendData = () => {
    if (!results?.responses || results.responses.length === 0) return null;

    // Group responses by time intervals - use seconds intervals for better granularity
    const timeGroups: Record<string, number> = {};
    const intervalSeconds = 10; // Use 10-second intervals

    results.responses.forEach(response => {
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
      
      results.responses.forEach(response => {
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Response Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Response Distribution',
      },
    },
  };

  const renderDashboardTab = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    if (!results) {
      return (
        <Alert severity="info">
          No results available for this question.
        </Alert>
      );
    }

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              Analysis Dashboard
            </Typography>
            {question.isLive && isExpanded ? (
              <Chip
                label="Live Updates"
                size="small"
                color="success"
                variant="filled"
              />
            ) : question.isLive ? (
              <Chip
                label="Live (Not Active)"
                size="small"
                color="warning"
                variant="outlined"
              />
            ) : (
              <Chip
                label="Static Data"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={refresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {results.totalResponses} responses from {results.uniqueSessions} participants
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Charts Row */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {/* Numeric Rating - Histogram */}
            {question.type === QuestionType.NumericRating && getNumericRatingChartData() && (
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Response Distribution (Histogram)
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={getNumericRatingChartData()!} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Choice Questions - Pie Chart */}
            {(question.type === QuestionType.MultipleChoiceSingle || 
              question.type === QuestionType.MultipleChoiceMultiple) && 
              getChoiceChartData() && (
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Response Distribution (Pie Chart)
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Pie data={getChoiceChartData()!} options={pieChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Yes/No Questions - Doughnut Chart */}
            {question.type === QuestionType.YesNo && getYesNoChartData() && (
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Yes/No Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Doughnut data={getYesNoChartData()!} options={pieChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Choice Questions - Bar Chart */}
            {(question.type === QuestionType.MultipleChoiceSingle || 
              question.type === QuestionType.MultipleChoiceMultiple) && 
              getChoiceChartData() && (
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Response Count (Bar Chart)
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={getChoiceChartData()!} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>

          {/* Response Trends */}
          {getResponseTrendData() && (
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Response Trends Over Time
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line data={getResponseTrendData()!} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Statistics Cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* Numeric Statistics */}
              {results.numericStats && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Numeric Statistics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Average
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {results.numericStats.average.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Median
                          </Typography>
                          <Typography variant="h4" color="secondary">
                            {results.numericStats.median.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Range: {results.numericStats.min} - {results.numericStats.max}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Count
                          </Typography>
                          <Typography variant="h6">
                            {results.numericStats.count}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Yes/No Statistics */}
              {results.yesNoCounts && (
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
              )}
            </Box>

            {/* Choice Statistics */}
            {(question.type === QuestionType.MultipleChoiceSingle || 
              question.type === QuestionType.MultipleChoiceMultiple) && 
              results.responses && (
              <Box>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Choice Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {(() => {
                        // Process responses to handle comma-separated values
                        const choiceCounts: Record<string, number> = {};
                        
                        results.responses.forEach(response => {
                          const choices = response.value.split(',').map(choice => choice.trim());
                          choices.forEach(choice => {
                            if (choice) {
                              choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
                            }
                          });
                        });

                        return Object.entries(choiceCounts).map(([choice, count]) => {
                          const percentage = (count / results.totalResponses) * 100;
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
                        });
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderResponsesTab = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    if (!results) {
      return (
        <Alert severity="info">
          No responses available for this question.
        </Alert>
      );
    }

    return (
      <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        {/* Header with controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              All Responses
            </Typography>
            {question.isLive && isExpanded ? (
              <Chip
                label="Live Updates"
                size="small"
                color="success"
                variant="filled"
              />
            ) : question.isLive ? (
              <Chip
                label="Live (Not Active)"
                size="small"
                color="warning"
                variant="outlined"
              />
            ) : (
              <Chip
                label="Static Data"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={refresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={handleExportMenuOpen}
              disabled={!results.responses?.length}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem onClick={handleExportCSV}>
                <GetApp sx={{ mr: 1 }} />
                Export as CSV
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        
        {/* Stats and search */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedResponses.length} of {results.totalResponses} responses
            {searchText && ` (filtered by "${searchText}")`}
          </Typography>
          <TextField
            size="small"
            placeholder="Search responses..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
        </Box>
        
        {/* Custom Table */}
        <TableContainer component={Paper} sx={{ height: 300, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'value'}
                    direction={orderBy === 'value' ? order : 'asc'}
                    onClick={() => handleSort('value')}
                  >
                    Response Value
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'timestamp'}
                    direction={orderBy === 'timestamp' ? order : 'asc'}
                    onClick={() => handleSort('timestamp')}
                  >
                    Response Time
                  </TableSortLabel>
                </TableCell>
                {shouldShowAnalysisResults(question.type) && (
                  <TableCell>Analysis Results</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows}
              {paginatedResponses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={shouldShowAnalysisResults(question.type) ? 3 : 2} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchText ? 'No responses match your search' : 'No responses available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedResponses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };

  return (
    <StyledAccordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`question-${question.id}-content`}
        id={`question-${question.id}-header`}
      >
        <QuestionHeader>
          <QuestionAnswer color="primary" />
          <ResponseStats>
            {results && (
              <>
                <Chip
                  label={`${results.totalResponses} responses`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`${results.uniqueSessions} participants`}
                  size="small"
                  color="secondary"
                />
              </>
            )}
            {question.isLive && (
              <Chip
                label="LIVE"
                size="small"
                color="success"
              />
            )}
          </ResponseStats>
        </QuestionHeader>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="question response tabs"
            >
              <Tab
                icon={<Analytics />}
                label="Dashboard"
                id="question-tab-0"
                aria-controls="question-tabpanel-0"
              />
              <Tab
                icon={<TableChart />}
                label="Responses"
                id="question-tab-1"
                aria-controls="question-tabpanel-1"
              />
            </Tabs>
          </Box>
          
          <CustomTabPanel value={tabValue} index={0}>
            {renderDashboardTab()}
          </CustomTabPanel>
          
          <CustomTabPanel value={tabValue} index={1}>
            {renderResponsesTab()}
          </CustomTabPanel>
        </Box>
      </AccordionDetails>
    </StyledAccordion>
  );
};

export default QuestionResponseAccordion;
