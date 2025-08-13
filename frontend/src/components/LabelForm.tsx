import React, { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import type { CreateLabelRequest, UpdateLabelRequest, Label } from '../types/label';
import { LABEL_COLORS, COLOR_NAMES } from '../types/label';

interface LabelFormProps {
  label?: Label | null;
  onSubmit: (data: CreateLabelRequest | UpdateLabelRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LabelForm: React.FC<LabelFormProps> = ({ 
  label, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [name, setName] = useState(label?.name || '');
  const [color, setColor] = useState(label?.color || LABEL_COLORS[0]);
  const [isActive, setIsActive] = useState(label?.isActive ?? true);

  useEffect(() => {
    if (label) {
      setName(label.name);
      setColor(label.color);
      setIsActive(label.isActive);
    }
  }, [label]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (label) {
      // Update existing label
      onSubmit({
        name,
        color,
        isActive
      } as UpdateLabelRequest);
    } else {
      // Create new label
      onSubmit({
        name,
        color
      } as CreateLabelRequest);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Label Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter label name"
        inputProps={{ maxLength: 100 }}
        required
        sx={{ mb: 2 }}
        helperText={`${name.length}/100 characters`}
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Color *
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {LABEL_COLORS.map((colorOption) => (
            <Box
              key={colorOption}
              onClick={() => setColor(colorOption)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: colorOption,
                border: color === colorOption ? '3px solid #000' : '2px solid #ccc',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  borderColor: '#666'
                },
                transform: color === colorOption ? 'scale(1.1)' : 'scale(1)',
                boxShadow: color === colorOption ? 2 : 1
              }}
              title={colorOption}
            />
          ))}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '4px',
              backgroundColor: color,
              border: '1px solid #ccc'
            }}
          />
          <Typography variant="body2">
            {COLOR_NAMES[color] || color}
          </Typography>
        </Box>
      </Box>

      {label && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              color="primary"
            />
          }
          label="Active"
          sx={{ mb: 3 }}
        />
      )}

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? 'Saving...' : label ? 'Update Label' : 'Create Label'}
        </Button>
      </Box>
    </Box>
  );
};

export default LabelForm;
