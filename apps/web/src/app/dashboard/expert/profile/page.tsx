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

type Availability = Partial<Record<
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday",
  { available: boolean; hours: string }
>>;

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
  keywords: string[];  // specialties → keywords로 변경
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
  // 추가 필드들 (백엔드에서 전송되는 필드)
  portfolioItems?: any[];
  mbti?: string;
  consultationStyle?: string;
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
            console.log(`🌐 API 요청: GET /experts/${actualDisplayId}`);
            const response = await api.get(`/experts/${actualDisplayId}`);

            console.log('📦 API 응답 원본:', {
              success: response.success,
              hasData: !!response.data,
              portfolioFiles_in_response: response.data?.portfolioFiles,
              portfolioImages_in_response: response.data?.portfolioImages,
              certifications_in_response: response.data?.certifications,
            });

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
            availability: {}, // 하드코딩 제거, 빈 객체로 초기화
            holidayPolicy: "",
            contactInfo: {
              phone: "",
              email: user.email || "",
              location: "",
              website: ""
            },
            profileImage: null,
            portfolioFiles: [], // 더미 데이터 제거, 빈 배열로 초기화
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

        // 기존 데이터 변환 (백엔드 API 필드명 → 프론트엔드 필드명)
        const convertedData = {
          id: expertId,
          name: user.name || expertProfile.fullName || expertProfile.name || "",
          specialty: expertProfile.specialty || "",
          experience: expertProfile.experienceYears || expertProfile.experience || 0,
          description: expertProfile.bio || expertProfile.description || "",

          // 배열 필드들 - 백엔드에서 가져온 데이터 우선
          education: expertProfile.education && Array.isArray(expertProfile.education) && expertProfile.education.length > 0
            ? expertProfile.education
            : [""],
          certifications: expertProfile.certifications && Array.isArray(expertProfile.certifications) && expertProfile.certifications.length > 0
            ? expertProfile.certifications.map(cert => ({
                name: cert?.name || '',
                issuer: cert?.issuer || '',
                year: cert?.year || ''  // year 필드 추가
              }))
            : [{ name: "", issuer: "", year: "" }],
          // keywords 필드 (백엔드에서 keywords로 반환)
          keywords: expertProfile.keywords && Array.isArray(expertProfile.keywords)
            ? expertProfile.keywords
            : [],
          consultationTypes: expertProfile.consultationTypes && Array.isArray(expertProfile.consultationTypes)
            ? expertProfile.consultationTypes
            : [],
          languages: expertProfile.languages && Array.isArray(expertProfile.languages) && expertProfile.languages.length > 0
            ? expertProfile.languages
            : ["한국어"],

          // 가격 정보
          hourlyRate: expertProfile.hourlyRate || (expertProfile.pricePerMinute ? expertProfile.pricePerMinute * 60 : ""),
          pricePerMinute: expertProfile.pricePerMinute || 0,

          // 통계 정보
          totalSessions: expertProfile.totalSessions || 0,
          avgRating: expertProfile.ratingAvg || expertProfile.avgRating || expertProfile.rating || 0,
          level: expertProfile.level || "Tier 1 (Lv.1-99)",
          completionRate: expertProfile.completionRate || 85,
          repeatClients: expertProfile.repeatClients || Math.floor((expertProfile.totalSessions || 0) * 0.3),
          responseTime: expertProfile.responseTime || '2시간 내',
          averageSessionDuration: expertProfile.averageSessionDuration || 60,
          reviewCount: expertProfile.reviewCount || Math.floor((expertProfile.totalSessions || 0) * 0.7),

          // 정책 정보
          cancellationPolicy: expertProfile.cancellationPolicy || '24시간 전 취소 가능',

          // 예약 가능 시간 - 백엔드 availability JSON 객체 (하드코딩 제거, DB 데이터만 사용)
          availability: expertProfile.availability && typeof expertProfile.availability === 'object'
            ? expertProfile.availability
            : {},

          holidayPolicy: expertProfile.holidayPolicy ||
            (expertProfile.availability?.holidaySettings?.holidayNote) || "",

          // 연락처 정보
          contactInfo: expertProfile.contactInfo || {
            phone: "",
            email: user.email || "",
            location: expertProfile.location || "",
            website: ""
          },

          // 소셜 링크 - 백엔드 socialLinks 객체
          socialLinks: expertProfile.socialLinks || {
            linkedin: "",
            github: "",
            twitter: "",
            instagram: "",
            facebook: "",
            youtube: ""
          },

          // availabilitySlots - 백엔드에서 ExpertAvailability 테이블 데이터
          availabilitySlots: expertProfile.availabilitySlots && Array.isArray(expertProfile.availabilitySlots)
            ? expertProfile.availabilitySlots
            : [],

          // holidaySettings - 백엔드에서 추출된 공휴일 설정
          holidaySettings: expertProfile.holidaySettings || {
            acceptHolidayConsultations: expertProfile.availability?.holidaySettings?.acceptHolidayConsultations || false,
            holidayNote: expertProfile.availability?.holidaySettings?.holidayNote || ''
          },

          // restTimeSettings - 백엔드에서 추출된 휴식시간 설정
          restTimeSettings: expertProfile.restTimeSettings || {
            enableLunchBreak: expertProfile.availability?.restTimeSettings?.enableLunchBreak || false,
            lunchStartTime: expertProfile.availability?.restTimeSettings?.lunchStartTime || '12:00',
            lunchEndTime: expertProfile.availability?.restTimeSettings?.lunchEndTime || '13:00',
            enableDinnerBreak: expertProfile.availability?.restTimeSettings?.enableDinnerBreak || false,
            dinnerStartTime: expertProfile.availability?.restTimeSettings?.dinnerStartTime || '18:00',
            dinnerEndTime: expertProfile.availability?.restTimeSettings?.dinnerEndTime || '19:00'
          },

          // 프로필 이미지 - avatarUrl을 profileImage로 매핑
          profileImage: expertProfile.avatarUrl || expertProfile.profileImage || null,

          // 포트폴리오 파일 - portfolioFiles를 portfolioImages로 매핑
          portfolioFiles: (() => {
            console.log('🔍 포트폴리오 원본 데이터:', {
              portfolioFiles: expertProfile.portfolioFiles,
              portfolioImages: expertProfile.portfolioImages,
              type_portfolioFiles: typeof expertProfile.portfolioFiles,
              type_portfolioImages: typeof expertProfile.portfolioImages
            });

            // 1순위: portfolioFiles 배열 (백엔드가 실제로 사용하는 필드)
            if (expertProfile.portfolioFiles && Array.isArray(expertProfile.portfolioFiles) && expertProfile.portfolioFiles.length > 0) {
              console.log('📁 portfolioFiles 발견:', expertProfile.portfolioFiles);
              // 문자열이면 그대로, 객체면 data 또는 url 필드 추출
              const processed = expertProfile.portfolioFiles.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                  return (item as any).data || (item as any).url || '';
                }
                return '';
              }).filter(url => url && url.length > 0);

              console.log('✅ portfolioFiles 처리 결과:', processed);
              return processed;
            }

            // 2순위: portfolioImages 배열 (폴백)
            if (expertProfile.portfolioImages && Array.isArray(expertProfile.portfolioImages) && expertProfile.portfolioImages.length > 0) {
              console.log('📸 portfolioImages 발견:', expertProfile.portfolioImages);
              return expertProfile.portfolioImages.filter(url => url && url.length > 0);
            }

            console.log('⚠️ 포트폴리오 이미지 없음');
            return [];
          })(),

          // 경력사항 - workExperience를 portfolioItems로 매핑
          portfolioItems: expertProfile.workExperience && Array.isArray(expertProfile.workExperience)
            ? expertProfile.workExperience
            : (expertProfile.portfolioItems || []),

          // MBTI 및 상담 스타일
          mbti: expertProfile.mbti || "",
          consultationStyle: expertProfile.consultationStyle || "",

          // 프로필 완성도
          isProfileComplete: expertProfile?.isProfileComplete === true,
        };

        console.log('🔄 데이터 변환 완료:', {
          원본_필드명: Object.keys(expertProfile),
          변환된_데이터: convertedData,
          MBTI: expertProfile.mbti,
          상담스타일: expertProfile.consultationStyle,
          경력사항: expertProfile.workExperience,
          키워드: expertProfile.keywords || expertProfile.specialties,
          프로필이미지: expertProfile.avatarUrl,
          포트폴리오이미지: expertProfile.portfolioImages,
          포트폴리오파일: expertProfile.portfolioFiles,
          자격증: expertProfile.certifications,
          변환된_포트폴리오: convertedData.portfolioFiles,
          변환된_자격증: convertedData.certifications,
        });

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
      console.log(`🔄 전문가 프로필 API 저장: ID=${currentExpertId}, displayId=${currentDisplayId}`);

      // displayId 사용 (실제 API 엔드포인트에서 요구하는 displayId)
      if (!currentDisplayId) {
        throw new Error('전문가 displayId를 찾을 수 없습니다.');
      }

      // 1️⃣ 프로필 데이터와 availability 데이터 분리
      const updatedWithAvailability = updated as any;
      const { availabilitySlots, holidaySettings, restTimeSettings, ...profileData } = updatedWithAvailability;

      console.log('📤 저장할 데이터 분리:', {
        profileData: Object.keys(profileData),
        availabilityData: { availabilitySlots, holidaySettings, restTimeSettings }
      });

      // 2️⃣ 프로필 정보 저장 (기본 정보)
      const profileResponse = await api.put(`/experts/${currentDisplayId}/profile`, profileData);

      if (!profileResponse.success) {
        throw new Error(profileResponse.error?.message || '프로필 저장 실패');
      }

      console.log('✅ 프로필 저장 성공:', profileResponse);

      // 3️⃣ 예약 가능 시간, 공휴일 설정, 휴식시간 설정 저장
      if (availabilitySlots || holidaySettings || restTimeSettings) {
        const availabilityResponse = await api.put(`/experts/${currentDisplayId}/availability`, {
          slots: availabilitySlots || [],
          holidaySettings: holidaySettings,
          restTimeSettings: restTimeSettings
        });

        if (!availabilityResponse.success) {
          console.warn('⚠️ Availability 저장 실패:', availabilityResponse.error);
          // 프로필은 저장되었으므로 경고만 표시
        } else {
          console.log('✅ Availability 저장 성공:', availabilityResponse);
        }
      }

      const response = profileResponse; // 기존 코드 호환성을 위해

      if (response.success) {
        console.log('✅ 전체 저장 완료');

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
          keywords: updated.keywords,  // keywords 필드 사용
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

        // 4️⃣ 저장 후 최신 데이터 다시 조회 (availability 데이터 포함)
        console.log('🔄 최신 데이터 재조회 시작...');
        const refreshedData = await api.get(`/experts/${currentDisplayId}/profile`);

        if (refreshedData.success) {
          console.log('✅ 최신 데이터 조회 성공:', refreshedData.data);
          // 조회한 최신 데이터로 상태 업데이트
          setInitialData(refreshedData.data);
        } else {
          console.warn('⚠️ 최신 데이터 조회 실패, 기존 데이터 사용');
        }

        // React Query 캐시 무효화 (미리보기 실시간 업데이트)
        queryClient.invalidateQueries({ queryKey: ['expert-profile-live', currentExpertId] });
        queryClient.invalidateQueries({ queryKey: ['expert-rankings', currentExpertId] });
        queryClient.invalidateQueries({ queryKey: ['expert', currentDisplayId] });

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
          keywords: updated.keywords,
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

                // 키워드 - keywords 필드 사용
                keywords: initialData?.keywords || [],

                // 경력사항 - portfolioItems를 workExperience로 매핑
                workExperience: (initialData as any)?.portfolioItems && Array.isArray((initialData as any).portfolioItems) && (initialData as any).portfolioItems.length > 0
                  ? (initialData as any).portfolioItems.map((item: any) => ({
                      company: String(item?.company || ''),
                      position: String(item?.position || ''),
                      period: String(item?.period || '')
                    }))
                  : [{ company: '', position: '', period: '' }],

                // 학력 - 문자열 배열 또는 객체 배열로 변환
                education: Array.isArray(initialData?.education) && initialData.education.length > 0
                  ? (initialData.education as any[]).map(edu => {
                      if (typeof edu === 'string') {
                        return { school: String(edu), major: '', degree: '' };
                      } else if (typeof edu === 'object' && edu !== null) {
                        return {
                          school: String(edu?.school || ''),
                          major: String(edu?.major || ''),
                          degree: String(edu?.degree || '')
                        };
                      } else {
                        return { school: '', major: '', degree: '' };
                      }
                    })
                  : [{ school: '', major: '', degree: '' }],

                // 자격증 - year 필드 포함
                certifications: initialData?.certifications && Array.isArray(initialData.certifications) && initialData.certifications.length > 0
                  ? initialData.certifications.map(cert => ({
                      name: String(cert?.name || ''),
                      issuer: String(cert?.issuer || ''),
                      year: String((cert as any)?.year || '')
                    }))
                  : [{ name: '', issuer: '', year: '' }],

                // MBTI & 상담 스타일 - initialData에서 가져오기
                mbti: (initialData as any)?.mbti || '',
                consultationStyle: (initialData as any)?.consultationStyle || '',

                // 상담 유형
                consultationTypes: initialData?.consultationTypes || [],

                // 예약 가능 시간 - 백엔드에서 availabilitySlots 가져오기
                availabilitySlots: (initialData as any)?.availabilitySlots && Array.isArray((initialData as any).availabilitySlots)
                  ? (initialData as any).availabilitySlots
                  : [],
                holidaySettings: {
                  acceptHolidayConsultations: (initialData as any)?.holidaySettings?.acceptHolidayConsultations || false,
                  holidayNote: (initialData as any)?.holidaySettings?.holidayNote || initialData?.holidayPolicy || ''
                },
                restTimeSettings: {
                  enableLunchBreak: (initialData as any)?.restTimeSettings?.enableLunchBreak || false,
                  lunchStartTime: (initialData as any)?.restTimeSettings?.lunchStartTime || '12:00',
                  lunchEndTime: (initialData as any)?.restTimeSettings?.lunchEndTime || '13:00',
                  enableDinnerBreak: (initialData as any)?.restTimeSettings?.enableDinnerBreak || false,
                  dinnerStartTime: (initialData as any)?.restTimeSettings?.dinnerStartTime || '18:00',
                  dinnerEndTime: (initialData as any)?.restTimeSettings?.dinnerEndTime || '19:00'
                },

                // 포트폴리오 미리보기 - portfolioFiles는 이미 변환됨 (문자열 배열)
                portfolioPreviews: initialData?.portfolioFiles && Array.isArray(initialData.portfolioFiles)
                  ? initialData.portfolioFiles
                  : [],

                // 소셜 링크 - socialLinks 객체에서 모든 필드 가져오기
                socialLinks: {
                  website: initialData?.socialLinks?.website || initialData?.contactInfo?.website || '',
                  instagram: initialData?.socialLinks?.instagram || '',
                  youtube: initialData?.socialLinks?.youtube || '',
                  linkedin: initialData?.socialLinks?.linkedin || '',
                  blog: (initialData?.socialLinks as any)?.blog || ''
                },

                // 통계 정보
                totalSessions: initialData?.totalSessions || 0,
                avgRating: initialData?.avgRating || 0,
                completionRate: initialData?.completionRate || 0,
                reviewCount: initialData?.reviewCount || 0
              }}
              onSave={(data) => {
                // DTO에 허용된 필드만 명시적으로 추출 (불필요한 필드 제외)
                const convertedData = {
                  // 기본 정보
                  name: data.name,
                  title: data.title,
                  specialty: data.specialty,
                  bio: data.bio,
                  description: data.bio,
                  experience: data.experience,
                  mbti: data.mbti,
                  consultationStyle: data.consultationStyle,

                  // 배열 필드
                  education: data.education,
                  certifications: data.certifications,
                  keywords: data.keywords,
                  specialties: data.keywords, // keywords와 동일하게 설정
                  consultationTypes: data.consultationTypes,
                  languages: ['한국어'],
                  portfolioFiles: data.portfolioPreviews || [],
                  portfolioItems: data.portfolioItems,
                  workExperience: data.workExperience,

                  // 객체 필드
                  contactInfo: {
                    phone: data.phoneNumber || '',
                    email: data.email || '',
                    location: '',
                    website: data.socialLinks?.website || ''
                  },
                  socialLinks: data.socialLinks,

                  // 설정 필드
                  responseTime: '2시간 내',
                  cancellationPolicy: '24시간 전 취소 가능',
                  holidayPolicy: data.holidaySettings?.holidayNote || '',

                  // 프로필 관련
                  profileImage: data.profileImage,
                  isProfilePublic: data.isProfilePublic,
                  isProfileComplete: true,

                  // 추가 필드
                  hourlyRate: 0,
                  creditsPerMinute: 0,
                  level: '',
                  averageSessionDuration: 60,

                  // 예약 관련 (하드코딩 제거, 실제 데이터만 전송)
                  availabilitySlots: data.availabilitySlots,
                  holidaySettings: data.holidaySettings,
                  restTimeSettings: data.restTimeSettings
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