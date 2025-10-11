import * as signalR from '@microsoft/signalr';
import type { 
  SignalRConfig, 
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
  ConnectionState,
  SignalRMethods,
  SignalREvents
} from '../types/signalr';
import { config } from '../config/environment';

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private config: SignalRConfig;
  private eventHandlers: Map<string, SignalREventHandler[]> = new Map();
  private connectionStatus: ConnectionStatus = {
    state: ConnectionState.Disconnected,
    reconnectAttempts: 0
  };
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];

  constructor(signalRConfig?: Partial<SignalRConfig>) {
    this.config = {
      baseUrl: signalRConfig?.baseUrl || config.apiBaseUrl,
      hubPath: signalRConfig?.hubPath || '/hubs/poll',
      accessToken: signalRConfig?.accessToken,
      reconnectInterval: signalRConfig?.reconnectInterval || 5000,
      maxReconnectAttempts: signalRConfig?.maxReconnectAttempts || 5
    };
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('🔗 SignalR already connected');
      return;
    }

    try {
      this.updateConnectionStatus(ConnectionState.Connecting);
      
      const connectionUrl = `${this.config.baseUrl}${this.config.hubPath}`;
      console.log('🔗 Connecting to SignalR hub:', connectionUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(connectionUrl, {
          accessTokenFactory: () => {
            // Get token from localStorage or use provided token
            const token = this.config.accessToken || localStorage.getItem('token');
            return token || '';
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.config.maxReconnectAttempts!) {
              return this.config.reconnectInterval!;
            }
            return null; // Stop reconnecting
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      
      this.updateConnectionStatus(ConnectionState.Connected, this.connection.connectionId || undefined);
      console.log('✅ SignalR connected successfully');
      
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      this.updateConnectionStatus(ConnectionState.Disconnected, undefined, error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }

  // Connect without authentication (for audience members)
  async connectWithoutAuth(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('🔗 SignalR already connected');
      return;
    }

    try {
      this.updateConnectionStatus(ConnectionState.Connecting);
      
      const connectionUrl = `${this.config.baseUrl}${this.config.hubPath}`;
      console.log('🔗 Connecting to SignalR hub (unauthenticated):', connectionUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(connectionUrl) // No accessTokenFactory for unauthenticated connections
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.config.maxReconnectAttempts!) {
              return this.config.reconnectInterval!;
            }
            return null; // Stop reconnecting
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      
      this.updateConnectionStatus(ConnectionState.Connected, this.connection.connectionId || undefined);
      console.log('✅ SignalR connected successfully (unauthenticated)');
      
    } catch (error) {
      console.error('❌ SignalR connection failed (unauthenticated):', error);
      this.updateConnectionStatus(ConnectionState.Disconnected, undefined, error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🔌 SignalR disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting SignalR:', error);
      } finally {
        this.connection = null;
        this.updateConnectionStatus(ConnectionState.Disconnected);
      }
    }
  }

  // Event subscription
  on<T = any>(eventName: string, handler: SignalREventHandler<T>): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  off(eventName: string, handler?: SignalREventHandler): void {
    if (!this.eventHandlers.has(eventName)) return;
    
    if (handler) {
      const handlers = this.eventHandlers.get(eventName)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(eventName);
    }
  }

  // Status monitoring
  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Audience methods
  async joinPresentation(presentationId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.JoinPresentation, presentationId);
  }

  async leavePresentation(presentationId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke(SignalRMethods.LeavePresentation, presentationId);
    }
  }

  async submitResponse(questionId: string, response: string, sessionId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.SubmitResponse, questionId, response, sessionId);
  }

  // Presenter methods
  async joinPresenterSession(presentationId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.JoinPresenterSession, presentationId);
  }

  async startLiveSession(presentationId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.StartLiveSession, presentationId);
  }

  async endLiveSession(presentationId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.EndLiveSession, presentationId);
  }

  async activateQuestion(questionId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.ActivateQuestion, questionId);
  }

  async deactivateQuestion(questionId: string): Promise<void> {
    await this.ensureConnected();
    await this.connection!.invoke(SignalRMethods.DeactivateQuestion, questionId);
  }

  // Private methods
  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection state events
    this.connection.onclose((error) => {
      console.log('🔌 SignalR connection closed:', error);
      this.updateConnectionStatus(ConnectionState.Disconnected, undefined, error?.message);
    });

    this.connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting:', error);
      this.updateConnectionStatus(ConnectionState.Reconnecting, undefined, error?.message);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected:', connectionId);
      this.updateConnectionStatus(ConnectionState.Connected, connectionId);
    });

    // Audience events
    this.connection.on(SignalREvents.QuestionActivated, (data: QuestionActivatedEvent) => {
      console.log('📝 Question activated:', data);
      this.emit(SignalREvents.QuestionActivated, data);
    });

    this.connection.on(SignalREvents.QuestionDeactivated, (data: QuestionDeactivatedEvent) => {
      console.log('⏹️ Question deactivated:', data);
      this.emit(SignalREvents.QuestionDeactivated, data);
    });

    this.connection.on(SignalREvents.LiveSessionStarted, (data: LiveSessionStartedEvent) => {
      console.log('🚀 Live session started:', data);
      this.emit(SignalREvents.LiveSessionStarted, data);
    });

    this.connection.on(SignalREvents.LiveSessionEnded, (data: LiveSessionEndedEvent) => {
      console.log('🏁 Live session ended:', data);
      this.emit(SignalREvents.LiveSessionEnded, data);
    });

    this.connection.on(SignalREvents.ResponseSubmitted, (data: ResponseSubmittedEvent) => {
      console.log('✅ Response submitted:', data);
      this.emit(SignalREvents.ResponseSubmitted, data);
    });

    this.connection.on(SignalREvents.JoinedPresentation, (data: JoinedPresentationEvent) => {
      console.log('👥 Joined presentation:', data);
      this.emit(SignalREvents.JoinedPresentation, data);
    });

    this.connection.on(SignalREvents.LeftPresentation, (data: LeftPresentationEvent) => {
      console.log('👋 Left presentation:', data);
      this.emit(SignalREvents.LeftPresentation, data);
    });

    // Presenter events
    this.connection.on(SignalREvents.ResponseReceived, (data: ResponseReceivedEvent) => {
      console.log('📥 Response received:', data);
      this.emit(SignalREvents.ResponseReceived, data);
    });

    this.connection.on(SignalREvents.AudienceCountUpdated, (data: AudienceCountUpdatedEvent) => {
      console.log('👥 Audience count updated:', data);
      this.emit(SignalREvents.AudienceCountUpdated, data);
    });

    this.connection.on(SignalREvents.JoinedPresenterSession, (data: JoinedPresenterSessionEvent) => {
      console.log('🎯 Joined presenter session:', data);
      this.emit(SignalREvents.JoinedPresenterSession, data);
    });

    // Error events
    this.connection.on(SignalREvents.Error, (data: ErrorEvent) => {
      console.error('❌ SignalR error:', data);
      this.emit(SignalREvents.Error, data);
    });
  }

  private emit<T>(eventName: string, data: T): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in SignalR event handler for ${eventName}:`, error);
        }
      });
    }
  }

  private updateConnectionStatus(
    state: ConnectionState, 
    connectionId?: string, 
    error?: string
  ): void {
    this.connectionStatus = {
      state,
      connectionId,
      error,
      reconnectAttempts: state === ConnectionState.Reconnecting ? 
        this.connectionStatus.reconnectAttempts + 1 : 
        this.connectionStatus.reconnectAttempts
    };

    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (error) {
        console.error('❌ Error in status callback:', error);
      }
    });
  }
}

// Create singleton instance
export const signalRService = new SignalRService();
export default signalRService;
