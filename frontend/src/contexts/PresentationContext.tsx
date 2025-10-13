import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import type { Presentation } from '../types/presentation';
import type { Label } from '../types/label';

// Types
interface PresentationState {
  presentations: Presentation[];
  labels: Label[];
  selectedPresentation: Presentation | null;
  presentationsLoading: boolean;
  labelsLoading: boolean;
  error: string | null;
  lastFetchTime: number;
}

type PresentationAction =
  | { type: 'SET_PRESENTATIONS_LOADING'; payload: boolean }
  | { type: 'SET_LABELS_LOADING'; payload: boolean }
  | { type: 'SET_PRESENTATIONS'; payload: Presentation[] }
  | { type: 'SET_LABELS'; payload: Label[] }
  | { type: 'SET_SELECTED_PRESENTATION'; payload: Presentation | null }
  | { type: 'UPDATE_PRESENTATION'; payload: { id: string; updates: Partial<Presentation> } }
  | { type: 'ADD_PRESENTATION'; payload: Presentation }
  | { type: 'REMOVE_PRESENTATION'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number };

// Initial state
const initialState: PresentationState = {
  presentations: [],
  labels: [],
  selectedPresentation: null,
  presentationsLoading: false,
  labelsLoading: false,
  error: null,
  lastFetchTime: 0,
};

// Reducer
function presentationReducer(state: PresentationState, action: PresentationAction): PresentationState {
  switch (action.type) {
    case 'SET_PRESENTATIONS_LOADING':
      return { ...state, presentationsLoading: action.payload, error: null };
    
    case 'SET_LABELS_LOADING':
      return { ...state, labelsLoading: action.payload };
    
    case 'SET_PRESENTATIONS':
      return { 
        ...state, 
        presentations: action.payload, 
        presentationsLoading: false,
        lastFetchTime: Date.now()
      };
    
    case 'SET_LABELS':
      return { ...state, labels: action.payload, labelsLoading: false };
    
    case 'SET_SELECTED_PRESENTATION':
      return { ...state, selectedPresentation: action.payload };
    
    case 'UPDATE_PRESENTATION':
      return {
        ...state,
        presentations: state.presentations.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
        selectedPresentation: state.selectedPresentation?.id === action.payload.id
          ? { ...state.selectedPresentation, ...action.payload.updates }
          : state.selectedPresentation
      };
    
    case 'ADD_PRESENTATION':
      return {
        ...state,
        presentations: [action.payload, ...state.presentations]
      };
    
    case 'REMOVE_PRESENTATION':
      return {
        ...state,
        presentations: state.presentations.filter(p => p.id !== action.payload),
        selectedPresentation: state.selectedPresentation?.id === action.payload ? null : state.selectedPresentation
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, presentationsLoading: false };
    
    case 'SET_LAST_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload };
    
    default:
      return state;
  }
}

// Context
interface PresentationContextType {
  // State
  presentations: Presentation[];
  labels: Label[];
  selectedPresentation: Presentation | null;
  presentationsLoading: boolean;
  labelsLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPresentations: (force?: boolean) => Promise<void>;
  fetchLabels: () => Promise<void>;
  selectPresentation: (presentation: Presentation | null) => void;
  updatePresentation: (id: string, updates: Partial<Presentation>) => void;
  addPresentation: (presentation: Presentation) => void;
  removePresentation: (id: string) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  activeLabels: Label[];
  presentationsWithQuestions: number;
  totalQuestions: number;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

// Provider component
interface PresentationProviderProps {
  children: React.ReactNode;
}

export const PresentationProvider: React.FC<PresentationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(presentationReducer, initialState);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check if data is stale
  const isDataStale = useCallback(() => {
    return Date.now() - state.lastFetchTime > CACHE_DURATION;
  }, [state.lastFetchTime]);

  // Fetch presentations with caching
  const fetchPresentations = useCallback(async (force = false) => {
    // Skip if data is fresh and not forced
    if (!force && !isDataStale() && state.presentations.length > 0) {
      console.log('📦 Using cached presentations data');
      return;
    }

    try {
      dispatch({ type: 'SET_PRESENTATIONS_LOADING', payload: true });
      console.log('🌐 Fetching presentations from API...');
      
      const data = await apiService.getPresentations();
      dispatch({ type: 'SET_PRESENTATIONS', payload: data });
      
      console.log('✅ Presentations fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching presentations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load presentations. Please try again.' });
    }
  }, [isDataStale, state.presentations.length]);

  // Fetch labels
  const fetchLabels = useCallback(async () => {
    if (state.labels.length > 0) {
      console.log('📦 Using cached labels data');
      return;
    }

    try {
      dispatch({ type: 'SET_LABELS_LOADING', payload: true });
      console.log('🌐 Fetching labels from API...');
      
      const data = await apiService.getAllLabels();
      dispatch({ type: 'SET_LABELS', payload: data });
      
      console.log('✅ Labels fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching labels:', error);
    }
  }, [state.labels.length]);

  // Select presentation
  const selectPresentation = useCallback((presentation: Presentation | null) => {
    dispatch({ type: 'SET_SELECTED_PRESENTATION', payload: presentation });
  }, []);

  // Update presentation (optimistic update)
  const updatePresentation = useCallback((id: string, updates: Partial<Presentation>) => {
    dispatch({ type: 'UPDATE_PRESENTATION', payload: { id, updates } });
  }, []);

  // Add presentation
  const addPresentation = useCallback((presentation: Presentation) => {
    dispatch({ type: 'ADD_PRESENTATION', payload: presentation });
  }, []);

  // Remove presentation
  const removePresentation = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PRESENTATION', payload: id });
  }, []);

  // Set error
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Computed values
  const activeLabels = useMemo(() => 
    state.labels.filter(label => label.isActive), 
    [state.labels]
  );

  const presentationsWithQuestions = useMemo(() => 
    state.presentations.filter(p => (p.questions?.length || 0) > 0).length, 
    [state.presentations]
  );

  const totalQuestions = useMemo(() => 
    state.presentations.reduce((sum, p) => sum + (p.questions?.length || 0), 0), 
    [state.presentations]
  );

  const value: PresentationContextType = {
    // State
    presentations: state.presentations,
    labels: state.labels,
    selectedPresentation: state.selectedPresentation,
    presentationsLoading: state.presentationsLoading,
    labelsLoading: state.labelsLoading,
    error: state.error,
    
    // Actions
    fetchPresentations,
    fetchLabels,
    selectPresentation,
    updatePresentation,
    addPresentation,
    removePresentation,
    setError,
    
    // Computed values
    activeLabels,
    presentationsWithQuestions,
    totalQuestions,
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
};

// Custom hook to use the context
export const usePresentations = (): PresentationContextType => {
  const context = useContext(PresentationContext);
  if (context === undefined) {
    throw new Error('usePresentations must be used within a PresentationProvider');
  }
  return context;
};
