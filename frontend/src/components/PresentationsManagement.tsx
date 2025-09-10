import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Presentation, PresentationFilters, SortField, PresentationFormData } from '../types/presentation';
import type { Label } from '../types/label';
import type { Question } from '../types/question';
import { formatDate } from '../utils/dateUtils';
import PresentationForm from './PresentationForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import QuestionsManagement from './QuestionsManagement';

const PresentationsManagement: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPresentation, setDeletingPresentation] = useState<Presentation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Questions management states
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [activeSubTab, setActiveSubTab] = useState(0); // 0 = details, 1 = questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [questionCountsLoading, setQuestionCountsLoading] = useState(false);
  
  // Filter and sort states
  const [filters, setFilters] = useState<PresentationFilters>({
    labelId: '',
    search: '',
    sortBy: 'createdDate',
    sortOrder: 'desc'
  });

  // Fetch presentations on component mount (only once)
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🚀 Component mounted, fetching presentations and labels...');
      isInitialized.current = true;
      fetchPresentations();
      fetchLabels();
    }
  }, []);

  // Apply filters and sorting when filters change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [presentations, filters]);

  // Memoized computed values
  const totalQuestions = useMemo(() => 
    Object.values(questionCounts).reduce((sum, count) => sum + count, 0), 
    [questionCounts]
  );

  const presentationsWithQuestions = useMemo(() => 
    Object.values(questionCounts).filter(count => count > 0).length, 
    [questionCounts]
  );

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPresentations();
      setPresentations(data);
      // Fetch question counts after presentations are loaded
      await fetchQuestionCounts(data);
    } catch (error) {
      console.error('Error fetching presentations:', error);
      setError('Failed to load presentations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    try {
      setLabelsLoading(true);
      // Get ALL labels (active + inactive) for display purposes
      const allLabelsData = await apiService.getAllLabels();
      setAllLabels(allLabelsData);
      
      // Get only active labels for filtering and creation
      const activeLabels = allLabelsData.filter(l => l.isActive);
      setLabels(activeLabels);
    } catch (error) {
      console.error('Error fetching labels:', error);
      // Don't show error to user, just log it
    } finally {
      setLabelsLoading(false);
    }
  };

  const fetchQuestions = async (presentationId: string) => {
    try {
      setQuestionsLoading(true);
      setError(null);
      const data = await apiService.getQuestions(presentationId);
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions. Please try again.');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchQuestionCounts = async (presentationsData: Presentation[] = presentations) => {
    try {
      setQuestionCountsLoading(true);
      const counts: Record<string, number> = {};
      
      // Use Promise.allSettled to handle individual failures gracefully
      const countPromises = presentationsData.map(async (presentation) => {
        try {
          const questions = await apiService.getQuestions(presentation.id);
          return { id: presentation.id, count: questions.length };
        } catch (error) {
          console.error(`Error fetching questions for presentation ${presentation.id}:`, error);
          return { id: presentation.id, count: 0 };
        }
      });

      const results = await Promise.allSettled(countPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          counts[result.value.id] = result.value.count;
        }
      });

      setQuestionCounts(counts);
    } catch (error) {
      console.error('Error fetching question counts:', error);
      // Don't show error to user, just log it
    } finally {
      setQuestionCountsLoading(false);
    }
  };

  const handleManageQuestions = useCallback((presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setActiveSubTab(1); // Switch to questions tab
    fetchQuestions(presentation.id);
  }, []);

  const handleBackToPresentations = useCallback(() => {
    setSelectedPresentation(null);
    setActiveSubTab(0);
    setQuestions([]);
  }, []);

  const handleQuestionsChange = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions);
    
    // Update question count for the current presentation
    if (selectedPresentation) {
      setQuestionCounts(prev => ({
        ...prev,
        [selectedPresentation.id]: newQuestions.length
      }));
    }
    
    // In a real app, you would sync with the backend here
    console.log('Questions updated:', newQuestions);
  }, [selectedPresentation]);

  const applyFiltersAndSorting = useCallback(() => {
    let filtered = [...presentations];

    // Apply label filter
    if (filters.labelId) {
      filtered = filtered.filter(p => p.labelId === filters.labelId);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];
      
      if (filters.sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredPresentations(filtered);
  }, [presentations, filters]);

  const handleCreatePresentation = async (data: PresentationFormData) => {
    try {
      setFormLoading(true);
      setError(null);
      await apiService.createPresentation(data);
      await fetchPresentations();
      setFormOpen(false);
    } catch (error) {
      console.error('Error creating presentation:', error);
      throw error; // Re-throw to let the form handle it
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePresentation = async (data: PresentationFormData) => {
    if (!editingPresentation) return;
    
    try {
      setFormLoading(true);
      setError(null);
      await apiService.updatePresentation(editingPresentation.id, data);
      await fetchPresentations();
      setEditingPresentation(null);
    } catch (error) {
      console.error('Error updating presentation:', error);
      throw error; // Re-throw to let the form handle it
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePresentation = async () => {
    if (!deletingPresentation) return;
    
    try {
      setDeleteLoading(true);
      setError(null);
      await apiService.deletePresentation(deletingPresentation.id);
      await fetchPresentations();
      setDeletingPresentation(null);
    } catch (error) {
      console.error('Error deleting presentation:', error);
      throw error; // Re-throw to let the dialog handle it
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditForm = useCallback((presentation: Presentation) => {
    setEditingPresentation(presentation);
    setFormOpen(true);
  }, []);

  const openDeleteDialog = useCallback((presentation: Presentation) => {
    setDeletingPresentation(presentation);
    setDeleteDialogOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingPresentation(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingPresentation(null);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleFilterChange = useCallback((field: keyof Omit<PresentationFilters, 'sortBy' | 'sortOrder'>, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const getLabelDisplayName = useCallback((labelId?: string) => {
    if (!labelId) return 'No Label';
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    if (label) {
      return label.isActive ? label.name : `${label.name} (Inactive)`;
    }
    
    return 'Unknown Label';
  }, [allLabels]);

  const getLabelColor = useCallback((labelId?: string) => {
    if (!labelId) return '#ccc';
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    if (label) {
      return label.color;
    }
    
    return '#ccc';
  }, [allLabels]);

  const isLabelActive = useCallback((labelId?: string) => {
    if (!labelId) return false;
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    return label?.isActive ?? false;
  }, [allLabels]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Presentations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          New Presentation
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Statistics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>Overview</Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Presentations</Typography>
              <Typography variant="h4" color="primary">{presentations.length}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Questions</Typography>
              <Typography variant="h4" color="secondary">
                {questionCountsLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  totalQuestions
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Presentations with Questions</Typography>
              <Typography variant="h4" color="success.main">
                {questionCountsLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  presentationsWithQuestions
                )}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Filters and Search - Only show when viewing presentations list */}
      {!selectedPresentation && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search by title"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Filter by Label</InputLabel>
              <Select
                value={filters.labelId}
                onChange={(e) => handleFilterChange('labelId', e.target.value)}
                label="Filter by Label"
              >
                <MenuItem value="">All Labels</MenuItem>
                {labelsLoading ? (
                  <MenuItem disabled>Loading labels...</MenuItem>
                ) : [
                  // Active Labels
                  ...labels.map((label) => (
                    <MenuItem key={label.id} value={label.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: label.color,
                            border: '1px solid #ccc'
                          }}
                        />
                        {label.name}
                      </Box>
                    </MenuItem>
                  )),
                  
                  // Inactive Labels (disabled, for reference)
                  ...allLabels.filter(l => !l.isActive).map((label) => (
                    <MenuItem key={label.id} value={label.id} disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: label.color,
                            border: '1px solid #ccc',
                            opacity: 0.5
                          }}
                        />
                        <Typography sx={{ opacity: 0.7, textDecoration: 'line-through' }}>
                          {label.name} (Inactive)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ]}
              </Select>
            </FormControl>
          </Stack>
        </Paper>
      )}

      {/* Main Content - Either Presentations List or Questions Management */}
      {!selectedPresentation ? (
        // Presentations List View
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title & Actions</TableCell>
                  <TableCell>
                    Label
                    {allLabels.some(l => !l.isActive) && (
                      <Chip
                        label="Some inactive labels"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={filters.sortBy === 'createdDate'}
                      direction={filters.sortOrder}
                      onClick={() => handleSort('createdDate')}
                    >
                      Created Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={filters.sortBy === 'lastUpdated'}
                      direction={filters.sortOrder}
                      onClick={() => handleSort('lastUpdated')}
                    >
                      Last Updated
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Questions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPresentations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {filters.search || filters.labelId 
                          ? 'No presentations match your filters.'
                          : 'No presentations found. Create your first one!'
                        }
                      </Typography>
                      {allLabels.some(l => !l.isActive) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Note: Some presentations may have inactive labels that are no longer available for new assignments.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPresentations.map((presentation) => (
                    <TableRow key={presentation.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {presentation.title}
                          </Typography>
                          {/* Quick Actions Row */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<QuestionIcon />}
                              onClick={() => handleManageQuestions(presentation)}
                              sx={{ 
                                minWidth: 'auto',
                                px: 2,
                                py: 0.5,
                                fontSize: '0.75rem',
                                backgroundColor: '#9c27b0',
                                '&:hover': {
                                  backgroundColor: '#7b1fa2'
                                }
                              }}
                            >
                              Questions
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => openEditForm(presentation)}
                              sx={{ 
                                minWidth: 'auto',
                                px: 2,
                                py: 0.5,
                                fontSize: '0.75rem'
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => openDeleteDialog(presentation)}
                              color="error"
                              sx={{ 
                                minWidth: 'auto',
                                px: 2,
                                py: 0.5,
                                fontSize: '0.75rem'
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getLabelDisplayName(presentation.labelId)} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{
                            backgroundColor: getLabelColor(presentation.labelId),
                            color: '#000',
                            borderColor: getLabelColor(presentation.labelId),
                            opacity: isLabelActive(presentation.labelId) ? 1 : 0.6,
                            textDecoration: isLabelActive(presentation.labelId) ? 'none' : 'line-through',
                            '& .MuiChip-label': {
                              textDecoration: isLabelActive(presentation.labelId) ? 'none' : 'line-through'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(presentation.createdDate)}</TableCell>
                      <TableCell>{formatDate(presentation.lastUpdated)}</TableCell>
                      <TableCell align="center">
                        {/* Question count indicator */}
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Questions
                          </Typography>
                          <Chip
                            label={questionCountsLoading ? '...' : (questionCounts[presentation.id] || 0)}
                            size="small"
                            variant="outlined"
                            color={questionCounts[presentation.id] > 0 ? "primary" : "default"}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#f3e5f5'
                              }
                            }}
                            onClick={() => handleManageQuestions(presentation)}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        // Questions Management View
        <Paper>
          <Box sx={{ p: 3 }}>
            {/* Header with back button */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button
                variant="outlined"
                onClick={handleBackToPresentations}
                sx={{ mr: 2 }}
              >
                ← Back to Presentations
              </Button>
              <Typography variant="h5" component="h2">
                Questions for: {selectedPresentation.title}
              </Typography>
            </Box>

            {/* Sub-tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeSubTab} onChange={(_e, newValue) => setActiveSubTab(newValue)}>
                <Tab label="Presentation Details" />
                <Tab label="Questions" />
              </Tabs>
            </Box>

            {/* Sub-tab content */}
            {activeSubTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>Presentation Information</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                    <Typography variant="body1">{selectedPresentation.title}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Label</Typography>
                    <Chip 
                      label={getLabelDisplayName(selectedPresentation.labelId)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{
                        backgroundColor: getLabelColor(selectedPresentation.labelId),
                        color: '#000',
                        borderColor: getLabelColor(selectedPresentation.labelId),
                        opacity: isLabelActive(selectedPresentation.labelId) ? 1 : 0.6
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Created Date</Typography>
                    <Typography variant="body1">{formatDate(selectedPresentation.createdDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body1">{formatDate(selectedPresentation.lastUpdated)}</Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => openEditForm(selectedPresentation)}
                  startIcon={<EditIcon />}
                >
                  Edit Presentation
                </Button>
              </Box>
            )}

            {activeSubTab === 1 && (
              <Box>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <QuestionsManagement
                  presentation={selectedPresentation}
                  questions={questions}
                  onQuestionsChange={handleQuestionsChange}
                  isLoading={questionsLoading}
                />
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Presentation Form */}
      <PresentationForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editingPresentation ? handleUpdatePresentation : handleCreatePresentation}
        presentation={editingPresentation}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePresentation}
        title={deletingPresentation?.title || ''}
        isLoading={deleteLoading}
      />
    </Box>
  );
};

export default PresentationsManagement; 