import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useSignalR } from './useSignalR';

interface QuestionResults {
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
  textAnalysis?: {
    totalResponses: number;
    averageLength: number;
    commonWords: Record<string, number>;
    sentimentDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
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
 * Custom hook for managing question results data with both real-time and polling strategies
 * 
 * Strategy:
 * 1. Real-time updates via SignalR when new responses are received
 * 2. Periodic polling as backup and for initial load
 * 3. Manual refresh capability
 * 4. Optimized to only fetch when accordion is expanded
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
  const isInitialLoadRef = useRef(true);

  // Get SignalR connection for real-time updates
  const { isConnected, onResponseReceived } = useSignalR({ autoConnect: false });

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
        totalResponses: data.totalResponses,
        uniqueSessions: data.uniqueSessions,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to fetch question results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [presentationId, questionId, isExpanded]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    await fetchResults();
  }, [fetchResults]);

  // Initial load for all questions when expanded
  useEffect(() => {
    if (!isExpanded) return;

    // Initial load for all questions (live or not)
    if (isInitialLoadRef.current) {
      fetchResults();
      isInitialLoadRef.current = false;
    }
  }, [isExpanded, fetchResults]);

  // Set up polling interval only for live questions
  useEffect(() => {
    if (!isExpanded || !enablePolling) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Set up continuous polling only for live questions
    pollingIntervalRef.current = setInterval(() => {
      fetchResults();
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isExpanded, enablePolling, pollingInterval, fetchResults]);

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

    onResponseReceived(handleResponseReceived);

    // Cleanup is handled by the useSignalR hook
  }, [isExpanded, enableRealTime, isConnected, questionId, onResponseReceived, fetchResults, lastUpdated]);

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
 * Hook for managing multiple question results efficiently
 * Useful for the main presentation manager
 */
export const useMultipleQuestionResults = (
  presentationId: string,
  _questionIds: string[],
  _options?: {
    pollingInterval?: number;
    enableRealTime?: boolean;
    enablePolling?: boolean;
  }
) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [resultsCache, setResultsCache] = useState<Map<string, QuestionResults>>(new Map());

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

  const refreshQuestionResults = useCallback(async (questionId: string) => {
    try {
      const data = await apiService.getQuestionResults(presentationId, questionId);
      setResultsCache(prev => new Map(prev).set(questionId, data));
      return data;
    } catch (err) {
      console.error(`Failed to refresh results for question ${questionId}:`, err);
      throw err;
    }
  }, [presentationId]);

  return {
    expandedQuestions,
    toggleQuestion,
    getQuestionResults,
    refreshQuestionResults,
    isExpanded: (questionId: string) => expandedQuestions.has(questionId)
  };
};
