import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  keyframes
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Psychology,
  TextFields,
  CheckCircle,
  RadioButtonChecked,
  LinearScale,
  Cloud,
  QuestionAnswer
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QuestionForm from './QuestionForm';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import type { Question, QuestionFormData, QuestionType } from '../types/question';
import { QuestionType as QuestionTypeValues } from '../types/question';
import type { Presentation } from '../types/presentation';
import { apiService } from '../services/api';

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

interface QuestionsManagementProps {
  presentation: Presentation;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  isLoading?: boolean;
}

// Sortable Question Item Component
const SortableQuestionItem: React.FC<{
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  operationLoading: string | null;
  getQuestionTypeIcon: (type: QuestionType) => React.ReactElement;
  getQuestionTypeLabel: (type: QuestionType) => string;
  getNlpFeaturesText: (question: Question) => string;
}> = ({ 
  question, 
  index, 
  onEdit, 
  onDelete, 
  operationLoading,
  getQuestionTypeIcon,
  getQuestionTypeLabel,
  getNlpFeaturesText
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 1,
        backgroundColor: isDragging ? 'action.hover' : 'background.paper',
        opacity: question.isActive ? 1 : 0.7,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? 3 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
        <Tooltip title="Drag to reorder">
          <IconButton 
            size="small" 
            sx={{ 
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              '&:hover': { backgroundColor: 'action.hover' }
            }}
            {...attributes}
            {...listeners}
          >
            <DragIndicator color={isDragging ? "primary" : "action"} />
          </IconButton>
        </Tooltip>
        <Chip 
          label={index + 1} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </Box>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getQuestionTypeIcon(question.type)}
            <Typography variant="subtitle1" component="span">
              {question.text}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Chip 
                label={getQuestionTypeLabel(question.type)} 
                size="small" 
                variant="outlined"
              />
              {(question.enableSentimentAnalysis || question.enableEmotionAnalysis || question.enableKeywordExtraction) && (
                <Chip 
                  icon={<Psychology />} 
                  label={getNlpFeaturesText(question)} 
                  size="small" 
                  color="secondary"
                />
              )}
              {!question.isActive && (
                <Chip 
                  label="Inactive" 
                  size="small" 
                  color="error"
                />
              )}
              {question.isLive && (
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
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {question.responseCount} responses
            </Typography>
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />

      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Edit question">
            <IconButton
              onClick={() => onEdit(question)}
              color="primary"
              disabled={operationLoading === 'form'}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete question">
            <IconButton
              onClick={() => onDelete(question)}
              color="error"
              disabled={operationLoading === question.id}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const QuestionsManagement: React.FC<QuestionsManagementProps> = ({
  presentation,
  questions,
  onQuestionsChange,
  isLoading = false
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionTypeValues.MultipleChoiceSingle:
        return <RadioButtonChecked color="primary" />;
      case QuestionTypeValues.MultipleChoiceMultiple:
        return <CheckCircle color="primary" />;
      case QuestionTypeValues.NumericRating:
        return <LinearScale color="primary" />;
      case QuestionTypeValues.YesNo:
        return <QuestionAnswer color="primary" />;
      case QuestionTypeValues.OpenEnded:
        return <TextFields color="primary" />;
      case QuestionTypeValues.WordCloud:
        return <Cloud color="primary" />;
      default:
        return <QuestionAnswer color="primary" />;
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case QuestionTypeValues.MultipleChoiceSingle:
        return 'Multiple Choice (Single)';
      case QuestionTypeValues.MultipleChoiceMultiple:
        return 'Multiple Choice (Multiple)';
      case QuestionTypeValues.NumericRating:
        return 'Numeric Rating';
      case QuestionTypeValues.YesNo:
        return 'Yes/No';
      case QuestionTypeValues.OpenEnded:
        return 'Open Ended';
      case QuestionTypeValues.WordCloud:
        return 'Word Cloud';
      default:
        return 'Unknown';
    }
  };

  const getNlpFeaturesText = (question: Question): string => {
    const features = [];
    if (question.enableSentimentAnalysis) features.push('Sentiment');
    if (question.enableEmotionAnalysis) features.push('Emotion');
    if (question.enableKeywordExtraction) features.push('Keywords');
    
    return features.length > 0 ? features.join(', ') : 'No text analysis';
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsFormOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setIsDeleteDialogOpen(true);
  };


  const handleFormSubmit = async (data: QuestionFormData) => {
    try {
      setError(null);
      setOperationLoading('form');
      
      if (editingQuestion) {
        // Update existing question
        const updatedQuestionData = await apiService.updateQuestion(presentation.id, editingQuestion.id, {
          ...data,
          isActive: editingQuestion.isActive
        });
        
        const updatedQuestions = questions.map(q => 
          q.id === editingQuestion.id ? updatedQuestionData : q
        );
        onQuestionsChange(updatedQuestions);
      } else {
        // Add new question
        const newQuestion = await apiService.createQuestion(presentation.id, data);
        console.log('newQuestion', newQuestion);
        onQuestionsChange([...questions, newQuestion]);
      }
      
      setIsFormOpen(false);
      setEditingQuestion(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save question');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      setError(null);
      setOperationLoading(questionToDelete.id);
      
      await apiService.deleteQuestion(presentation.id, questionToDelete.id);
      const updatedQuestions = questions.filter(q => q.id !== questionToDelete.id);
      onQuestionsChange(updatedQuestions);
      setIsDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete question');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedQuestions.findIndex(q => q.id === active.id);
      const newIndex = sortedQuestions.findIndex(q => q.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedQuestions, oldIndex, newIndex);
        const questionIds = newOrder.map(q => q.id);
        
        try {
          setError(null);
          
          // Update order locally first for immediate UI feedback
          const reorderedQuestions = questionIds.map((id, index) => {
            const question = questions.find(q => q.id === id);
            return question ? { ...question, order: index + 1 } : null;
          }).filter(Boolean) as Question[];
          
          onQuestionsChange(reorderedQuestions);
          
          // Sync with backend
          await apiService.reorderQuestions(presentation.id, { questionIds });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to reorder questions');
          // Revert to original order on error
          const originalQuestions = [...questions].sort((a, b) => a.order - b.order);
          onQuestionsChange(originalQuestions);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Questions ({questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddQuestion}
          disabled={operationLoading === 'form'}
        >
          Add Question
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add your first question to start building your presentation
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddQuestion}
            disabled={operationLoading === 'form'}
          >
            Add First Question
          </Button>
        </Paper>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedQuestions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <List>
              {sortedQuestions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                  operationLoading={operationLoading}
                  getQuestionTypeIcon={getQuestionTypeIcon}
                  getQuestionTypeLabel={getQuestionTypeLabel}
                  getNlpFeaturesText={getNlpFeaturesText}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      )}

      {/* Question Form Dialog */}
      <QuestionForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuestion(null);
        }}
        onSubmit={handleFormSubmit}
        question={editingQuestion}
        order={questions.length + 1}
        isLoading={operationLoading === 'form'}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setQuestionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={questionToDelete?.text || 'Question'}
        isLoading={operationLoading === questionToDelete?.id}
      />
    </Box>
  );
};

export default QuestionsManagement;
