import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box
} from '@mui/material';
import type { Presentation, PresentationFormData } from '../types/presentation';
import type { Label } from '../types/label';
import { apiService } from '../services/api';

interface PresentationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PresentationFormData) => Promise<void>;
  presentation?: Presentation | null;
  isLoading?: boolean;
}

const PresentationForm: React.FC<PresentationFormProps> = ({
  open,
  onClose,
  onSubmit,
  presentation,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<PresentationFormData>({
    title: '',
    labelId: ''
  });
  const [errors, setErrors] = useState<Partial<PresentationFormData>>({});
  const [touched, setTouched] = useState<Partial<PresentationFormData>>({});
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  const isEditMode = !!presentation;

  useEffect(() => {
    if (open) {
      fetchLabels();
    }
  }, [open]);

  useEffect(() => {
    if (presentation) {
      setFormData({
        title: presentation.title,
        labelId: presentation.labelId || ''
      });
    } else {
      setFormData({
        title: '',
        labelId: ''
      });
    }
    setErrors({});
    setTouched({});
  }, [presentation, open]);

  const fetchLabels = async () => {
    try {
      setLabelsLoading(true);
      const activeLabels = await apiService.getActiveLabels();
      setLabels(activeLabels);
    } catch (error) {
      console.error('Error fetching labels:', error);
      // Don't show error to user, just log it
    } finally {
      setLabelsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PresentationFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!formData.labelId.trim()) {
      newErrors.labelId = 'Label is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof PresentationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof PresentationFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    if (formData[field].trim() === '') {
      setErrors(prev => ({ ...prev, [field]: `${field === 'title' ? 'Title' : 'Label'} is required` }));
    } else if (field === 'title' && formData.title.length > 255) {
      setErrors(prev => ({ ...prev, [field]: 'Title must be 255 characters or less' }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await onSubmit(formData);
        onClose();
      } catch (error) {
        // Error handling is done by the parent component
        console.error('Form submission error:', error);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Presentation' : 'Create New Presentation'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => handleFieldBlur('title')}
              error={!!(errors.title && touched.title)}
              helperText={errors.title && touched.title ? errors.title : ''}
              fullWidth
              required
              disabled={isLoading}
              inputProps={{ maxLength: 255 }}
            />
            
            <FormControl fullWidth required error={!!(errors.labelId && touched.labelId)}>
              <InputLabel>Label</InputLabel>
              <Select
                value={formData.labelId}
                onChange={(e) => handleFieldChange('labelId', e.target.value)}
                onBlur={() => handleFieldBlur('labelId')}
                disabled={isLoading || labelsLoading}
                label="Label"
              >
                {labelsLoading ? (
                  <MenuItem disabled>Loading labels...</MenuItem>
                ) : labels.length === 0 ? (
                  <MenuItem disabled>No labels available</MenuItem>
                ) : (
                  labels.map((label) => (
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
                  ))
                )}
              </Select>
              {errors.labelId && touched.labelId && (
                <FormHelperText>{errors.labelId}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formData.title.trim() || !formData.labelId.trim()}
          >
            {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PresentationForm; 