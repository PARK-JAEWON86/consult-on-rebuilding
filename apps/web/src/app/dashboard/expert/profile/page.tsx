"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useQueryClient } from '@tanstack/react-query';
import ExpertProfile from "@/components/dashboard/ExpertProfile";
import ExpertProfilePreview from "@/components/dashboard/ExpertProfilePreview";

interface User {
  id: string;
  email: string;
  name?: string;
  roles: ('USER' | 'EXPERT' | 'ADMIN')[];
  createdAt: string;
  updatedAt: string;
  credits?: number;
  avatarUrl?: string;
  isEmailVerified?: boolean;
}

type ConsultationType = "video" | "chat" | "voice";

type Availability = Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  { available: boolean; hours: string }
>;

type PortfolioFile = {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
};

type ExpertProfileData = {
  isProfileComplete?: boolean;
  name: string;
  specialty: string;
  experience: number | string;
  description: string;
  education: string[];
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  specialties: string[];
  consultationTypes: ConsultationType[];
  languages: string[];
  hourlyRate: number | string;
  pricePerMinute?: number;
  totalSessions: number;
  avgRating: number;
  level?: string | number;
  completionRate?: number;
  repeatClients?: number;
  responseTime?: string;
  averageSessionDuration?: number;
  reviewCount?: number;
  cancellationPolicy?: string;
  availability: Availability;
  holidayPolicy?: string;
  contactInfo: {
    phone: string;
    email: string;
    location: string;
    website: string;
  };
  socialLinks?: {
    linkedin: string;
    github: string;
    twitter: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
  profileImage: string | null;
  portfolioFiles: PortfolioFile[];
};

export default function ExpertProfileEditPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [initialData, setInitialData] = useState<
    Partial<ExpertProfileData> & { isProfileComplete?: boolean }
  >();
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpertId, setCurrentExpertId] = useState<number | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const expertProfileRef = useRef<any>(null);

  // 인증 확인
  useEffect(() => {
    if (!isLoading && (!user || !user.roles.includes('EXPERT'))) {
      // 현재 페이지 경로를 redirect 파라미터로 전달
      const currentPath = encodeURIComponent('/dashboard/expert/profile');
      router.push(`/auth/login?redirect=${currentPath}`);
    }
  }, [user, isLoading, router]);

  // 전문가 프로필 데이터 로드
  useEffect(() => {
    if (!user || !user.roles.includes('EXPERT')) return;

    const loadExpertProfile = async () => {
      try {
        setIsDataLoading(true);

        // 로그인한 전문가의 ID 추출
        const expertId = user.id && typeof user.id === 'string'
          ? parseInt(user.id.replace('expert_', ''))
          : 0;
        if (expertId > 0) {
          setCurrentExpertId(expertId);
        }

        // 데이터베이스에서 실제 프로필 데이터 로드
        let expertProfile = null;

        if (expertId) {
          try {
            // 실제 데이터베이스에서 먼저 조회 - 먼저 전문가 목록에서 실제 displayId 찾기
            console.log(`🔄 전문가 프로필 데이터베이스 조회: ID=${expertId}`);

            // 전문가 목록에서 해당 ID의 실제 displayId 찾기
            const expertsListResponse = await fetch('http://localhost:4000/v1/experts?page=1&size=50');
            let actualDisplayId = null;

            if (expertsListResponse.ok) {
              const expertsListResult = await expertsListResponse.json();
              if (expertsListResult.success) {
                const expertInList = expertsListResult.data.items.find((expert: any) => expert.id === expertId);
                if (expertInList && expertInList.displayId) {
                  actualDisplayId = expertInList.displayId;
                  console.log(`🔍 전문가 ID ${expertId}의 실제 displayId: ${actualDisplayId}`);
                }
              }
            }

            const displayId = actualDisplayId || `expert_${expertId}`; // fallback
            const response = await fetch(`http://localhost:4000/v1/experts/${displayId}`);

            if (response.ok) {
              const apiResult = await response.json();
              if (apiResult.success) {
                console.log('✅ 데이터베이스에서 프로필 로드 성공:', apiResult.data);
                expertProfile = apiResult.data;
              } else {
                console.warn('⚠️ 데이터베이스 응답 실패:', apiResult.error);
              }
            } else {
              console.warn(`⚠️ 데이터베이스 호출 실패 (${response.status})`);
            }

            // 데이터베이스 조회 실패시 localStorage에서 폴백
            if (!expertProfile) {
              const storedProfile = localStorage.getItem(`expertProfile_${expertId}`);
              if (storedProfile) {
                console.log('📁 localStorage에서 폴백 데이터 로드');
                expertProfile = JSON.parse(storedProfile);
              }
            }
          } catch (error) {
            console.error('❌ 데이터 로드 에러:', error);

            // 에러 발생시 localStorage 폴백
            try {
              const storedProfile = localStorage.getItem(`expertProfile_${expertId}`);
              if (storedProfile) {
                console.log('📁 에러 발생으로 localStorage 폴백');
                expertProfile = JSON.parse(storedProfile);
              }
            } catch (fallbackError) {
              console.error('❌ localStorage 폴백도 실패:', fallbackError);
            }
          }
        }

        // 전문가 프로필이 없으면 기본 프로필 생성
        if (!expertProfile) {
          console.log('전문가 프로필이 없어서 기본 프로필을 생성합니다:', expertId);

          const defaultProfile = {
            id: expertId,
            name: user.name || "",
            specialty: "",
            experience: 0,
            description: "",
            education: [""],
            certifications: [{ name: "", issuer: "" }],
            specialties: [""],
            consultationTypes: [],
            languages: ["한국어"],
            hourlyRate: 0,
            pricePerMinute: 0,
            totalSessions: 0,
            avgRating: 0,
            level: "Tier 1 (Lv.1-99)",
            completionRate: 95,
            repeatClients: 0,
            responseTime: '2시간 내',
            averageSessionDuration: 60,
            reviewCount: 0,
            cancellationPolicy: '24시간 전 취소 가능',
            availability: {
              monday: { available: false, hours: "09:00-18:00" },
              tuesday: { available: false, hours: "09:00-18:00" },
              wednesday: { available: false, hours: "09:00-18:00" },
              thursday: { available: false, hours: "09:00-18:00" },
              friday: { available: false, hours: "09:00-18:00" },
              saturday: { available: false, hours: "09:00-18:00" },
              sunday: { available: false, hours: "09:00-18:00" },
            },
            holidayPolicy: "",
            contactInfo: {
              phone: "",
              email: user.email || "",
              location: "",
              website: ""
            },
            profileImage: null,
            portfolioFiles: [
              { id: 1, name: "상담 사례 연구", type: "pdf", size: 2048, data: "" },
              { id: 2, name: "전문 자격증", type: "jpg", size: 1024, data: "" },
              { id: 3, name: "상담 후기 모음", type: "pdf", size: 3072, data: "" },
              { id: 4, name: "학회 발표 자료", type: "ppt", size: 4096, data: "" },
              { id: 5, name: "논문 발표", type: "pdf", size: 2560, data: "" },
              { id: 6, name: "워크샵 자료", type: "pdf", size: 1536, data: "" }
            ],
            socialProof: {
              linkedIn: "",
              website: "",
              publications: [""],
            },
            portfolioItems: [],
            consultationStyle: "",
            successStories: 0,
            nextAvailableSlot: "",
            profileViews: 0,
            lastActiveAt: new Date(),
            joinedAt: new Date(),
            reschedulePolicy: "12시간 전 일정 변경 가능",
            pricingTiers: [
              { duration: 30, price: 25000, description: "기본 상담" },
              { duration: 60, price: 45000, description: "상세 상담" },
              { duration: 90, price: 65000, description: "종합 상담" }
            ],
            targetAudience: ["성인", "직장인", "학생"],
            isProfileComplete: false,
          };

          setInitialData(defaultProfile);
          return;
        }

        // 기존 데이터 변환
        const convertedData = {
          id: expertId,
          name: user.name || expertProfile.fullName || expertProfile.name || "",
          specialty: expertProfile.specialty || "",
          experience: expertProfile.experienceYears || expertProfile.experience || 0,
          description: expertProfile.bio || expertProfile.description || "",
          education: expertProfile.education || [""],
          certifications: expertProfile.certifications || [{ name: "", issuer: "" }],
          specialties: expertProfile.specialties || [expertProfile.specialty || ""],
          consultationTypes: expertProfile.consultationTypes || [],
          languages: expertProfile.languages || ["한국어"],
          hourlyRate: expertProfile.hourlyRate || (expertProfile.pricePerMinute ? expertProfile.pricePerMinute * 60 : ""),
          pricePerMinute: expertProfile.pricePerMinute || 0,
          totalSessions: expertProfile.totalSessions || 0,
          avgRating: expertProfile.avgRating || expertProfile.rating || 0,
          level: expertProfile.level || "Tier 1 (Lv.1-99)",
          completionRate: expertProfile.completionRate || 85,
          repeatClients: expertProfile.repeatClients || Math.floor((expertProfile.totalSessions || 0) * 0.3),
          responseTime: expertProfile.responseTime || '2시간 내',
          averageSessionDuration: expertProfile.averageSessionDuration || 60,
          reviewCount: expertProfile.reviewCount || Math.floor((expertProfile.totalSessions || 0) * 0.7),
          cancellationPolicy: expertProfile.cancellationPolicy || '24시간 전 취소 가능',
          availability: expertProfile.availability || {
            monday: { available: false, hours: "09:00-18:00" },
            tuesday: { available: false, hours: "09:00-18:00" },
            wednesday: { available: false, hours: "09:00-18:00" },
            thursday: { available: false, hours: "09:00-18:00" },
            friday: { available: false, hours: "09:00-18:00" },
            saturday: { available: false, hours: "09:00-18:00" },
            sunday: { available: false, hours: "09:00-18:00" },
          },
          holidayPolicy: expertProfile.holidayPolicy || "",
          contactInfo: expertProfile.contactInfo || {
            phone: "",
            email: user.email || "",
            location: expertProfile.location || "",
            website: ""
          },
          profileImage: expertProfile.profileImage || null,
          portfolioFiles: expertProfile.portfolioFiles || [],
          isProfileComplete: expertProfile?.isProfileComplete === true,
        };

        setInitialData(convertedData);
        console.log('💾 프로필 페이지에서 ExpertProfilePreview로 전달되는 데이터:', {
          expertId: expertId,
          convertedData: convertedData,
          originalExpertProfile: expertProfile
        });
      } catch (error) {
        console.error('전문가 프로필 로드 에러:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadExpertProfile();
  }, [user]);

  const handleSave = async (
    updated: ExpertProfileData & { isProfileComplete: boolean }
  ) => {
    if (!currentExpertId) {
      alert("전문가 ID를 찾을 수 없습니다.");
      return;
    }

    try {
      console.log(`🔄 전문가 프로필 API 저장: ID=${currentExpertId}`);

      // displayId 생성 (임시로 expert_ prefix 사용)
      const displayId = `expert_${currentExpertId}`;

      // 실제 데이터베이스 API 호출
      const response = await fetch(`http://localhost:4000/v1/experts/${displayId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // JWT 토큰 필요시
        },
        body: JSON.stringify({
          ...updated,
          id: currentExpertId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          console.log('✅ API 저장 성공:', result);

          // 로컬 상태 업데이트
          setInitialData(updated);

          // localStorage에도 저장 (캐시 용도)
          const storageData = {
            id: currentExpertId,
            fullName: updated.name,
            name: updated.name,
            specialty: updated.specialty,
            experienceYears: updated.experience,
            experience: updated.experience,
            bio: updated.description,
            description: updated.description,
            education: updated.education,
            certifications: updated.certifications,
            keywords: updated.specialties,
            specialties: updated.specialties,
            consultationTypes: updated.consultationTypes,
            languages: updated.languages,
            hourlyRate: updated.hourlyRate,
            pricePerMinute: updated.pricePerMinute,
            availability: updated.availability,
            contactInfo: updated.contactInfo,
            location: updated.contactInfo.location,
            email: updated.contactInfo.email,
            profileImage: updated.profileImage,
            portfolioFiles: updated.portfolioFiles,
            totalSessions: updated.totalSessions || 0,
            rating: updated.avgRating || 0,
            avgRating: updated.avgRating || 0,
            reviewCount: updated.reviewCount || 0,
            repeatClients: updated.repeatClients || 0,
            responseTime: updated.responseTime || '2시간 내',
            cancellationPolicy: updated.cancellationPolicy || '24시간 전 취소 가능',
            holidayPolicy: updated.holidayPolicy || '',
            isProfileComplete: updated.isProfileComplete,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          localStorage.setItem(`expertProfile_${currentExpertId}`, JSON.stringify(storageData));
          localStorage.setItem("approvedExpertProfile", JSON.stringify(updated));

          // React Query 캐시 무효화 (미리보기 실시간 업데이트)
          queryClient.invalidateQueries({ queryKey: ['expert-profile-live', currentExpertId] });
          queryClient.invalidateQueries({ queryKey: ['expert-rankings', currentExpertId] });
          queryClient.invalidateQueries({ queryKey: ['expert', displayId] });

          // 저장 성공 후 편집 모드 종료
          setIsEditing(false);

          alert("프로필이 성공적으로 저장되었습니다.");
        } else {
          throw new Error(result.error?.message || 'API 응답 실패');
        }
      } else {
        // API 실패시 localStorage에만 저장
        console.warn(`⚠️ API 저장 실패 (${response.status}), localStorage에만 저장`);

        const storageData = {
          id: currentExpertId,
          // ... 동일한 저장 로직
          fullName: updated.name,
          name: updated.name,
          specialty: updated.specialty,
          experienceYears: updated.experience,
          experience: updated.experience,
          bio: updated.description,
          description: updated.description,
          education: updated.education,
          certifications: updated.certifications,
          keywords: updated.specialties,
          specialties: updated.specialties,
          consultationTypes: updated.consultationTypes,
          languages: updated.languages,
          hourlyRate: updated.hourlyRate,
          pricePerMinute: updated.pricePerMinute,
          availability: updated.availability,
          contactInfo: updated.contactInfo,
          location: updated.contactInfo.location,
          email: updated.contactInfo.email,
          profileImage: updated.profileImage,
          portfolioFiles: updated.portfolioFiles,
          totalSessions: updated.totalSessions || 0,
          rating: updated.avgRating || 0,
          avgRating: updated.avgRating || 0,
          reviewCount: updated.reviewCount || 0,
          repeatClients: updated.repeatClients || 0,
          responseTime: updated.responseTime || '2시간 내',
          cancellationPolicy: updated.cancellationPolicy || '24시간 전 취소 가능',
          holidayPolicy: updated.holidayPolicy || '',
          isProfileComplete: updated.isProfileComplete,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(`expertProfile_${currentExpertId}`, JSON.stringify(storageData));
        localStorage.setItem("approvedExpertProfile", JSON.stringify(updated));

        setInitialData(updated);
        setIsEditing(false);

        alert("프로필이 로컬에 저장되었습니다. (서버 연결 실패)");
      }
    } catch (error) {
      console.error('❌ 프로필 저장 중 에러:', error);

      // 에러 발생시에도 localStorage에 저장
      try {
        const storageData = {
          id: currentExpertId,
          // ... 동일한 저장 로직
          fullName: updated.name,
          name: updated.name,
          specialty: updated.specialty,
          experienceYears: updated.experience,
          experience: updated.experience,
          bio: updated.description,
          description: updated.description,
          education: updated.education,
          certifications: updated.certifications,
          keywords: updated.specialties,
          specialties: updated.specialties,
          consultationTypes: updated.consultationTypes,
          languages: updated.languages,
          hourlyRate: updated.hourlyRate,
          pricePerMinute: updated.pricePerMinute,
          availability: updated.availability,
          contactInfo: updated.contactInfo,
          location: updated.contactInfo.location,
          email: updated.contactInfo.email,
          profileImage: updated.profileImage,
          portfolioFiles: updated.portfolioFiles,
          totalSessions: updated.totalSessions || 0,
          rating: updated.avgRating || 0,
          avgRating: updated.avgRating || 0,
          reviewCount: updated.reviewCount || 0,
          repeatClients: updated.repeatClients || 0,
          responseTime: updated.responseTime || '2시간 내',
          cancellationPolicy: updated.cancellationPolicy || '24시간 전 취소 가능',
          holidayPolicy: updated.holidayPolicy || '',
          isProfileComplete: updated.isProfileComplete,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        localStorage.setItem(`expertProfile_${currentExpertId}`, JSON.stringify(storageData));
        localStorage.setItem("approvedExpertProfile", JSON.stringify(updated));

        setInitialData(updated);
        setIsEditing(false);

        alert("프로필이 로컬에 저장되었습니다. (네트워크 오류)");
      } catch (storageError) {
        console.error('❌ localStorage 저장도 실패:', storageError);
        alert("프로필 저장에 실패했습니다.");
      }
    }
  };

  // 로딩 스켈레톤
  const SkeletonLoader = () => (
    <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-6">
                <div className="w-36 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </div>
              </div>
            </div>

            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );

  // 로딩 중
  if (isLoading || isDataLoading) {
    return <SkeletonLoader />;
  }

  // 인증되지 않음
  if (!user || !user.roles.includes('EXPERT')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 프로필 데이터 없음
  if (!initialData) {
    return <SkeletonLoader />;
  }

  return (
    <>
      {isEditing ? (
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">전문가 프로필 편집</h1>
              <p className="text-gray-600 mt-1">
                클라이언트에게 보여질 프로필 정보를 편집하세요.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                미리보기
              </button>
              <button
                onClick={() => {
                  // ExpertProfile 컴포넌트의 저장 함수 호출
                  if (expertProfileRef.current && expertProfileRef.current.handleSave) {
                    expertProfileRef.current.handleSave();
                  }
                }}
                className="flex items-center px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                저장하기
              </button>
            </div>
          </div>
          <ExpertProfile
            ref={expertProfileRef}
            expertData={initialData}
            onSave={handleSave}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        </div>
      ) : (
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">프로필 미리보기</h1>
                <p className="text-gray-600 mt-1">
                  클라이언트에게 실제로 보여질 프로필입니다.
                </p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                프로필 편집
              </button>
            </div>
          </div>
          <ExpertProfilePreview expertData={initialData} />
          {/* 디버깅용 */}
          <div style={{display: 'none'}}>
            <pre>{JSON.stringify(initialData, null, 2)}</pre>
          </div>
        </div>
      )}
    </>
  );
}