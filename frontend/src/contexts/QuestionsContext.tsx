import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import type { Question } from '../types/question';

// Types
interface QuestionsState {
  questions: Question[];
  questionsLoading: boolean;
  error: string | null;
  lastFetchTime: number;
}

type QuestionsAction =
  | { type: 'SET_QUESTIONS_LOADING'; payload: boolean }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number };

// Initial state
const initialState: QuestionsState = {
  questions: [],
  questionsLoading: false,
  error: null,
  lastFetchTime: 0,
};

// Reducer
function questionsReducer(state: QuestionsState, action: QuestionsAction): QuestionsState {
  switch (action.type) {
    case 'SET_QUESTIONS_LOADING':
      return { ...state, questionsLoading: action.payload, error: null };
    
    case 'SET_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload, 
        questionsLoading: false,
        lastFetchTime: Date.now()
      };
    
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q => 
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        )
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, questionsLoading: false };
    
    case 'SET_LAST_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload };
    
    default:
      return state;
  }
}

// Context
interface QuestionsContextType {
  // State
  questions: Question[];
  questionsLoading: boolean;
  error: string | null;
  
  // Actions
  fetchQuestions: (presentationId: string, force?: boolean) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  setQuestionLive: (id: string, isLive: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getQuestionById: (id: string) => Question | undefined;
  activeQuestions: Question[];
  liveQuestions: Question[];
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

// Provider component
interface QuestionsProviderProps {
  children: React.ReactNode;
}

export const QuestionsProvider: React.FC<QuestionsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(questionsReducer, initialState);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check if data is stale
  const isDataStale = useCallback(() => {
    return Date.now() - state.lastFetchTime > CACHE_DURATION;
  }, [state.lastFetchTime]);

  // Fetch questions with caching
  const fetchQuestions = useCallback(async (presentationId: string, force = false) => {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale() && state.questions.length > 0) {
      console.log('📦 Using cached questions data');
      return;
    }

    try {
      dispatch({ type: 'SET_QUESTIONS_LOADING', payload: true });
      console.log('🌐 Fetching questions from API...');
      
      const data = await apiService.getQuestions(presentationId);
      dispatch({ type: 'SET_QUESTIONS', payload: data });
      
      console.log('✅ Questions fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions. Please try again.' });
    }
  }, [isDataStale, state.questions.length]);

  // Update question (optimistic update)
  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id, updates } });
  }, []);

  // Set question live status
  const setQuestionLive = useCallback((id: string, isLive: boolean) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: { id, updates: { isLive } } });
  }, []);

  // Set error
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Get question by ID
  const getQuestionById = useCallback((id: string) => {
    return state.questions.find(q => q.id === id);
  }, [state.questions]);

  // Computed values
  const activeQuestions = useMemo(() => 
    state.questions.filter(q => q.isActive), 
    [state.questions]
  );

  const liveQuestions = useMemo(() => 
    state.questions.filter(q => q.isLive), 
    [state.questions]
  );

  const value: QuestionsContextType = {
    // State
    questions: state.questions,
    questionsLoading: state.questionsLoading,
    error: state.error,
    
    // Actions
    fetchQuestions,
    updateQuestion,
    setQuestionLive,
    setError,
    
    // Computed values
    getQuestionById,
    activeQuestions,
    liveQuestions,
  };

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  );
};

// Custom hook to use the context
export const useQuestions = (): QuestionsContextType => {
  const context = useContext(QuestionsContext);
  if (context === undefined) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
};
