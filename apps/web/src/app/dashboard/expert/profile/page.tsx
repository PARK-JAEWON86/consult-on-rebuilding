"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ExpertProfile from "@/components/dashboard/ExpertProfile";
import ExpertProfileEdit from "@/components/dashboard/ExpertProfileEdit";
import ExpertProfileDetail from "@/components/experts/ExpertProfileDetail";
import DashboardLayout from "@/components/layout/DashboardLayout";

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
  const searchParams = useSearchParams();

  // 디버깅용 로그
  console.log('🔍 프로필 페이지 상태:', {
    user,
    isLoading,
    userRoles: user?.roles,
    isExpert: user?.roles?.includes('EXPERT'),
    timestamp: new Date().toISOString()
  });
  const queryClient = useQueryClient();
  const [initialData, setInitialData] = useState<
    Partial<ExpertProfileData> & { isProfileComplete?: boolean }
  >();
  const [isEditing, setIsEditing] = useState(searchParams.get('mode') === 'edit');
  const [currentExpertId, setCurrentExpertId] = useState<number | null>(null);
  const [currentDisplayId, setCurrentDisplayId] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const expertProfileRef = useRef<any>(null);

  // URL 쿼리 파라미터로 편집 모드 활성화
  useEffect(() => {
    if (searchParams.get('mode') === 'edit') {
      setIsEditing(true);
    }
  }, [searchParams]);

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

        let expertId = null;
        let actualDisplayId = null;

        // 데이터베이스에서 실제 프로필 데이터 로드
        let expertProfile = null;

        try {
          // 1. 먼저 사용자 객체에 expert 정보가 있는지 확인
          if (user?.expert?.displayId) {
            actualDisplayId = user.expert.displayId;
            expertId = user.expert.id;
            setCurrentExpertId(expertId);
            setCurrentDisplayId(actualDisplayId);
            console.log(`✅ 사용자 객체에서 전문가 정보 발견: ID=${expertId}, displayId=${actualDisplayId}`);
          } else {
            // 2. 없으면 API로 전문가 목록 조회
            console.log(`🔄 전문가 목록에서 검색: ${user?.name}`);

            const expertsListResponse = await api.get('/experts', {
              params: { page: 1, size: 50 }
            });

            if (expertsListResponse.success && expertsListResponse.data) {
              const expertInList = expertsListResponse.data.items.find((expert: any) =>
                expert.name === user?.name
              );

              if (expertInList) {
                expertId = expertInList.id;
                actualDisplayId = expertInList.displayId;
                setCurrentExpertId(expertId);
                setCurrentDisplayId(actualDisplayId);
                console.log(`🔍 전문가 프로필 발견: ID=${expertId}, displayId=${actualDisplayId}`);
              } else {
                console.warn(`⚠️ 전문가 프로필을 찾을 수 없습니다: ${user?.name}`);
                // 전문가 프로필이 없는 경우 새로 생성할 수 있도록 더미 ID 할당
                expertId = Date.now() % 10000; // 임시 고유 ID
                setCurrentExpertId(expertId);
              }
            }
          }

          console.log(`🔄 전문가 프로필 데이터베이스 조회: ID=${expertId}`);

          if (expertId && actualDisplayId) {
            const response = await api.get(`/experts/${actualDisplayId}`);

            if (response.success && response.data) {
              console.log('✅ 데이터베이스에서 프로필 로드 성공:', response.data);
              expertProfile = response.data;

              // API 응답에서 displayId 추출 및 업데이트
              if (response.data.displayId && !currentDisplayId) {
                setCurrentDisplayId(response.data.displayId);
              }
            } else {
              console.warn('⚠️ 데이터베이스 응답 실패:', response.error);
            }
          }

          // 데이터베이스 조회 실패 또는 displayId가 없는 경우 localStorage에서 폴백
          if (!expertProfile && expertId) {
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
            if (expertId) {
              const storedProfile = localStorage.getItem(`expertProfile_${expertId}`);
              if (storedProfile) {
                console.log('📁 에러 발생으로 localStorage 폴백');
                expertProfile = JSON.parse(storedProfile);
              }
            }
          } catch (fallbackError) {
            console.error('❌ localStorage 폴백도 실패:', fallbackError);
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
      const response = await api.put(`/experts/${displayId}/profile`, {
        ...updated,
        id: currentExpertId,
      });

      if (response.success) {
        console.log('✅ API 저장 성공:', response);

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
        throw new Error(response.error?.message || 'API 응답 실패');
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
        <DashboardLayout variant="expert">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 뒤로가기 버튼 */}
          <div className="mb-4 pt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">전문가 프로필 편집</h1>
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
          {isEditing ? (
            <ExpertProfileEdit
              ref={expertProfileRef}
              expertData={{
                name: initialData?.name || user?.name || '',
                email: initialData?.contactInfo?.email || user?.email || '',
                phoneNumber: initialData?.contactInfo?.phone || '',
                specialty: initialData?.specialty || '',
                experience: typeof initialData?.experience === 'number' ? initialData.experience : parseInt(String(initialData?.experience || 0)),
                bio: initialData?.description || '',
                profileImage: initialData?.profileImage || null,
                keywords: initialData?.specialties || [],
                workExperience: [{ company: '', position: '', period: '' }],
                education: Array.isArray(initialData?.education) ?
                  (initialData.education as string[]).map(edu => ({ school: edu, major: '', degree: '' })) :
                  [{ school: '', major: '', degree: '' }],
                certifications: initialData?.certifications?.map(cert => ({
                  name: cert.name,
                  issuer: cert.issuer,
                  year: (cert as any).year || ''
                })) || [{ name: '', issuer: '', year: '' }],
                mbti: '',
                consultationStyle: '',
                consultationTypes: initialData?.consultationTypes || [],
                availabilitySlots: [],
                holidaySettings: { acceptHolidayConsultations: false, holidayNote: '' },
                portfolioPreviews: [],
                socialLinks: {
                  website: initialData?.socialLinks?.linkedin || initialData?.contactInfo?.website || '',
                  instagram: (initialData?.socialLinks as any)?.instagram || '',
                  youtube: (initialData?.socialLinks as any)?.youtube || '',
                  linkedin: initialData?.socialLinks?.linkedin || '',
                  blog: (initialData?.socialLinks as any)?.blog || ''
                },
                totalSessions: initialData?.totalSessions || 0,
                avgRating: initialData?.avgRating || 0,
                completionRate: initialData?.completionRate || 0,
                reviewCount: initialData?.reviewCount || 0
              }}
              onSave={(data) => {
                const convertedData = {
                  ...data,
                  description: data.bio,
                  specialties: data.keywords,
                  languages: ['한국어'],
                  hourlyRate: 0,
                  creditsPerMinute: 0,
                  level: '',
                  responseTime: '2시간 내',
                  averageSessionDuration: 60,
                  cancellationPolicy: '24시간 전 취소 가능',
                  availability: {
                    monday: { available: false, hours: '09:00-18:00' },
                    tuesday: { available: false, hours: '09:00-18:00' },
                    wednesday: { available: false, hours: '09:00-18:00' },
                    thursday: { available: false, hours: '09:00-18:00' },
                    friday: { available: false, hours: '09:00-18:00' },
                    saturday: { available: false, hours: '09:00-18:00' },
                    sunday: { available: false, hours: '09:00-18:00' }
                  },
                  holidayPolicy: data.holidaySettings.holidayNote,
                  contactInfo: {
                    phone: '',
                    email: '',
                    location: '',
                    website: data.socialLinks.website
                  },
                  portfolioFiles: [],
                  isProfileComplete: true
                };
                handleSave(convertedData as any);
              }}
              onBack={() => setIsEditing(false)}
            />
          ) : (
            <ExpertProfile
              ref={expertProfileRef}
              expertData={initialData}
              onSave={handleSave}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
            />
          )}
        </div>
        </DashboardLayout>
      ) : currentDisplayId || currentExpertId ? (
        <ExpertProfileDetail
          displayId={currentDisplayId || `expert_${currentExpertId}`}
          isOwner={true}
          showEditMode={true}
          hideBackButton={false}
          hideSidebar={false}
          className=""
        />
      ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <svg className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">프로필 미리보기를 사용할 수 없습니다</h3>
                    <p className="text-yellow-800 mb-4">
                      전문가 프로필이 아직 시스템에 등록되지 않았습니다.
                      프로필을 먼저 편집하여 저장해주세요.
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
                    >
                      프로필 편집하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}
    </>
  );
}