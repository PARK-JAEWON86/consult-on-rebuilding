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
        // 디버깅: 응답 구조 로깅
        console.log('[API Interceptor] Response received:', {
          url: response.config.url,
          status: response.status,
          dataStructure: {
            hasSuccess: 'success' in response.data,
            successValue: response.data.success,
            hasData: 'data' in response.data,
            hasError: 'error' in response.data,
          },
          fullData: response.data
        });

        if (!response.data.success && response.data.error) {
          throw new Error(response.data.error.message || 'API Error');
        }
        return response;
      },
      (error) => {
        // Handle network errors and other axios errors with Toast messages
        let message = 'API Error';
        let shouldShowToast = true;

        // 에러 로깅 개선
        const errorContext = {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          code: error.code,
          timestamp: new Date().toISOString(),
        };

        if (error.response?.status === 401) {
          // /auth/me 엔드포인트의 401은 정상적인 미인증 상태
          const isAuthCheck = error.config?.url?.includes('/auth/me');

          if (isAuthCheck) {
            // 조용히 에러 전달 (Toast 없음, 리다이렉트 없음)
            const customError = new Error('Unauthorized');
            (customError as any).status = 401;
            throw customError;
          }

          // 다른 엔드포인트의 401은 기존대로 처리
          message = '로그인이 필요합니다.';
          console.warn('인증 오류:', errorContext);

          // Redirect to login page on 401 errors
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        } else if (error.response?.status === 403) {
          message = '접근 권한이 없습니다.';
          console.warn('권한 오류:', errorContext);
        } else if (error.response?.status === 404) {
          message = '요청한 리소스를 찾을 수 없습니다.';
          console.warn('404 오류:', errorContext);
        } else if (error.response?.status === 409) {
          message = '이미 처리된 요청입니다.';
          console.warn('충돌 오류:', errorContext);
        } else if (error.response?.status === 422) {
          message = '입력 데이터가 올바르지 않습니다.';
          console.warn('유효성 검증 오류:', errorContext, error.response?.data);
        } else if (error.response?.status >= 500) {
          message = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          console.error('서버 오류:', errorContext, error.response?.data);
        } else if (error.response?.data?.error) {
          message = error.response.data.error.message || 'API Error';
          console.warn('API 오류:', errorContext, error.response.data.error);
        } else if (error.code === 'ECONNABORTED') {
          message = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
          console.warn('타임아웃 오류:', errorContext);
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          message = '네트워크 연결을 확인해주세요.';
          // 네트워크 에러는 Toast로 표시하지 않음 (너무 자주 발생할 수 있음)
          console.warn('네트워크 오류:', errorContext);
          shouldShowToast = false;
        } else {
          // 예상치 못한 오류
          console.error('예상치 못한 API 오류:', errorContext, error);
        }

        // Show toast notification if available
        if (shouldShowToast && typeof window !== 'undefined') {
          // Dispatch a custom event that can be caught by the Toast provider
          const toastEvent = new CustomEvent('api-error', {
            detail: {
              message,
              status: error.response?.status,
              url: error.config?.url
            }
          });
          window.dispatchEvent(toastEvent);
        }

        const customError = new Error(message);
        (customError as any).status = error.response?.status;
        (customError as any).context = errorContext;
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

  async post<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data, {
      headers: options?.headers,
    });
    return response.data;
  }

  async delete<T = any>(endpoint: string, options?: { data?: any }): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint, {
      data: options?.data,
    });
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