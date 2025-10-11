import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  keyframes,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { usePresentations } from '../contexts/PresentationContext';
import { usePresentationOperations } from '../hooks/usePresentationOperations';
import type { Presentation, PresentationFilters, SortField, PresentationFormData } from '../types/presentation';
import { formatDate } from '../utils/dateUtils';
import PresentationForm from './PresentationForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import StartPresentationDialog from './StartPresentationDialog';
import PresentationDetailView from './PresentationDetailView';

// Pulse animation for live status
const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
`;

interface PresentationsManagementProps {
  onPresentationSelect?: (presentationId: string) => void;
  selectedPresentationId?: string | null;
}

const PresentationsManagement: React.FC<PresentationsManagementProps> = ({ 
  onPresentationSelect,
  selectedPresentationId
}) => {
  // Use the new context and hooks
  const {
    presentations,
    labels,
    selectedPresentation,
    presentationsLoading,
    labelsLoading,
    error,
    fetchPresentations,
    fetchLabels,
    selectPresentation,
    presentationsWithQuestions,
    totalQuestions
  } = usePresentations();
  
  const { createPresentation, updatePresentation, deletePresentation } = usePresentationOperations();
  
  // Local state for UI
  const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([]);
  const isInitialized = useRef(false);
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingPresentation, setEditingPresentation] = useState<Presentation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPresentation, setDeletingPresentation] = useState<Presentation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Start presentation states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startingPresentation, setStartingPresentation] = useState<Presentation | null>(null);
  
  // Questions management states
  const [showDetailView, setShowDetailView] = useState(false);
  
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
  }, [fetchPresentations, fetchLabels]);

  // Apply filters and sorting when filters change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [presentations, filters]);

  // Computed values are now provided by the context

  // Fetch functions are now handled by the context


  // Question counts are now included in the presentations data from the API

  const handleManageQuestions = useCallback((presentation: Presentation) => {
    // Use the context to select the presentation
    selectPresentation(presentation);
    setShowDetailView(true);
  }, [selectPresentation]);

  const handleBackToPresentations = useCallback(() => {
    setShowDetailView(false);
    selectPresentation(null);
    // Refresh presentations list to show updated live status
    fetchPresentations(true); // Force refresh
    if (onPresentationSelect) {
      onPresentationSelect('');
    }
  }, [onPresentationSelect, selectPresentation, fetchPresentations]);


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
      await createPresentation(data);
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
      await updatePresentation(editingPresentation.id, data);
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
      await deletePresentation(deletingPresentation.id);
      setDeletingPresentation(null);
    } catch (error) {
      console.error('Error deleting presentation:', error);
      throw error; // Re-throw to let the dialog handle it
    } finally {
      setDeleteLoading(false);
    }
  };


  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingPresentation(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeletingPresentation(null);
  }, []);

  const closeStartDialog = useCallback(() => {
    setStartDialogOpen(false);
    setStartingPresentation(null);
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
    
    // Find label in labels
    const label = labels.find(l => l.id === labelId);
    
    if (label) {
      return label.isActive ? label.name : `${label.name} (Inactive)`;
    }
    
    return 'Unknown Label';
  }, [labels]);

  const getLabelColor = useCallback((labelId?: string) => {
    if (!labelId) return '#ccc';
    
    // Find label in labels
    const label = labels.find(l => l.id === labelId);
    
    if (label) {
      return label.color;
    }
    
    return '#ccc';
  }, [labels]);

  const isLabelActive = useCallback((labelId?: string) => {
    if (!labelId) return false;
    
    // Find label in labels
    const label = labels.find(l => l.id === labelId);
    
    return label?.isActive ?? false;
  }, [labels]);

  if (presentationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {!selectedPresentation && (
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
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!selectedPresentation && (
        <>
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
                    {totalQuestions}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Presentations with Questions</Typography>
                  <Typography variant="h4" color="success.main">
                    {presentationsWithQuestions}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </>
      )}

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
                  ...labels.filter(l => !l.isActive).map((label) => (
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
      {!showDetailView ? (
        // Presentations List View
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>
                    Label
                    {labels.some(l => !l.isActive) && (
                      <Chip
                        label="Some inactive labels"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">Status</TableCell>
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {filters.search || filters.labelId 
                          ? 'No presentations match your filters.'
                          : 'No presentations found. Create your first one!'
                        }
                      </Typography>
                      {labels.some(l => !l.isActive) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Note: Some presentations may have inactive labels that are no longer available for new assignments.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPresentations.map((presentation) => (
                    <TableRow 
                      key={presentation.id} 
                      hover
                      selected={selectedPresentationId === presentation.id}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: selectedPresentationId === presentation.id 
                            ? 'action.selected' 
                            : 'action.hover'
                        }
                      }}
                      onClick={() => handleManageQuestions(presentation)}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {presentation.title}
                        </Typography>
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
                      <TableCell align="center">
                        {presentation.isLive ? (
                          <Chip
                            label="LIVE"
                            size="small"
                            sx={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              fontWeight: 'bold',
                              animation: `${pulse} 2s infinite`
                            }}
                          />
                        ) : (
                          <Chip
                            label="Draft"
                            size="small"
                            variant="outlined"
                            sx={{
                              color: 'text.secondary'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(presentation.createdDate)}</TableCell>
                      <TableCell>{formatDate(presentation.lastUpdated)}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight="medium">
                          {presentation.questions?.length || 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : selectedPresentation ? (
        // Presentation Detail View
        <PresentationDetailView
          presentation={selectedPresentation}
          onPresentationUpdate={fetchPresentations}
          onPresentationDelete={handleBackToPresentations}
          onBack={handleBackToPresentations}
        />
      ) : null}

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

      {/* Start Presentation Dialog */}
      <StartPresentationDialog
        open={startDialogOpen}
        onClose={closeStartDialog}
        presentation={startingPresentation}
      />
    </Box>
  );
};

export default PresentationsManagement; 