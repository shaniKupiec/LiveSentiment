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
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import { 
  ExpandMore, 
  Add, 
  Delete, 
  HelpOutline, 
  Psychology, 
  SentimentSatisfied, 
  EmojiEmotions, 
  Key, 
  CloudQueue,
  TextFields,
  RadioButtonChecked,
  CheckBox,
  LinearScale,
  QuestionAnswer
} from '@mui/icons-material';
import type { Question, QuestionFormData, QuestionType, MultipleChoiceConfig, NumericRatingConfig } from '../types/question';
import { QuestionType as QuestionTypeValues } from '../types/question';
import { getQuestionTypeOptions } from '../utils/questionTypeUtils';

interface QuestionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  question?: Question | null;
  isLoading?: boolean;
  order: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  open,
  onClose,
  onSubmit,
  question,
  isLoading = false,
  order
}) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    text: '',
    type: QuestionTypeValues.MultipleChoiceSingle,
    configuration: {},
    enableSentimentAnalysis: false,
    enableEmotionAnalysis: false,
    enableKeywordExtraction: false,
    order: order
  });
  const [errors, setErrors] = useState<Partial<QuestionFormData>>({});
  const [touched, setTouched] = useState<Partial<QuestionFormData>>({});

  const isEditMode = !!question;

  // Reset form when dialog opens/closes or question changes
  useEffect(() => {
    if (open) {
      if (question) {
        setFormData({
          text: question.text,
          type: question.type,
          configuration: question.configuration || {},
          enableSentimentAnalysis: question.enableSentimentAnalysis,
          enableEmotionAnalysis: question.enableEmotionAnalysis,
          enableKeywordExtraction: question.enableKeywordExtraction,
          order: question.order
        });
      } else {
        setFormData({
          text: '',
          type: QuestionTypeValues.MultipleChoiceSingle,
          configuration: getDefaultConfiguration(QuestionTypeValues.MultipleChoiceSingle),
          enableSentimentAnalysis: false,
          enableEmotionAnalysis: false,
          enableKeywordExtraction: false,
          order: order
        });
      }
      setErrors({});
      setTouched({});
    }
  }, [question, open, order]);

  const getDefaultConfiguration = (type: QuestionType): any => {
    switch (type) {
      case QuestionTypeValues.MultipleChoiceSingle:
      case QuestionTypeValues.MultipleChoiceMultiple:
        return { options: ['Option 1', 'Option 2'] };
      case QuestionTypeValues.NumericRating:
        return { minValue: 1, maxValue: 10, step: 1, labels: { min: 'Poor', max: 'Excellent' } };
      default:
        return {};
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<QuestionFormData> = {};

    // Validate question text
    if (!formData.text.trim()) {
      newErrors.text = 'Question text is required';
    } else if (formData.text.length > 500) {
      newErrors.text = 'Question text must be 500 characters or less';
    }

    // Validate configuration based on question type
    if (formData.type === QuestionTypeValues.MultipleChoiceSingle || formData.type === QuestionTypeValues.MultipleChoiceMultiple) {
      const config = formData.configuration as MultipleChoiceConfig;
      if (!config.options || config.options.length < 2) {
        newErrors.configuration = 'At least 2 options are required';
      } else {
        // Check for empty option texts
        const emptyOptions = config.options.filter(option => !option.trim());
        if (emptyOptions.length > 0) {
          newErrors.configuration = 'All options must have text';
        }
      }
    }

    if (formData.type === QuestionTypeValues.NumericRating) {
      const config = formData.configuration as NumericRatingConfig;
      if (config.minValue >= config.maxValue) {
        newErrors.configuration = 'Minimum value must be less than maximum value';
      } else if (config.step && config.step <= 0) {
        newErrors.configuration = 'Step value must be greater than 0';
      } else if (config.step && (config.maxValue - config.minValue) < config.step) {
        newErrors.configuration = 'Step value is too large for the given range';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleTypeChange = (newType: QuestionType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      configuration: getDefaultConfiguration(newType),
      // Reset NLP options for non-text questions
      enableTextAnalysis: newType === QuestionTypeValues.OpenEnded || newType === QuestionTypeValues.WordCloud,
      enableSentimentAnalysis: false,
      enableEmotionAnalysis: false,
      enableKeywordExtraction: false
    }));
    
    // Clear configuration errors when type changes
    if (errors.configuration) {
      setErrors(prev => ({ ...prev, configuration: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const renderConfigurationFields = () => {
    switch (formData.type) {
      case QuestionTypeValues.MultipleChoiceSingle:
      case QuestionTypeValues.MultipleChoiceMultiple:
        return renderMultipleChoiceConfig();
      case QuestionTypeValues.NumericRating:
        return renderNumericRatingConfig();
      default:
        return null;
    }
  };

  const renderMultipleChoiceConfig = () => {
    const config = formData.configuration as MultipleChoiceConfig;
    
    const addOption = () => {
      const newOptions = [...(config.options || []), `Option ${(config.options?.length || 0) + 1}`];
      handleFieldChange('configuration', { ...config, options: newOptions });
    };

    const removeOption = (index: number) => {
      if ((config.options?.length || 0) <= 2) return; // Prevent removing below minimum
      const newOptions = config.options?.filter((_, i) => i !== index) || [];
      handleFieldChange('configuration', { ...config, options: newOptions });
    };

    const updateOption = (index: number, value: string) => {
      const newOptions = [...(config.options || [])];
      newOptions[index] = value;
      handleFieldChange('configuration', { ...config, options: newOptions });
    };


    return (
      <Box>
        <Typography variant="h6" gutterBottom>Multiple Choice Options</Typography>
        
        <List>
          {(config.options || []).map((option, index) => (
            <ListItem key={index}>
              <TextField
                fullWidth
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                size="small"
                            error={!!(touched.configuration && !option.trim())}
            helperText={!!(touched.configuration && !option.trim()) ? 'Option text is required' : ''}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => removeOption(index)}
                  disabled={(config.options?.length || 0) <= 2}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        
        <Button
          startIcon={<Add />}
          onClick={addOption}
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
        >
          Add Option
        </Button>

      </Box>
    );
  };

  const renderNumericRatingConfig = () => {
    const config = formData.configuration as NumericRatingConfig;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Rating Scale Configuration</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Minimum Value"
            type="number"
            value={config.minValue || 1}
            onChange={(e) => handleFieldChange('configuration', { 
              ...config, 
              minValue: parseInt(e.target.value) || 1 
            })}
            size="small"
            inputProps={{ min: -100, max: 100 }}
          />
          <TextField
            label="Maximum Value"
            type="number"
            value={config.maxValue || 10}
            onChange={(e) => handleFieldChange('configuration', { 
              ...config, 
              maxValue: parseInt(e.target.value) || 10 
            })}
            size="small"
            inputProps={{ min: -100, max: 100 }}
          />
          <TextField
            label="Step"
            type="number"
            value={config.step || 1}
            onChange={(e) => handleFieldChange('configuration', { 
              ...config, 
              step: parseInt(e.target.value) || 1 
            })}
            size="small"
            inputProps={{ min: 1, max: 100 }}
            error={config.step !== undefined && config.step <= 0}
            helperText={config.step !== undefined && config.step <= 0 ? 'Step must be greater than 0' : ''}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Min Label"
            value={config.labels?.min || ''}
            onChange={(e) => handleFieldChange('configuration', { 
              ...config, 
              labels: { ...config.labels, min: e.target.value } 
            })}
            size="small"
            placeholder="e.g., Poor"
            helperText="Label for the minimum value (e.g., 'Not interested', 'Very dissatisfied')"
          />
          <TextField
            label="Max Label"
            value={config.labels?.max || ''}
            onChange={(e) => handleFieldChange('configuration', { 
              ...config, 
              labels: { ...config.labels, max: e.target.value } 
            })}
            size="small"
            placeholder="e.g., Excellent"
            helperText="Label for the maximum value (e.g., 'Very interested', 'Extremely satisfied')"
          />
        </Box>
      </Box>
    );
  };


  const canEnableTextAnalysis = formData.type === QuestionTypeValues.OpenEnded || formData.type === QuestionTypeValues.WordCloud;

  // Helper function to get question type description and icon
  const getQuestionTypeInfo = (type: number) => {
    switch (type) {
      case QuestionTypeValues.MultipleChoiceSingle:
        return {
          icon: <RadioButtonChecked color="primary" />,
          description: "Single choice from multiple options. Perfect for surveys and polls.",
          example: "What is your favorite programming language?"
        };
      case QuestionTypeValues.MultipleChoiceMultiple:
        return {
          icon: <CheckBox color="primary" />,
          description: "Multiple selections allowed. Great for gathering preferences.",
          example: "Which technologies do you use? (Select all that apply)"
        };
      case QuestionTypeValues.YesNo:
        return {
          icon: <QuestionAnswer color="primary" />,
          description: "Simple yes/no or true/false questions. Quick binary decisions.",
          example: "Do you have experience with React?"
        };
      case QuestionTypeValues.NumericRating:
        return {
          icon: <LinearScale color="primary" />,
          description: "Rating scale with min/max values. Ideal for satisfaction surveys.",
          example: "Rate your experience from 1-10"
        };
      case QuestionTypeValues.OpenEnded:
        return {
          icon: <TextFields color="primary" />,
          description: "Free-form text responses. Perfect for detailed feedback and comments.",
          example: "What suggestions do you have for improvement?"
        };
      case QuestionTypeValues.WordCloud:
        return {
          icon: <CloudQueue color="primary" />,
          description: "Short text responses for keyword extraction. Creates visual word clouds.",
          example: "Enter words separated by commas: innovation, teamwork, growth"
        };
      default:
        return {
          icon: <QuestionAnswer color="primary" />,
          description: "Select a question type to see details.",
          example: ""
        };
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Question' : 'Add New Question'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Basic Question Fields */}
          <TextField
            fullWidth
            label="Question Text"
            value={formData.text}
            onChange={(e) => handleFieldChange('text', e.target.value)}
            error={!!(touched.text && errors.text)}
            helperText={touched.text && errors.text}
            multiline
            rows={3}
            placeholder="Enter your question here..."
            required
          />

          <FormControl fullWidth>
            <InputLabel>Question Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              label="Question Type"
            >
              {getQuestionTypeOptions().map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    {getQuestionTypeInfo(value).icon}
                    <Box>
                      <Typography variant="body1">{label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getQuestionTypeInfo(value).description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Question Type Information */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getQuestionTypeInfo(formData.type).icon}
              <Typography variant="subtitle2">
                {getQuestionTypeOptions().find(opt => opt.value === formData.type)?.label}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {getQuestionTypeInfo(formData.type).description}
            </Typography>
            {getQuestionTypeInfo(formData.type).example && (
              <Typography variant="body2" color="text.secondary">
                <strong>Example:</strong> {getQuestionTypeInfo(formData.type).example}
              </Typography>
            )}
          </Alert>

          {/* Type-specific Configuration */}
          {formData.type !== QuestionTypeValues.YesNo && 
           formData.type !== QuestionTypeValues.OpenEnded && 
           formData.type !== QuestionTypeValues.WordCloud && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Question Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderConfigurationFields()}
                {errors.configuration && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    {errors.configuration}
                  </FormHelperText>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* NLP Configuration */}
          {canEnableTextAnalysis && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="primary" />
                  <Typography variant="subtitle1">Text Analysis Options</Typography>
                  <Tooltip title="AI-powered analysis of text responses to extract insights">
                    <HelpOutline fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Sentiment Analysis */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                      <SentimentSatisfied color="primary" />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.enableSentimentAnalysis}
                            onChange={(e) => handleFieldChange('enableSentimentAnalysis', e.target.checked)}
                          />
                        }
                        label="Sentiment Analysis"
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Analyzes whether responses are positive, negative, or neutral
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Example: "Great session!" → Positive (0.9 confidence)
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Emotion Detection */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                      <EmojiEmotions color="primary" />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.enableEmotionAnalysis}
                            onChange={(e) => handleFieldChange('enableEmotionAnalysis', e.target.checked)}
                          />
                        }
                        label="Emotion Detection"
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Detects emotions: Joy, Sadness, Anger, Fear, Surprise, Disgust, Neutral
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Example: "I'm excited about this!" → Joy (0.85 confidence)
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Keyword Extraction */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                      <Key color="primary" />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.enableKeywordExtraction}
                            onChange={(e) => handleFieldChange('enableKeywordExtraction', e.target.checked)}
                          />
                        }
                        label="Keyword Extraction"
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Extracts important words and phrases, creates word clouds
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Example: "I learned about React and JavaScript" → ["React", "JavaScript", "learned"]
                      </Typography>
                    </Box>
                  </Box>

                  {/* Word Cloud specific guidance */}
                  {formData.type === QuestionTypeValues.WordCloud && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>💡 Word Cloud Tip:</strong> Encourage participants to enter words separated by commas for better keyword extraction.
                        <br />
                        <strong>Example:</strong> "innovation, teamwork, growth, challenges, success"
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Order Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Question Order:
            </Typography>
            <Chip label={formData.order} size="small" />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (isEditMode ? 'Update Question' : 'Add Question')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionForm;
