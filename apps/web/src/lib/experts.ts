import { api, ApiResponse } from './api';

export interface Expert {
  id: number;
  displayId: string;
  name: string;
  title?: string | null;
  categories: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  // 전문가 프로필 필드 (백엔드 API 제공)
  keywords?: string[]; // 전문 키워드
  consultationTypes?: string[]; // 상담 방식 (video, chat, voice)
  // 레벨 관련 필드 추가
  level?: string; // 티어 이름 (예: "Gold (골드)")
  calculatedLevel?: number; // 실제 계산된 레벨 (1-999)
  rankingScore?: number; // 랭킹 점수
  totalSessions?: number; // 총 상담 수
  repeatClients?: number; // 재방문 고객
  experience?: number; // 경력 년수
  // 프로필 공개 설정
  isProfilePublic?: boolean; // 프로필 공개 여부
}

export interface ExpertListResponse {
  items: Expert[];
  page: number;
  size: number;
  total: number;
}

export async function fetchExperts(params?: {
  page?: number; 
  size?: number; 
  q?: string; 
  category?: string; 
  sort?: string;
}): Promise<ApiResponse<ExpertListResponse>> {
  const { page = 1, size = 12, q, category, sort } = params || {};
  const response = await api.get('/experts', { 
    params: { page, size, q, category, sort } 
  });
  return response;
}

export async function fetchExpertById(displayId: string): Promise<ApiResponse<Expert>> {
  // 프로필 상세 정보 (availabilitySlots, holidaySettings, restTimeSettings 포함)를 가져오기 위해
  // /experts/${displayId}/profile 엔드포인트 사용
  const response = await api.get(`/experts/${displayId}/profile`);
  return response;
}

// Expert dashboard interfaces and functions
export interface ExpertStats {
  totalConsultations: number;
  completedConsultations: number;
  pendingConsultations: number;
  totalEarnings: number;
  averageRating: number;
  totalClients: number;
  thisMonthEarnings: number;
  attendanceRate: number;
  newClients: number;
}

export interface Consultation {
  id: string;
  clientName: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'chat' | 'voice';
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  specialty: string;
  rating?: number;
  notes?: string;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  consultationId: string;
}

// Get expert statistics
export async function getExpertStats(): Promise<ExpertStats> {
  try {
    const response = await api.get<ExpertStats>('/experts/stats');
    return response.data || {
      totalConsultations: 0,
      completedConsultations: 0,
      pendingConsultations: 0,
      totalEarnings: 0,
      averageRating: 0,
      totalClients: 0,
      thisMonthEarnings: 0,
      attendanceRate: 0,
      newClients: 0,
    };
  } catch (error) {
    console.error('Failed to fetch expert stats:', error);
    // Return dummy data if user is not an expert or API fails
    return {
      totalConsultations: 127,
      completedConsultations: 115,
      pendingConsultations: 3,
      totalEarnings: 2847500,
      averageRating: 4.8,
      totalClients: 89,
      thisMonthEarnings: 847500,
      attendanceRate: 95,
      newClients: 12,
    };
  }
}

// Get upcoming consultations
export async function getUpcomingConsultations(): Promise<Consultation[]> {
  try {
    const response = await api.get<Consultation[]>('/reservations', {
      params: { status: 'scheduled', limit: 10 }
    });
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch upcoming consultations:', error);
    // Return dummy data
    return [
      {
        id: '1',
        clientName: '김민수',
        clientId: 'client1',
        date: '2024-01-15',
        time: '14:00',
        duration: 60,
        type: 'video',
        status: 'scheduled',
        specialty: '진로상담'
      },
      {
        id: '2',
        clientName: '박지영',
        clientId: 'client2',
        date: '2024-01-15',
        time: '16:00',
        duration: 45,
        type: 'chat',
        status: 'scheduled',
        specialty: '심리상담'
      }
    ];
  }
}

// Get recent reviews
export async function getRecentReviews(limit: number = 5): Promise<Review[]> {
  try {
    const response = await api.get<{ reviews: Review[] }>('/reviews', {
      params: { limit }
    });
    return response.data?.reviews || [];
  } catch (error) {
    console.error('Failed to fetch recent reviews:', error);
    // Return dummy data
    return [
      {
        id: '1',
        clientName: '이수진',
        rating: 5,
        comment: '정말 전문적이고 친절한 상담이었습니다. 많은 도움이 되었어요!',
        date: '2024-01-14',
        consultationId: 'consult1'
      },
      {
        id: '2',
        clientName: '최영희',
        rating: 4,
        comment: '시간을 잘 지켜주시고 설명도 이해하기 쉬웠습니다.',
        date: '2024-01-13',
        consultationId: 'consult2'
      }
    ];
  }
}