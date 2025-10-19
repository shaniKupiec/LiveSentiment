import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useSignalR } from './useSignalR';

export interface QuestionResults {
  questionId: string;
  questionText: string;
  questionType: number;
  isLive: boolean;
  liveStartedAt?: string;
  liveEndedAt?: string;
  totalResponses: number;
  uniqueSessions: number;
  responses: Array<{
    id: string;
    value: string;
    sessionId: string;
    timestamp: string;
    analysisResults?: any;
    analysisCompleted?: boolean;
    analysisProvider?: string;
    analysisError?: string;
    analysisTimestamp?: string;
  }>;
  choiceCounts?: Record<string, number>;
  numericStats?: {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
  };
  yesNoCounts?: {
    yes: number;
    no: number;
  };
  nlpAnalysis?: {
    totalResponses: number;
    analyzedResponses: number;
    sentimentCounts: Record<string, number>;
    sentimentPercentages: Record<string, number>;
    emotionCounts: Record<string, number>;
    emotionPercentages: Record<string, number>;
    topKeywords: Array<{
      text: string;
      count: number;
      percentage: number;
      averageRelevance: number;
    }>;
    uniqueKeywords: number;
    averageConfidence: number;
  };
}

interface UseQuestionResultsOptions {
  presentationId: string;
  questionId: string;
  isExpanded: boolean;
  pollingInterval?: number; // in milliseconds, default 5000 (5 seconds)
  enableRealTime?: boolean; // default true
  enablePolling?: boolean; // default true
}

