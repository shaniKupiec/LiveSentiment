// SignalR connection states
export const ConnectionState = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Reconnecting: 'Reconnecting'
} as const;

export type ConnectionState = typeof ConnectionState[keyof typeof ConnectionState];

// Event handler type
export type SignalREventHandler<T = any> = (data: T) => void;

// SignalR event types for audience
export interface QuestionActivatedEvent {
  questionId: string;
  text: string;
  type: number;
  configuration?: any;
  startedAt: string;
}

export interface QuestionDeactivatedEvent {
  questionId: string;
  endedAt: string;
}

export interface LiveSessionStartedEvent {
  presentationId: string;
  startedAt: string;
}

export interface LiveSessionEndedEvent {
  presentationId: string;
  endedAt: string;
}

export interface ResponseSubmittedEvent {
  questionId: string;
}

export interface JoinedPresentationEvent {
  presentationId: string;
}

export interface LeftPresentationEvent {
  presentationId: string;
}

export interface ErrorEvent {
  message: string;
}

// SignalR event types for presenter
export interface ResponseReceivedEvent {
  questionId: string;
  response: string;
  sessionId: string;
  timestamp: string;
}

export interface AudienceCountUpdatedEvent {
  count: number;
}

export interface JoinedPresenterSessionEvent {
  presentationId: string;
}

// SignalR method names
export const SignalRMethods = {
  // Audience methods
  JoinPresentation: 'JoinPresentation',
  LeavePresentation: 'LeavePresentation',
  SubmitResponse: 'SubmitResponse',
  
  // Presenter methods
  JoinPresenterSession: 'JoinPresenterSession',
  StartLiveSession: 'StartLiveSession',
  EndLiveSession: 'EndLiveSession',
  ActivateQuestion: 'ActivateQuestion',
  DeactivateQuestion: 'DeactivateQuestion'
} as const;

// SignalR event names
export const SignalREvents = {
  // Audience events
  QuestionActivated: 'QuestionActivated',
  QuestionDeactivated: 'QuestionDeactivated',
  LiveSessionStarted: 'LiveSessionStarted',
  LiveSessionEnded: 'LiveSessionEnded',
  ResponseSubmitted: 'ResponseSubmitted',
  JoinedPresentation: 'JoinedPresentation',
  LeftPresentation: 'LeftPresentation',
  Error: 'Error',
  
  // Presenter events
  ResponseReceived: 'ResponseReceived',
  AudienceCountUpdated: 'AudienceCountUpdated',
  JoinedPresenterSession: 'JoinedPresenterSession'
} as const;

// Connection configuration
export interface SignalRConfig {
  baseUrl: string;
  hubPath: string;
  accessToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Connection status
export interface ConnectionStatus {
  state: ConnectionState;
  connectionId?: string;
  error?: string;
  reconnectAttempts: number;
}
