"use client";

import { useState, useEffect } from "react";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ExpertStatsCard } from './ExpertStatsCard';
import { ConsultationCalendar } from './ConsultationCalendar';
import { ConsultationList } from './ConsultationList';
import { ReservationRequests } from './ReservationRequests';
import { RecentReviews } from './RecentReviews';
import { ExpertTools } from './ExpertTools';
import {
  Calendar,
  RefreshCw,
  Plus,
  BarChart3,
  DollarSign,
  UserCheck,
  CheckCircle,
  Star
} from "lucide-react";

interface ExpertStats {
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

interface Consultation {
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

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  consultationId: string;
}

export const DashboardExpertView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expertStats, setExpertStats] = useState<ExpertStats>({
    totalConsultations: 0,
    completedConsultations: 0,
    pendingConsultations: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalClients: 0,
    thisMonthEarnings: 0,
    attendanceRate: 0,
    newClients: 0
  });
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [showStats, setShowStats] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadExpertData = async () => {
      setIsLoading(true);
      try {
        // 병렬로 데이터 로드
        const [statsResponse, consultationsResponse, reviewsResponse] = await Promise.all([
          fetch('/api/experts/stats'),
          fetch('/api/reservations?expertId=current&status=scheduled'),
          fetch('/api/reviews?expertId=current&limit=5')
        ]);

        const [statsData, consultationsData, reviewsData] = await Promise.all([
          statsResponse.json(),
          consultationsResponse.json(),
          reviewsResponse.json()
        ]);

        if (statsData.success) {
          setExpertStats(statsData.data);
        }

        if (consultationsData.success) {
          setUpcomingConsultations(consultationsData.data || []);
        }

        if (reviewsData.success) {
          setRecentReviews(reviewsData.data || []);
        }
      } catch (error) {
        console.error('전문가 데이터 로드 실패:', error);
        // 더미 데이터 설정
        setExpertStats({
          totalConsultations: 127,
          completedConsultations: 115,
          pendingConsultations: 3,
          totalEarnings: 2847500,
          averageRating: 4.8,
          totalClients: 89,
          thisMonthEarnings: 847500,
          attendanceRate: 95,
          newClients: 12
        });
        setUpcomingConsultations([
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
        ]);
        setRecentReviews([
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
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExpertData();
  }, []);


  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">전문가 대시보드를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                전문가 대시보드
              </h1>
              <p className="text-gray-600 mt-1">
                상담 일정과 수익을 관리하세요
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>상세 통계</span>
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>새로고침</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ExpertStatsCard
            title="이번 달 수익"
            value={`₩${expertStats.thisMonthEarnings.toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
            color="green"
          />
          
          <ExpertStatsCard
            title="완료된 상담"
            value={`${expertStats.completedConsultations}건`}
            icon={<CheckCircle className="h-6 w-6" />}
            subtitle={`총 ${expertStats.totalConsultations}건`}
            color="blue"
          />
          
          <ExpertStatsCard
            title="평균 평점"
            value={expertStats.averageRating}
            icon={<Star className="h-6 w-6" />}
            subtitle={`출석률 ${expertStats.attendanceRate}%`}
            color="yellow"
          />
          
          <ExpertStatsCard
            title="신규 고객"
            value={`${expertStats.newClients}명`}
            icon={<UserCheck className="h-6 w-6" />}
            subtitle={`총 ${expertStats.totalClients}명`}
            color="purple"
          />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 상담 일정 */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                  상담 일정
                </h2>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  일정 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConsultationCalendar
                  consultations={upcomingConsultations}
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />
                
                <ConsultationList
                  consultations={upcomingConsultations}
                  selectedDate={selectedDate}
                  onConsultationClick={(consultation) => {
                    console.log('상담 상세보기:', consultation);
                  }}
                />
              </div>
            </Card>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            <ReservationRequests
              requests={[
                {
                  id: '1',
                  clientName: '박○○',
                  clientId: 'client1',
                  date: '2024-01-16',
                  time: '14:00',
                  duration: 60,
                  type: 'video',
                  specialty: '진로상담',
                  message: '대학 진학에 대해 상담받고 싶습니다.',
                  isNew: true,
                  requestedAt: '2024-01-15T10:30:00'
                },
                {
                  id: '2',
                  clientName: '최○○',
                  clientId: 'client2',
                  date: '2024-01-20',
                  time: '16:00',
                  duration: 45,
                  type: 'chat',
                  specialty: '심리상담',
                  isNew: false,
                  requestedAt: '2024-01-15T09:15:00'
                }
              ]}
              onApprove={(requestId) => {
                console.log('예약 승인:', requestId);
              }}
              onReject={(requestId) => {
                console.log('예약 거절:', requestId);
              }}
              onViewDetails={(request) => {
                console.log('예약 상세보기:', request);
              }}
            />

            <RecentReviews
              reviews={recentReviews}
              onViewAll={() => {
                console.log('모든 리뷰 보기');
              }}
              maxDisplay={3}
            />

            <ExpertTools
              onToolClick={(toolId) => {
                console.log('도구 클릭:', toolId);
              }}
            />
          </div>
        </div>

        {/* 상세 통계 (토글) */}
        {showStats && (
          <Card className="p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">상세 통계</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{expertStats.completedConsultations}</div>
                <p className="text-sm text-gray-500">완료된 상담</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{expertStats.averageRating}</div>
                <p className="text-sm text-gray-500">평균 평점</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{expertStats.attendanceRate}%</div>
                <p className="text-sm text-gray-500">출석률</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{expertStats.newClients}</div>
                <p className="text-sm text-gray-500">신규 고객</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};