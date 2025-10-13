import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { usePresentations } from '../contexts/PresentationContext';
import type { Presentation, CreatePresentationRequest, UpdatePresentationRequest } from '../types/presentation';

// Hook for presentation CRUD operations
export const usePresentationOperations = () => {
  const { 
    updatePresentation: updatePresentationState, 
    addPresentation, 
    removePresentation,
    setError 
  } = usePresentations();
  
  const [loading, setLoading] = useState(false);

  // Create presentation
  const createPresentation = useCallback(async (data: CreatePresentationRequest): Promise<Presentation> => {
    try {
      setLoading(true);
      const newPresentation = await apiService.createPresentation(data);
      addPresentation(newPresentation);
      return newPresentation;
    } catch (error) {
      console.error('Failed to create presentation:', error);
      setError('Failed to create presentation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addPresentation, setError]);

  // Update presentation with optimistic updates
  const updatePresentation = useCallback(async (
    id: string, 
    data: UpdatePresentationRequest
  ): Promise<Presentation> => {
    try {
      setLoading(true);
      
      // Optimistic update
      updatePresentationState(id, data);
      
      // API call
      const updatedPresentation = await apiService.updatePresentation(id, data);
      
      // Update with actual response
      updatePresentationState(id, updatedPresentation);
      
      return updatedPresentation;
    } catch (error) {
      console.error('Failed to update presentation:', error);
      setError('Failed to update presentation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePresentationState, setError]);

  // Delete presentation
  const deletePresentation = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await apiService.deletePresentation(id);
      removePresentation(id);
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      setError('Failed to delete presentation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [removePresentation, setError]);

  return {
    createPresentation,
    updatePresentation,
    deletePresentation,
    loading,
  };
};

// Hook for live session operations
export const useLiveSessionOperations = () => {
  const { updatePresentation: updatePresentationState, setError } = usePresentations();
  const [loading, setLoading] = useState(false);

  // Start live session with optimistic update
  const startLiveSession = useCallback(async (presentationId: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Optimistic update
      updatePresentationState(presentationId, { 
        isLive: true, 
        liveStartedAt: new Date().toISOString() 
      });
      
      // API call
      await apiService.startLiveSession(presentationId);
      
      console.log('✅ Live session started successfully');
    } catch (error) {
      console.error('Failed to start live session:', error);
      // Rollback optimistic update
      updatePresentationState(presentationId, { isLive: false, liveStartedAt: undefined });
      setError('Failed to start live session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePresentationState, setError]);

  // Stop live session with optimistic update
  const stopLiveSession = useCallback(async (presentationId: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Optimistic update
      updatePresentationState(presentationId, { 
        isLive: false, 
        liveEndedAt: new Date().toISOString() 
      });
      
      // API call
      await apiService.stopLiveSession(presentationId);
      
      console.log('✅ Live session stopped successfully');
    } catch (error) {
      console.error('Failed to stop live session:', error);
      // Rollback optimistic update
      updatePresentationState(presentationId, { isLive: true, liveEndedAt: undefined });
      setError('Failed to stop live session');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePresentationState, setError]);

  // Activate question
  const activateQuestion = useCallback(async (presentationId: string, questionId: string): Promise<void> => {
    try {
      setLoading(true);
      await apiService.activateQuestion(presentationId, questionId);
      console.log('✅ Question activated successfully');
    } catch (error) {
      console.error('Failed to activate question:', error);
      setError('Failed to activate question');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setError]);

  return {
    startLiveSession,
    stopLiveSession,
    activateQuestion,
    loading,
  };
};

// Hook for fetching individual presentation with caching
export const usePresentation = () => {
  const { selectedPresentation, selectPresentation, presentations } = usePresentations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresentation = useCallback(async (presentationId: string): Promise<Presentation> => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to find in cached presentations
      const found = presentations.find(p => p.id === presentationId);
      
      if (found) {
        console.log('📦 Using cached presentation data');
        return found;
      }
      
      // If not found in cache, fetch from API
      console.log('🌐 Fetching presentation from API...');
      const presentation = await apiService.getPresentation(presentationId);
      return presentation;
    } catch (error) {
      console.error('Failed to fetch presentation:', error);
      setError('Failed to load presentation');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [presentations]);

  const selectAndFetchPresentation = useCallback(async (presentationId: string) => {
    try {
      const presentation = await fetchPresentation(presentationId);
      selectPresentation(presentation);
      return presentation;
    } catch (error) {
      throw error;
    }
  }, [fetchPresentation, selectPresentation]);

  return {
    presentation: selectedPresentation,
    loading,
    error,
    fetchPresentation,
    selectAndFetchPresentation,
    selectPresentation,
  };
};
