export const QuestionType = {
  MultipleChoiceSingle: 1,
  MultipleChoiceMultiple: 2,
  NumericRating: 3,
  YesNo: 4,
  OpenEnded: 5,
  WordCloud: 6
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface Question {
  id: string;
  presentationId: string;
  text: string;
  type: QuestionType;
  configuration?: any; // JSON configuration for question type
  enableSentimentAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  enableKeywordExtraction: boolean;
  order: number;
  isActive: boolean;
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
  createdDate: string;
  lastUpdated: string;
  responseCount: number;
}

export interface CreateQuestionRequest {
  text: string;
  type: QuestionType;
  configuration?: any;
  enableSentimentAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  enableKeywordExtraction: boolean;
  order: number;
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {
  isActive: boolean;
}

export interface QuestionSummary {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  isActive: boolean;
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
  enableSentimentAnalysis: boolean;
  responseCount: number;
}

export interface ReorderQuestionsRequest {
  questionIds: string[];
}

// Question type-specific configuration interfaces
export interface MultipleChoiceConfig {
  options: string[];
}

export interface NumericRatingConfig {
  minValue: number;
  maxValue: number;
  step?: number;
  labels?: {
    min: string;
    max: string;
  };
}


export interface QuestionFormData {
  text: string;
  type: QuestionType;
  configuration: any;
  enableSentimentAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  enableKeywordExtraction: boolean;
  order: number;
}
