import { useEffect, useRef, useState, useCallback } from 'react';
import { signalRService } from '../services/signalrService';
import type { 
  ConnectionStatus,
  SignalREventHandler,
  QuestionActivatedEvent,
  QuestionDeactivatedEvent,
  LiveSessionStartedEvent,
  LiveSessionEndedEvent,
  ResponseSubmittedEvent,
  JoinedPresentationEvent,
  LeftPresentationEvent,
  ErrorEvent,
  ResponseReceivedEvent,
  AudienceCountUpdatedEvent,
  JoinedPresenterSessionEvent
} from '../types/signalr';
import { 
  ConnectionState
} from '../types/signalr';

export interface UseSignalROptions {
  autoConnect?: boolean;
  requireAuth?: boolean;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseSignalRReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Audience methods
  joinPresentation: (presentationId: string) => Promise<void>;
  leavePresentation: (presentationId: string) => Promise<void>;
  submitResponse: (questionId: string, response: string, sessionId: string) => Promise<void>;
  
  // Presenter methods
  joinPresenterSession: (presentationId: string) => Promise<void>;
  startLiveSession: (presentationId: string) => Promise<void>;
  endLiveSession: (presentationId: string) => Promise<void>;
  activateQuestion: (questionId: string) => Promise<void>;
  deactivateQuestion: (questionId: string) => Promise<void>;
  
  // Event handlers
  onQuestionActivated: (handler: SignalREventHandler<QuestionActivatedEvent>) => void;
  onQuestionDeactivated: (handler: SignalREventHandler<QuestionDeactivatedEvent>) => void;
  onLiveSessionStarted: (handler: SignalREventHandler<LiveSessionStartedEvent>) => void;
  onLiveSessionEnded: (handler: SignalREventHandler<LiveSessionEndedEvent>) => void;
  onResponseSubmitted: (handler: SignalREventHandler<ResponseSubmittedEvent>) => void;
  onJoinedPresentation: (handler: SignalREventHandler<JoinedPresentationEvent>) => void;
  onLeftPresentation: (handler: SignalREventHandler<LeftPresentationEvent>) => void;
  onResponseReceived: (handler: SignalREventHandler<ResponseReceivedEvent>) => void;
  onAudienceCountUpdated: (handler: SignalREventHandler<AudienceCountUpdatedEvent>) => void;
  onJoinedPresenterSession: (handler: SignalREventHandler<JoinedPresenterSessionEvent>) => void;
  onError: (handler: SignalREventHandler<ErrorEvent>) => void;
  
  // Cleanup
  cleanup: () => void;
}