interface UseQuestionResultsReturn {
  results: QuestionResults | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Custom hook for managing question results data with optimized real-time and polling strategies
 * 
 * Strategy:
 * 1. Real-time updates via SignalR when new responses are received (primary)
 * 2. Periodic polling only as backup when SignalR is disconnected
 * 3. Manual refresh capability
 * 4. Optimized to only fetch when accordion is expanded
 * 5. Eliminates redundant polling when SignalR is connected
 */
export const useQuestionResults = ({
  presentationId,
  questionId,
  isExpanded,
  pollingInterval = 5000,
  enableRealTime = true,
  enablePolling = true
}: UseQuestionResultsOptions): UseQuestionResultsReturn => {
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get SignalR connection for real-time updates
  const { isConnected, onResponseReceived, onNLPAnalysisCompleted } = useSignalR({ autoConnect: false });

  // Fetch results from API
  const fetchResults = useCallback(async (): Promise<void> => {
    if (!isExpanded) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getQuestionResults(presentationId, questionId);
      setResults(data);
      setLastUpdated(new Date());
      
      console.log(`📊 Question results updated for ${questionId}:`, {
        totalResponses: data?.totalResponses || 0,
        uniqueSessions: data?.uniqueSessions || 0,
        hasResponses: data?.responses?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to fetch question results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [presentationId, questionId, isExpanded]); // Added isExpanded back to dependency array

  // Keep ref updated with latest fetchResults function
  const fetchResultsRef = useRef(fetchResults);
  fetchResultsRef.current = fetchResults;

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    await fetchResults();
  }, [fetchResults]);

  // Initial load for all questions when expanded
  useEffect(() => {
    if (!isExpanded) return;

    // Always fetch results when accordion is expanded (not just on initial load)
    console.log(`🚀 Calling fetchResults for question ${questionId}`);
    fetchResults();
  }, [isExpanded, fetchResults]);

  // Set up polling interval only when SignalR is disconnected (as backup)
  useEffect(() => {
    if (!isExpanded || !enablePolling || isConnected) {
      // Don't poll if SignalR is connected - rely on real-time updates instead
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Only poll as backup when SignalR is disconnected
    console.log(`🔄 Starting backup polling for question ${questionId} (SignalR disconnected)`);
    pollingIntervalRef.current = setInterval(() => {
      fetchResultsRef.current();
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isExpanded, enablePolling, isConnected, pollingInterval, questionId]); // Removed fetchResults dependency

  // Set up real-time SignalR updates
  useEffect(() => {
    if (!isExpanded || !enableRealTime || !isConnected) return;

    const handleResponseReceived = (data: any) => {
      // Only update if this response is for the current question
      if (data.questionId === questionId) {
        console.log(`🔄 Real-time update received for question ${questionId}`);
        
        // Debounce rapid updates - only fetch if we haven't fetched recently
        const now = new Date();
        const timeSinceLastUpdate = lastUpdated ? now.getTime() - lastUpdated.getTime() : Infinity;
        
        // If it's been more than 1 second since last update, fetch new data
        if (timeSinceLastUpdate > 1000) {
          fetchResults();
        }
      }
    };

    const handleNLPAnalysisCompleted = (data: any) => {
      // Only update if this analysis is for the current question
      if (data.questionId === questionId) {
        console.log(`🧠 NLP Analysis completed for question ${questionId}, refreshing results`);
        // Immediately fetch new data when NLP analysis completes
        fetchResults();
      }
    };

    onResponseReceived(handleResponseReceived);
    onNLPAnalysisCompleted(handleNLPAnalysisCompleted);

    // Cleanup is handled by the useSignalR hook
  }, [isExpanded, enableRealTime, isConnected, questionId, onResponseReceived, onNLPAnalysisCompleted, fetchResults, lastUpdated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    refresh,
    lastUpdated
  };
};

/**
 * Hook for managing multiple question results efficiently with shared polling
 * Consolidates polling intervals to reduce API calls and improve performance
 */
export const useMultipleQuestionResults = (
  presentationId: string,
  questionIds: string[],
  options?: {
    pollingInterval?: number;
    enableRealTime?: boolean;
    enablePolling?: boolean;
  }
) => {
  const {
    pollingInterval = 10000,
    enableRealTime = true,
    enablePolling = true
  } = options || {};

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [resultsCache, setResultsCache] = useState<Map<string, QuestionResults>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errorStates, setErrorStates] = useState<Map<string, string | null>>(new Map());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get SignalR connection for real-time updates
  const { isConnected, onResponseReceived, onNLPAnalysisCompleted } = useSignalR({ autoConnect: false });

  const toggleQuestion = useCallback((questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  const getQuestionResults = useCallback((questionId: string) => {
    return resultsCache.get(questionId) || null;
  }, [resultsCache]);

  const getLoadingState = useCallback((questionId: string) => {
    return loadingStates.get(questionId) || false;
  }, [loadingStates]);

  const getErrorState = useCallback((questionId: string) => {
    return errorStates.get(questionId) || null;
  }, [errorStates]);

  const refreshQuestionResults = useCallback(async (questionId: string, forceRefresh = false) => {
    // Allow refresh for all questions if forceRefresh is true, otherwise only for expanded questions
    if (!forceRefresh && !expandedQuestions.has(questionId)) return;

    try {
      setLoadingStates(prev => new Map(prev).set(questionId, true));
      setErrorStates(prev => new Map(prev).set(questionId, null));
      
      const data = await apiService.getQuestionResults(presentationId, questionId);
      setResultsCache(prev => new Map(prev).set(questionId, data));
      setLastUpdated(new Date());
      
      console.log(`📊 Question results updated for ${questionId}:`, {
        totalResponses: data.totalResponses,
        uniqueSessions: data.uniqueSessions,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Failed to refresh results for question ${questionId}:`, err);
      setErrorStates(prev => new Map(prev).set(questionId, 'Failed to load results'));
    } finally {
      setLoadingStates(prev => new Map(prev).set(questionId, false));
    }
  }, [presentationId, expandedQuestions]);

  // Keep ref updated with latest refreshQuestionResults function
  const refreshQuestionResultsRef = useRef(refreshQuestionResults);
  refreshQuestionResultsRef.current = refreshQuestionResults;

  // Function to refresh all question results (for total count calculation)
  const refreshAllQuestionResults = useCallback(async () => {
    const promises = questionIds.map(questionId => 
      refreshQuestionResults(questionId, true) // Force refresh for all questions
    );
    await Promise.all(promises);
  }, [questionIds, refreshQuestionResults]);

  // Load results for expanded questions
  useEffect(() => {
    if (expandedQuestions.size === 0) return;

    // Load results for all expanded questions
    expandedQuestions.forEach(questionId => {
      refreshQuestionResults(questionId);
    });
  }, [expandedQuestions, refreshQuestionResults]);

  // Shared polling interval - only when SignalR is disconnected
  useEffect(() => {
    if (expandedQuestions.size === 0 || !enablePolling || isConnected) {
      // Don't poll if SignalR is connected or no questions expanded
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Only poll as backup when SignalR is disconnected
    console.log(`🔄 Starting shared backup polling for ${expandedQuestions.size} questions (SignalR disconnected)`);
    pollingIntervalRef.current = setInterval(() => {
      // Get current expanded questions at the time of polling
      const currentExpandedQuestions = expandedQuestions;
      currentExpandedQuestions.forEach(questionId => {
        refreshQuestionResultsRef.current(questionId);
      });
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [expandedQuestions.size, enablePolling, isConnected, pollingInterval]); // Removed refreshQuestionResults dependency

  // Set up real-time SignalR updates
  useEffect(() => {
    if (expandedQuestions.size === 0 || !enableRealTime || !isConnected) return;

    const handleResponseReceived = (data: any) => {
      console.log(`🔄 Real-time update received for question ${data.questionId}`);
      
      // Debounce rapid updates - only fetch if we haven't fetched recently
      const now = new Date();
      const timeSinceLastUpdate = lastUpdated ? now.getTime() - lastUpdated.getTime() : Infinity;
      
      // If it's been more than 1 second since last update, fetch new data
      if (timeSinceLastUpdate > 1000) {
        // Always refresh the specific question that received the response
        refreshQuestionResults(data.questionId, true);
        
        // Also refresh all other questions to keep total counts accurate
        // This ensures the Total Response count in Live Session Management stays updated
        refreshAllQuestionResults();
      }
    };

    const handleNLPAnalysisCompleted = (data: any) => {
      // Only update if this analysis is for an expanded question
      if (expandedQuestions.has(data.questionId)) {
        console.log(`🧠 NLP Analysis completed for question ${data.questionId}, refreshing results`);
        // Immediately fetch new data when NLP analysis completes
        refreshQuestionResults(data.questionId);
      }
    };

    onResponseReceived(handleResponseReceived);
    onNLPAnalysisCompleted(handleNLPAnalysisCompleted);
  }, [expandedQuestions, enableRealTime, isConnected, onResponseReceived, onNLPAnalysisCompleted, refreshQuestionResults, lastUpdated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    expandedQuestions,
    toggleQuestion,
    getQuestionResults,
    getLoadingState,
    getErrorState,
    refreshQuestionResults,
    refreshAllQuestionResults,
    lastUpdated,
    isExpanded: (questionId: string) => expandedQuestions.has(questionId)
  };
};
