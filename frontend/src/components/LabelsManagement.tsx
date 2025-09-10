import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  IconButton, 
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { Edit, Delete, Add, RestoreFromTrash } from '@mui/icons-material';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '../types/label';
import { apiService } from '../services/api';
import LabelForm from './LabelForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const LabelsManagement: React.FC = () => {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLabel, setDeleteLabel] = useState<Label | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allLabelsData = await apiService.getAllLabels();
      setAllLabels(allLabelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async (data: CreateLabelRequest) => {
    try {
      setIsSubmitting(true);
      const newLabel = await apiService.createLabel(data);
      setAllLabels(prev => [...prev, newLabel]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLabel = async (data: UpdateLabelRequest) => {
    if (!editingLabel) return;
    
    try {
      setIsSubmitting(true);
      const updatedLabel = await apiService.updateLabel(editingLabel.id, data);
      setAllLabels(prev => prev.map(label => 
        label.id === editingLabel.id ? updatedLabel : label
      ));
      setEditingLabel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLabel = async () => {
    if (!deleteLabel) return;
    
    try {
      setIsSubmitting(true);
      await apiService.deleteLabel(deleteLabel.id);
      // Update both lists - remove from active, mark as inactive in all
      setAllLabels(prev => prev.map(label => 
        label.id === deleteLabel.id ? { ...label, isActive: false } : label
      ));
      setDeleteLabel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateLabel = async (labelId: string) => {
    try {
      setIsSubmitting(true);
      await apiService.reactivateLabel(labelId);
      // Refresh labels after reactivation
      await fetchLabels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate label');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (label: Label) => {
    setEditingLabel(label);
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
  };

  const handleCancelCreate = () => {
    setShowForm(false);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const activeLabels = allLabels.filter(label => label.isActive);
  const inactiveLabels = allLabels.filter(label => !label.isActive);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Labels Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowForm(true)}
        >
          Create New Label
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={fetchLabels}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      {/* Create/Edit Form */}
      {(showForm || editingLabel) && (
        <Paper sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingLabel ? 'Edit Label' : 'Create New Label'}
          </Typography>
          <LabelForm
            label={editingLabel}
            onSubmit={editingLabel ? 
              (data: CreateLabelRequest | UpdateLabelRequest) => handleUpdateLabel(data as UpdateLabelRequest) : 
              (data: CreateLabelRequest | UpdateLabelRequest) => handleCreateLabel(data as CreateLabelRequest)
            }
            onCancel={editingLabel ? handleCancelEdit : handleCancelCreate}
            isLoading={isSubmitting}
          />
        </Paper>
      )}

      {/* Labels Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label={`Active Labels (${activeLabels.length})`} 
            id="labels-tab-0"
            aria-controls="labels-tabpanel-0"
          />
          <Tab 
            label={`Inactive Labels (${inactiveLabels.length})`} 
            id="labels-tab-1"
            aria-controls="labels-tabpanel-1"
          />
        </Tabs>

        {/* Active Labels Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 0}
          id="labels-tabpanel-0"
          aria-labelledby="labels-tab-0"
        >
          <Box p={3} borderBottom={1} borderColor="divider">
            <Typography variant="h6">
              Active Labels
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeLabels.length} active label{activeLabels.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          {activeLabels.length === 0 ? (
            <Box p={6} textAlign="center">
              <Typography variant="body1" color="text.secondary">
                No active labels. Create your first label to get started!
              </Typography>
            </Box>
          ) : (
            <List>
              {activeLabels.map((label, index) => (
                <React.Fragment key={label.id}>
                  <ListItem>
                    <Box display="flex" alignItems="center" width="100%">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: label.color,
                          mr: 2
                        }}
                      />
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Typography variant="subtitle1" component="span">
                            {label.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {label.presentationCount} presentation{label.presentationCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <IconButton
                          onClick={() => handleEdit(label)}
                          color="primary"
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => setDeleteLabel(label)}
                          color="error"
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < activeLabels.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </div>

        {/* Inactive Labels Tab */}
        <div
          role="tabpanel"
          hidden={activeTab !== 1}
          id="labels-tabpanel-1"
          aria-labelledby="labels-tab-1"
        >
          <Box p={3} borderBottom={1} borderColor="divider">
            <Typography variant="h6">
              Inactive Labels
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {inactiveLabels.length} inactive label{inactiveLabels.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          {inactiveLabels.length === 0 ? (
            <Box p={6} textAlign="center">
              <Typography variant="body1" color="text.secondary">
                No inactive labels.
              </Typography>
            </Box>
          ) : (
            <List>
              {inactiveLabels.map((label, index) => (
                <React.Fragment key={label.id}>
                  <ListItem>
                    <Box display="flex" alignItems="center" width="100%">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: label.color,
                          mr: 2,
                          opacity: 0.5
                        }}
                      />
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Typography variant="subtitle1" component="span" sx={{ opacity: 0.7 }}>
                            {label.name}
                          </Typography>
                          <Chip
                            label="Inactive"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {label.presentationCount} presentation{label.presentationCount !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <IconButton
                          onClick={() => handleReactivateLabel(label.id)}
                          color="primary"
                          size="small"
                          disabled={isSubmitting}
                        >
                          <RestoreFromTrash />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < inactiveLabels.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </div>
      </Paper>

      {/* Delete Confirmation Dialog */}
      {deleteLabel && (
        <DeleteConfirmationDialog
          open={!!deleteLabel}
          onClose={() => setDeleteLabel(null)}
          onConfirm={handleDeleteLabel}
          title={deleteLabel.name}
          isLoading={isSubmitting}
        />
      )}
    </Box>
  );
};

export default LabelsManagement;