export const useSignalR = (options: UseSignalROptions = {}): UseSignalRReturn => {
  const { autoConnect = false, requireAuth = true, onConnectionStatusChange } = options;
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    signalRService.getConnectionStatus()
  );
  
  const handlersRef = useRef<Map<string, SignalREventHandler>>(new Map());
  const isInitializedRef = useRef(false);

  // Connection status
  const isConnected = connectionStatus.state === ConnectionState.Connected;
  const isConnecting = connectionStatus.state === ConnectionState.Connecting;
  const isReconnecting = connectionStatus.state === ConnectionState.Reconnecting;

  // Initialize SignalR service
  useEffect(() => {
    if (!isInitializedRef.current) {
      // Set up connection status monitoring
      signalRService.onStatusChange((status) => {
        setConnectionStatus(status);
        onConnectionStatusChange?.(status);
      });

      // Auto-connect if requested
      if (autoConnect) {
        signalRService.connect().catch(console.error);
      }

      isInitializedRef.current = true;
    }

    return () => {
      // Cleanup will be handled by the cleanup function
    };
  }, [autoConnect, onConnectionStatusChange]);

  // Connection methods
  const connect = useCallback(async () => {
    try {
      if (requireAuth) {
        await signalRService.connect();
      } else {
        await signalRService.connectWithoutAuth();
      }
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      throw error;
    }
  }, [requireAuth]);

  const disconnect = useCallback(async () => {
    try {
      await signalRService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from SignalR:', error);
      throw error;
    }
  }, []);

  // Audience methods
  const joinPresentation = useCallback(async (presentationId: string) => {
    await signalRService.joinPresentation(presentationId);
  }, []);

  const leavePresentation = useCallback(async (presentationId: string) => {
    await signalRService.leavePresentation(presentationId);
  }, []);

  const submitResponse = useCallback(async (questionId: string, response: string, sessionId: string) => {
    await signalRService.submitResponse(questionId, response, sessionId);
  }, []);

  // Presenter methods
  const joinPresenterSession = useCallback(async (presentationId: string) => {
    await signalRService.joinPresenterSession(presentationId);
  }, []);

  const startLiveSession = useCallback(async (presentationId: string) => {
    await signalRService.startLiveSession(presentationId);
  }, []);

  const endLiveSession = useCallback(async (presentationId: string) => {
    await signalRService.endLiveSession(presentationId);
  }, []);

  const activateQuestion = useCallback(async (questionId: string) => {
    await signalRService.activateQuestion(questionId);
  }, []);

  const deactivateQuestion = useCallback(async (questionId: string) => {
    await signalRService.deactivateQuestion(questionId);
  }, []);

  // Event handler methods
  const onQuestionActivated = useCallback((handler: SignalREventHandler<QuestionActivatedEvent>) => {
    const key = 'QuestionActivated';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onQuestionDeactivated = useCallback((handler: SignalREventHandler<QuestionDeactivatedEvent>) => {
    const key = 'QuestionDeactivated';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onLiveSessionStarted = useCallback((handler: SignalREventHandler<LiveSessionStartedEvent>) => {
    const key = 'LiveSessionStarted';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onLiveSessionEnded = useCallback((handler: SignalREventHandler<LiveSessionEndedEvent>) => {
    const key = 'LiveSessionEnded';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onResponseSubmitted = useCallback((handler: SignalREventHandler<ResponseSubmittedEvent>) => {
    const key = 'ResponseSubmitted';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onJoinedPresentation = useCallback((handler: SignalREventHandler<JoinedPresentationEvent>) => {
    const key = 'JoinedPresentation';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onLeftPresentation = useCallback((handler: SignalREventHandler<LeftPresentationEvent>) => {
    const key = 'LeftPresentation';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onResponseReceived = useCallback((handler: SignalREventHandler<ResponseReceivedEvent>) => {
    const key = 'ResponseReceived';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onAudienceCountUpdated = useCallback((handler: SignalREventHandler<AudienceCountUpdatedEvent>) => {
    const key = 'AudienceCountUpdated';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onJoinedPresenterSession = useCallback((handler: SignalREventHandler<JoinedPresenterSessionEvent>) => {
    const key = 'JoinedPresenterSession';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  const onError = useCallback((handler: SignalREventHandler<ErrorEvent>) => {
    const key = 'Error';
    handlersRef.current.set(key, handler);
    signalRService.on(key, handler);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    handlersRef.current.forEach((handler, key) => {
      signalRService.off(key, handler);
    });
    handlersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    connectionStatus,
    isConnected,
    isConnecting,
    isReconnecting,
    connect,
    disconnect,
    joinPresentation,
    leavePresentation,
    submitResponse,
    joinPresenterSession,
    startLiveSession,
    endLiveSession,
    activateQuestion,
    deactivateQuestion,
    onQuestionActivated,
    onQuestionDeactivated,
    onLiveSessionStarted,
    onLiveSessionEnded,
    onResponseSubmitted,
    onJoinedPresentation,
    onLeftPresentation,
    onResponseReceived,
    onAudienceCountUpdated,
    onJoinedPresenterSession,
    onError,
    cleanup
  };
};
