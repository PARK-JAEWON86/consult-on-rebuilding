import { api } from './api';

// ==========================================
// 타입 정의
// ==========================================

export interface CreateInquiryRequest {
  expertId: number;
  subject: string;
  content: string;
  category: 'schedule' | 'time' | 'price' | 'method' | 'other';
}

export interface QueryInquiryParams {
  status?: 'all' | 'unread' | 'replied';
  search?: string;
  page?: number;
  limit?: number;
}

export interface Inquiry {
  id: string;
  subject: string;
  content: string;
  category: string;
  isRead: boolean;
  hasReply: boolean;
  reply?: {
    content: string;
    repliedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  expertName?: string;
  expertProfileImage?: string;
  clientName?: string;
  clientEmail?: string;
}

export interface InquiryListResponse {
  inquiries: Inquiry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    total: number;
    unread: number;
    replied: number;
  };
}

// ==========================================
// 클라이언트용 API
// ==========================================

/**
 * 문의 생성
 */
export async function createInquiry(data: CreateInquiryRequest) {
  const response = await api.post('/inquiries/client', data);
  return response.data;
}

/**
 * 내가 보낸 문의 목록 조회
 */
export async function getClientInquiries(params?: QueryInquiryParams) {
  const response = await api.get<InquiryListResponse>('/inquiries/client', { params });
  return response.data;
}

/**
 * 문의 상세 조회
 */
export async function getClientInquiry(id: string) {
  const response = await api.get(`/inquiries/client/${id}`);
  return response.data;
}

/**
 * 문의 삭제
 */
export async function deleteClientInquiry(id: string) {
  const response = await api.delete(`/inquiries/client/${id}`);
  return response.data;
}

// ==========================================
// 전문가용 API
// ==========================================

/**
 * 받은 문의 목록 조회
 */
export async function getExpertInquiries(params?: QueryInquiryParams) {
  const response = await api.get<InquiryListResponse>('/inquiries/expert', { params });
  return response.data;
}

/**
 * 받은 문의 상세 조회
 */
export async function getExpertInquiry(id: string) {
  const response = await api.get(`/inquiries/expert/${id}`);
  return response.data;
}

/**
 * 문의를 읽음으로 표시
 */
export async function markInquiryAsRead(id: string) {
  const response = await api.patch(`/inquiries/expert/${id}/read`);
  return response.data;
}

/**
 * 문의에 답변 작성
 */
export async function replyToInquiry(id: string, content: string) {
  const response = await api.post(`/inquiries/expert/${id}/reply`, { content });
  return response.data;
}

/**
 * 문의 삭제 (전문가)
 */
export async function deleteExpertInquiry(id: string) {
  const response = await api.delete(`/inquiries/expert/${id}`);
  return response.data;
}

/**
 * 통계 조회
 */
export async function getExpertInquiryStats() {
  const response = await api.get('/inquiries/expert/stats');
  return response.data;
}
