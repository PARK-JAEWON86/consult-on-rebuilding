import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// Standard API response format as per project rules
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor to handle standard API response format and show toasts
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (!response.data.success && response.data.error) {
          throw new Error(response.data.error.message || 'API Error');
        }
        return response;
      },
      (error) => {
        // Handle network errors and other axios errors with Toast messages
        let message = 'API Error';
        
        if (error.response?.status === 401) {
          message = '로그인이 필요합니다.';
          // Redirect to login page on 401 errors
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        } else if (error.response?.status === 403) {
          message = '접근 권한이 없습니다.';
        } else if (error.response?.status === 409) {
          message = '이미 처리된 요청입니다.';
        } else if (error.response?.status >= 500) {
          message = '일시적인 오류가 발생했습니다.';
        } else if (error.response?.data?.error) {
          message = error.response.data.error.message || 'API Error';
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          message = '네트워크 연결을 확인해주세요.';
          // 네트워크 에러는 Toast로 표시하지 않음 (너무 자주 발생할 수 있음)
          console.warn('Network error:', error.message);
          return Promise.reject(error);
        }

        // Show toast notification if available
        if (typeof window !== 'undefined') {
          // Dispatch a custom event that can be caught by the Toast provider
          const toastEvent = new CustomEvent('api-error', {
            detail: { message, status: error.response?.status }
          });
          window.dispatchEvent(toastEvent);
        }

        const customError = new Error(message);
        (customError as any).status = error.response?.status;
        throw customError;
      }
    );
  }

  async get<T = any>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(endpoint, {
      params: options?.params,
    });
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(endpoint, data);
    return response.data;
  }
}

export const api = new APIClient(API_BASE_URL);