import type { SuccessResponse, ErrorResponse } from '../types/error';
import { ApiError } from '../types/error';
import type { Presentation, CreatePresentationRequest, UpdatePresentationRequest } from '../types/presentation';
import type { Label, CreateLabelRequest, UpdateLabelRequest, LabelWithPresentations } from '../types/label';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest, ReorderQuestionsRequest } from '../types/question';
import { config } from '../config/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  id: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Fix: Properly merge headers to preserve Content-Type when Authorization is added
    const mergedHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      console.log('🌐 Making request to:', url);
      console.log('📤 Request options:', { ...options, headers: mergedHeaders });
      
      const response = await fetch(url, { 
        ...options, 
        headers: mergedHeaders 
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        console.log('❌ Error response:', errorData);
        const apiError = new ApiError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData.errorCode,
          errorData.userMessage
        );
        throw apiError;
      }

      const responseText = await response.text();
      console.log('📥 Response body:', responseText);
      
      if (!responseText) {
        console.log('⚠️ Empty response body');
        return [] as T;
      }

      const data: SuccessResponse<T> = JSON.parse(responseText);
      console.log('✅ Parsed response data:', data);
      return data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors or JSON parsing errors
      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        undefined,
        'Unable to connect to the server. Please check your internet connection.'
      );
      throw apiError;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Presentation methods
  async getPresentations(): Promise<Presentation[]> {
    return this.makeRequest<Presentation[]>('/api/presentations', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getPresentation(id: string): Promise<Presentation> {
    return this.makeRequest<Presentation>(`/api/presentations/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async createPresentation(data: CreatePresentationRequest): Promise<Presentation> {
    return this.makeRequest<Presentation>('/api/presentations', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updatePresentation(id: string, data: UpdatePresentationRequest): Promise<Presentation> {
    return this.makeRequest<Presentation>(`/api/presentations/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deletePresentation(id: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/api/presentations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Label methods
  async getLabels(): Promise<Label[]> {
    return this.makeRequest<Label[]>('/api/labels', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getActiveLabels(): Promise<Label[]> {
    return this.makeRequest<Label[]>('/api/labels', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getAllLabels(): Promise<Label[]> {
    return this.makeRequest<Label[]>('/api/labels/all', {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getLabel(id: string): Promise<Label> {
    return this.makeRequest<Label>(`/api/labels/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getLabelWithPresentations(id: string): Promise<LabelWithPresentations> {
    return this.makeRequest<LabelWithPresentations>(`/api/labels/${id}/presentations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async createLabel(data: CreateLabelRequest): Promise<Label> {
    return this.makeRequest<Label>('/api/labels', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateLabel(id: string, data: UpdateLabelRequest): Promise<Label> {
    return this.makeRequest<Label>(`/api/labels/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteLabel(id: string): Promise<void> {
    return this.makeRequest<void>(`/api/labels/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async assignLabelToPresentation(labelId: string, presentationId: string): Promise<void> {
    return this.makeRequest<void>(`/api/labels/${labelId}/assign/${presentationId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async removeLabelFromPresentation(presentationId: string): Promise<void> {
    return this.makeRequest<void>(`/api/labels/presentations/${presentationId}/label`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async reactivateLabel(labelId: string): Promise<void> {
    return this.makeRequest<void>(`/api/labels/${labelId}/reactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  // Question methods
  async getQuestions(presentationId: string): Promise<Question[]> {
    return this.makeRequest<Question[]>(`/api/presentations/${presentationId}/questions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getQuestion(presentationId: string, questionId: string): Promise<Question> {
    return this.makeRequest<Question>(`/api/presentations/${presentationId}/questions/${questionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async createQuestion(presentationId: string, data: CreateQuestionRequest): Promise<Question> {
    return this.makeRequest<Question>(`/api/presentations/${presentationId}/questions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(presentationId: string, questionId: string, data: UpdateQuestionRequest): Promise<Question> {
    return this.makeRequest<Question>(`/api/presentations/${presentationId}/questions/${questionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(presentationId: string, questionId: string): Promise<void> {
    return this.makeRequest<void>(`/api/presentations/${presentationId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  async reorderQuestions(presentationId: string, data: ReorderQuestionsRequest): Promise<void> {
    return this.makeRequest<void>(`/api/presentations/${presentationId}/questions/reorder`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async toggleQuestionActive(presentationId: string, questionId: string, isActive: boolean): Promise<void> {
    return this.makeRequest<void>(`/api/presentations/${presentationId}/questions/${questionId}/toggle`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });
  }

  // Audience API methods (no authentication required)
  async getAudiencePresentation(id: string): Promise<any> {
    return this.makeRequest<any>(`/api/audience/presentation/${id}`, {
      method: 'GET',
    });
  }

  async getAudienceQuestion(id: string): Promise<any> {
    return this.makeRequest<any>(`/api/audience/question/${id}`, {
      method: 'GET',
    });
  }

  async submitAudienceResponse(questionId: string, sessionId: string, value: string): Promise<any> {
    return this.makeRequest<any>(`/api/audience/question/${questionId}/response`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, value }),
    });
  }

  async getQuestionStats(questionId: string): Promise<any> {
    return this.makeRequest<any>(`/api/audience/question/${questionId}/stats`, {
      method: 'GET',
    });
  }

  async getResponseStatus(questionId: string, sessionId: string): Promise<any> {
    return this.makeRequest<any>(`/api/audience/question/${questionId}/response-status/${sessionId}`, {
      method: 'GET',
    });
  }

  // Live presentation API methods (authentication required)
  async startLiveSession(presentationId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async stopLiveSession(presentationId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/stop`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async activateQuestion(presentationId: string, questionId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/question/${questionId}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async deactivateQuestion(presentationId: string, questionId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/question/${questionId}/deactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
  }

  async getQuestionResults(presentationId: string, questionId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/question/${questionId}/results`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getLiveSessionStatus(presentationId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }

  async getAudienceCount(presentationId: string): Promise<any> {
    return this.makeRequest<any>(`/api/presentations/${presentationId}/live/audience-count`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
  }


  // Helper method to get auth headers for authenticated requests
  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'No token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const apiService = new ApiService();
export default apiService; 