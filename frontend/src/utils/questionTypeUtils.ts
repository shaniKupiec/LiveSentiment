import { QuestionType } from '../types/question';

/**
 * Centralized utility for question type names and labels
 * Ensures consistent naming across all frontend components
 */
export const QuestionTypeLabels = {
  [QuestionType.MultipleChoiceSingle]: 'Single Choice',
  [QuestionType.MultipleChoiceMultiple]: 'Multiple Choice',
  [QuestionType.NumericRating]: 'Numeric Rating',
  [QuestionType.YesNo]: 'Yes/No',
  [QuestionType.OpenEnded]: 'Open Ended',
  [QuestionType.WordCloud]: 'Word Cloud',
} as const;

/**
 * Get the display name for a question type
 * @param type - The question type enum value
 * @returns The human-readable name for the question type
 */
export const getQuestionTypeName = (type: QuestionType): string => {
  return QuestionTypeLabels[type] || 'Unknown';
};

/**
 * Get the display name for a question type with additional context
 * @param type - The question type enum value
 * @param includeParentheses - Whether to include additional context in parentheses
 * @returns The human-readable name for the question type
 */
export const getQuestionTypeDisplayName = (type: QuestionType, includeParentheses: boolean = false): string => {
  const baseName = getQuestionTypeName(type);
  
  if (!includeParentheses) {
    return baseName;
  }
  
  switch (type) {
    case QuestionType.MultipleChoiceSingle:
      return 'Single Choice';
    case QuestionType.MultipleChoiceMultiple:
      return 'Multiple Choice';
    default:
      return baseName;
  }
};

/**
 * Get all question type options for dropdowns/selects
 * @returns Array of { value, label } objects for form controls
 */
export const getQuestionTypeOptions = () => {
  return Object.entries(QuestionTypeLabels).map(([value, label]) => ({
    value: parseInt(value),
    label,
  }));
};

/**
 * Check if a question type supports multiple selections
 * @param type - The question type enum value
 * @returns True if the question type allows multiple selections
 */
export const isMultipleSelectionType = (type: QuestionType): boolean => {
  return type === QuestionType.MultipleChoiceMultiple;
};

/**
 * Check if a question type requires configuration options
 * @param type - The question type enum value
 * @returns True if the question type needs configuration
 */
export const requiresConfiguration = (type: QuestionType): boolean => {
  return type !== QuestionType.YesNo && type !== QuestionType.OpenEnded;
};
