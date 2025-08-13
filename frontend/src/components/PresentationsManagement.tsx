import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Presentation, PresentationFilters, SortField, SortOrder, PresentationFormData } from '../types/presentation';
import type { Label } from '../types/label';
import { formatDate } from '../utils/dateUtils';
import PresentationForm from './PresentationForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

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

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPresentations();
      setPresentations(data);
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

  const applyFiltersAndSorting = () => {
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
  };

  const handleCreatePresentation = async (data: PresentationFormData) => {
    try {
      setFormLoading(true);
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

  const openEditForm = (presentation: Presentation) => {
    setEditingPresentation(presentation);
    setFormOpen(true);
  };

  const openDeleteDialog = (presentation: Presentation) => {
    setDeletingPresentation(presentation);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPresentation(null);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingPresentation(null);
  };

  const handleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (field: keyof Omit<PresentationFilters, 'sortBy' | 'sortOrder'>, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getLabelDisplayName = (labelId?: string) => {
    if (!labelId) return 'No Label';
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    if (label) {
      return label.isActive ? label.name : `${label.name} (Inactive)`;
    }
    
    return 'Unknown Label';
  };

  const getLabelColor = (labelId?: string) => {
    if (!labelId) return '#ccc';
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    if (label) {
      return label.color;
    }
    
    return '#ccc';
  };

  const isLabelActive = (labelId?: string) => {
    if (!labelId) return false;
    
    // Find label in ALL labels (including inactive)
    const label = allLabels.find(l => l.id === labelId);
    
    return label?.isActive ?? false;
  };

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

      {/* Filters and Search */}
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

      {/* Presentations Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
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
                <TableCell align="center">Actions</TableCell>
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
                    <TableCell>{formatDate(presentation.createdDate)}</TableCell>
                    <TableCell>{formatDate(presentation.lastUpdated)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditForm(presentation)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => openDeleteDialog(presentation)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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