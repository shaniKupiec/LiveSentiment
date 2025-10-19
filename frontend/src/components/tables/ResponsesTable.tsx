import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
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
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Refresh,
  Search,
  Download,
  GetApp,
  Info
} from '@mui/icons-material';
import type { Question } from '../../types/question';
import type { QuestionResults } from '../../hooks/useQuestionResults';
import { QuestionType } from '../../types/question';
import { getQuestionTypeName as getQuestionTypeNameUtil } from '../../utils/questionTypeUtils';

interface ResponsesTableProps {
  question: Question;
  results: QuestionResults | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isExpanded: boolean;
  onRefresh: () => Promise<void>;
  presentationName?: string;
}

const ResponsesTable: React.FC<ResponsesTableProps> = ({
  question,
  results,
  loading,
  error,
  lastUpdated,
  isExpanded,
  onRefresh,
  presentationName
}) => {
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
    
    const nlpColumns = getNLPColumns();
    const headers = ['Response Value', 'Response Time', ...nlpColumns];
    
    const csvContent = [
      headers.join(','),
      ...results.responses.map(response => {
        const baseRow = [
          `"${response.value.replace(/"/g, '""')}"`,
          `"${new Date(response.timestamp).toLocaleString()}"`
        ];
        
        // Add NLP column values
        nlpColumns.forEach(column => {
          const value = getNLPColumnValue(response, column);
          // Extract text from Chip component for CSV
          const textValue = typeof value === 'string' ? value : 
                           (value as any)?.props?.label || 'N/A';
          baseRow.push(`"${textValue.replace(/"/g, '""')}"`);
        });
        
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

  const getNLPColumnValue = (response: any, column: string): React.ReactNode => {
    if (!response.analysisCompleted) {
      return (
        <Chip 
          label="Pending..." 
          size="small" 
          color="default" 
          variant="outlined"
        />
      );
    }
    
    if (response.analysisError) {
      return (
        <Chip 
          label="Error" 
          size="small" 
          color="error" 
          variant="outlined"
        />
      );
    }
    
    switch (column) {
      case 'Sentiment':
        if (response.analysisResults?.Sentiment) {
          const sentiment = response.analysisResults.Sentiment;
          // Color based on confidence: red if < 0.5, green if >= 0.5
          const color = sentiment.Confidence >= 0.5 ? 'success' : 'error';
          return (
            <Chip 
              label={`${sentiment.Label} (${(sentiment.Confidence * 100).toFixed(0)}%)`}
              size="small" 
              color={color} 
              variant="outlined"
            />
          );
        }
        return <Chip label="N/A" size="small" color="default" variant="outlined" />;
        
      case 'Emotion':
        if (response.analysisResults?.Emotion) {
          const emotion = response.analysisResults.Emotion;
          // Color based on confidence: red if < 0.5, green if >= 0.5
          const color = emotion.Confidence >= 0.5 ? 'success' : 'error';
          return (
            <Chip 
              label={`${emotion.Label} (${(emotion.Confidence * 100).toFixed(0)}%)`}
              size="small" 
              color={color} 
              variant="outlined"
            />
          );
        }
        return <Chip label="N/A" size="small" color="default" variant="outlined" />;
        
      case 'Keywords':
        if (response.analysisResults?.Keywords?.length > 0) {
          // Find the keyword with the highest relevance
          const mostRelevantKeyword = response.analysisResults.Keywords.reduce((prev: any, current: any) => 
            (current.Relevance > prev.Relevance) ? current : prev
          );
          return (
            <Chip 
              label={`${mostRelevantKeyword.Text} (${(mostRelevantKeyword.Relevance * 100).toFixed(0)}%)`}
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          );
        }
        return <Chip label="N/A" size="small" color="default" variant="outlined" />;
        
      default:
        return <Chip label="N/A" size="small" color="default" variant="outlined" />;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getQuestionTypeName = (type: number): string => {
    return getQuestionTypeNameUtil(type as QuestionType);
  };

  // Get which NLP columns should be shown based on question configuration
  const getNLPColumns = () => {
    const columns = [];
    if (question.enableSentimentAnalysis) {
      columns.push('Sentiment');
    }
    if (question.enableEmotionAnalysis) {
      columns.push('Emotion');
    }
    if (question.enableKeywordExtraction) {
      columns.push('Keywords');
    }
    return columns;
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
    const nlpColumns = getNLPColumns();
    return paginatedResponses.map((response) => (
      <TableRow key={response.id} hover>
        <TableCell>
          <Box sx={{ 
            maxWidth: 300, 
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {response.value}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {formatTimestamp(response.timestamp)}
          </Typography>
        </TableCell>
        {nlpColumns.map((column) => (
          <TableCell key={column}>
            {getNLPColumnValue(response, column)}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [paginatedResponses, question.type, question.enableSentimentAnalysis, question.enableEmotionAnalysis, question.enableKeywordExtraction]);

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
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
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
                  Response
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
              {getNLPColumns().map((column) => (
                <TableCell key={column}>
                  {column === 'Sentiment' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {column}
                      <Tooltip title="Color indicates confidence level: Green (≥50%), Red (<50%)">
                        <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  ) : column === 'Emotion' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {column}
                      <Tooltip title="Possible emotions: Joy, Sadness, Anger, Fear, Surprise, Disgust, Neutral. Color indicates confidence: Green (≥50%), Red (<50%)">
                        <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  ) : column === 'Keywords' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {column}
                      <Tooltip title="Shows the most relevant keyword with its relevance score (0-100%)">
                        <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  ) : (
                    column
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
            {paginatedResponses.length === 0 && (
              <TableRow>
                <TableCell colSpan={2 + getNLPColumns().length} align="center">
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

export default ResponsesTable;
