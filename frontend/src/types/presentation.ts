import type { QuestionSummary } from './question';

export interface LabelInfo {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface Presentation {
  id: string;
  title: string;
  createdDate: string;
  lastUpdated: string;
  labelId?: string;
  label?: LabelInfo;
  questions?: QuestionSummary[];
  questionCount: number;
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
}

export interface CreatePresentationRequest {
  title: string;
  labelId?: string;
}

export interface UpdatePresentationRequest {
  title: string;
  labelId?: string;
}

export interface PresentationFormData {
  title: string;
  labelId: string;
}

export type SortField = 'createdDate' | 'lastUpdated';
export type SortOrder = 'asc' | 'desc';

export interface PresentationFilters {
  labelId: string;
  search: string;
  sortBy: SortField;
  sortOrder: SortOrder;
} 