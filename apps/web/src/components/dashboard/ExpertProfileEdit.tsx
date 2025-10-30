"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  User,
  Calendar,
  ImageIcon,
  Upload,
  Clock,
  Tag,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Users as UsersIcon,
  Phone,
  MessageCircle,
  Video,
  Globe,
  Instagram,
  Youtube,
  Linkedin,
  X,
  Mail,
  Sparkles
} from "lucide-react";
import AvailabilityScheduleEditor, { AvailabilitySlot, HolidaySettings, RestTimeSettings } from '@/components/experts/AvailabilityScheduleEditor';
import { AiPhotoStudioModal } from '@/components/profile/AiPhotoStudioModal';

type ConsultationType = "video" | "chat" | "voice";

interface WorkExperience {
  company: string;
  position: string;
  period: string;
}

interface Education {
  school: string;
  major: string;
  degree: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

interface SocialLinks {
  website: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  blog: string;
}

interface ExpertProfileEditData {
  // 기본 정보
  name: string;
  email: string;
  phoneNumber: string;
  specialty: string;
  experience: number;
  bio: string;
  profileImage: string | null;

  // 키워드
  keywords: string[];

  // 경력사항
  workExperience: WorkExperience[];

  // 학력
  education: Education[];

  // 자격증
  certifications: Certification[];

  // MBTI & 상담 스타일
  mbti: string;
  consultationStyle: string;

  // 구사 언어
  languages: string[];

  // 상담 유형
  consultationTypes: ConsultationType[];

  // 예약 가능 시간 (새로운 슬롯 기반)
  availabilitySlots: AvailabilitySlot[];
  holidaySettings: HolidaySettings;
  restTimeSettings: RestTimeSettings;

  // 포트폴리오
  portfolioPreviews: string[];

  // 소셜 링크
  socialLinks: SocialLinks;

  // 통계 (읽기 전용)
  totalSessions?: number;
  avgRating?: number;
  completionRate?: number;
  reviewCount?: number;
}

interface ExpertProfileEditProps {
  expertData: Partial<ExpertProfileEditData>;
  onSave: (data: ExpertProfileEditData) => void;
  onBack?: () => void;
}

const ExpertProfileEdit = forwardRef<any, ExpertProfileEditProps>(({
  expertData,
  onSave,
  onBack
}, ref) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule'>('basic');
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const [formData, setFormData] = useState<ExpertProfileEditData>({
    name: "",
    email: "",
    phoneNumber: "",
    specialty: "",
    experience: 0,
    bio: "",
    profileImage: null,
    keywords: [],
    workExperience: [{ company: '', position: '', period: '' }],
    education: [{ school: '', major: '', degree: '' }],
    certifications: [{ name: '', issuer: '', year: '' }],
    mbti: "",
    consultationStyle: "",
    languages: ["한국어"],
    consultationTypes: [],
    availabilitySlots: [],
    holidaySettings: {
      acceptHolidayConsultations: false,
      holidayNote: ''
    },
    restTimeSettings: {
      enableLunchBreak: false,
      lunchStartTime: '12:00',
      lunchEndTime: '13:00',
      enableDinnerBreak: false,
      dinnerStartTime: '18:00',
      dinnerEndTime: '19:00'
    },
    portfolioPreviews: [],
    socialLinks: {
      website: '',
      instagram: '',
      youtube: '',
      linkedin: '',
      blog: ''
    },
    totalSessions: 0,
    avgRating: 0,
    completionRate: 0,
    reviewCount: 0
  });

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);

  // 키워드 입력 상태
  const [keywordsInput, setKeywordsInput] = useState('');

  // 데이터 초기화
  useEffect(() => {
    if (expertData) {
      setFormData(prev => ({
        ...prev,
        ...expertData,
      }));

      // 키워드 입력 필드 초기화
      if (expertData.keywords && expertData.keywords.length > 0) {
        setKeywordsInput(expertData.keywords.join(', '));
      }
    }
  }, [expertData]);

  // ref로 외부에서 호출할 수 있는 함수들
  useImperativeHandle(ref, () => ({
    handleSave: () => {
      handleSave();
    }
  }));

  const handleSave = () => {
    // 필수 필드 검증
    if (!formData.name.trim() || !formData.specialty.trim()) {
      alert("이름과 전문 분야는 필수 입력 항목입니다.");
      return;
    }

    if (!formData.profileImage) {
      alert("프로필 사진은 필수입니다.");
      return;
    }

    if (formData.keywords.length === 0) {
      alert("키워드를 최소 1개 이상 입력해주세요.");
      return;
    }

    if (formData.bio.trim().length < 30) {
      alert("자기소개는 최소 30자 이상 작성해주세요.");
      return;
    }

    if (formData.consultationTypes.length === 0) {
      alert("상담 유형을 최소 1개 이상 선택해주세요.");
      return;
    }

    const hasAvailability = formData.availabilitySlots.length > 0 &&
                           formData.availabilitySlots.some(slot => slot.isActive);

    if (!hasAvailability) {
      alert("예약 가능 시간을 최소 1개 이상 설정해주세요.");
      return;
    }

    onSave(formData);
  };

  const handleInputChange = <K extends keyof ExpertProfileEditData>(
    field: K,
    value: ExpertProfileEditData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 프로필 이미지 업로드
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('이미지 크기는 5MB 이하로 제한됩니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const compressedSize = (compressedDataUrl.length * 3) / 4;

        if (compressedSize > maxSize) {
          alert('압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
          return;
        }

        handleInputChange('profileImage', compressedDataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 키워드 변경
  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value);
    const keywordArray = value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 10);
    handleInputChange('keywords', keywordArray);
  };

  // 경력사항 관리
  const addWorkExperience = () => {
    handleInputChange('workExperience', [
      ...formData.workExperience,
      { company: '', position: '', period: '' }
    ]);
  };

  const removeWorkExperience = (index: number) => {
    handleInputChange('workExperience', formData.workExperience.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = formData.workExperience.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleInputChange('workExperience', updated);
  };

  // 학력 관리
  const addEducation = () => {
    handleInputChange('education', [
      ...formData.education,
      { school: '', major: '', degree: '' }
    ]);
  };

  const removeEducation = (index: number) => {
    handleInputChange('education', formData.education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = formData.education.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleInputChange('education', updated);
  };

  // 자격증 관리
  const addCertification = () => {
    handleInputChange('certifications', [
      ...formData.certifications,
      { name: '', issuer: '', year: '' }
    ]);
  };

  const removeCertification = (index: number) => {
    handleInputChange('certifications', formData.certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = formData.certifications.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    handleInputChange('certifications', updated);
  };

  // 상담 유형 토글
  const toggleConsultationType = (type: ConsultationType) => {
    const types = formData.consultationTypes.includes(type)
      ? formData.consultationTypes.filter(t => t !== type)
      : [...formData.consultationTypes, type];
    handleInputChange('consultationTypes', types);
  };

  // 포트폴리오 드래그 앤 드롭
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      handlePortfolioUpload(syntheticEvent);
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - formData.portfolioPreviews.length);

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하만 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('portfolioPreviews', [
          ...formData.portfolioPreviews,
          reader.result as string
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePortfolio = (index: number) => {
    handleInputChange('portfolioPreviews', formData.portfolioPreviews.filter((_, i) => i !== index));
  };

  // 소셜 링크 변경
  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    handleInputChange('socialLinks', {
      ...formData.socialLinks,
      [platform]: value
    });
  };

  // 예약 가능 시간 변경
  const handleAvailabilityChange = (slots: AvailabilitySlot[], holidaySettings: HolidaySettings, restTimeSettings: RestTimeSettings) => {
    handleInputChange('availabilitySlots', slots);
    handleInputChange('holidaySettings', holidaySettings);
    handleInputChange('restTimeSettings', restTimeSettings);
  };

  // 경력(년) 자동 계산 (개월 단위 포함)
  useEffect(() => {
    const calculateTotalExperience = () => {
      const currentDate = new Date();
      let totalMonths = 0;

      formData.workExperience.forEach((exp) => {
        if (!exp.period || !exp.company) return;

        // 정규식: "2020.01 ~ 2023.12" 또는 "2020 ~ 2023" 또는 "2020.01 ~ 현재"
        const periodRegex = /(\d{4})(?:\.(\d{1,2}))?\s*~\s*(?:(\d{4})(?:\.(\d{1,2}))?|(현재|재직중))/;
        const match = exp.period.match(periodRegex);

        if (!match) return;

        const startYear = parseInt(match[1]);
        const startMonth = match[2] ? parseInt(match[2]) : 1;

        let endYear: number;
        let endMonth: number;

        if (match[5]) {
          // "현재" 또는 "재직중"
          endYear = currentDate.getFullYear();
          endMonth = currentDate.getMonth() + 1;
        } else if (match[3]) {
          endYear = parseInt(match[3]);
          endMonth = match[4] ? parseInt(match[4]) : 12;
        } else {
          return;
        }

        const months = (endYear - startYear) * 12 + (endMonth - startMonth);
        totalMonths += Math.max(0, months);
      });

      // 총 개월 수를 년 단위로 변환 (소수점 첫째 자리)
      const years = Math.round((totalMonths / 12) * 10) / 10;
      handleInputChange('experience', years);
    };

    calculateTotalExperience();
  }, [formData.workExperience]);

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'basic'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              기본 프로필
            </div>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              자격증 및 일정 설정
            </div>
          </button>
        </div>
      </div>

      {/* 기본 프로필 탭 (Step3-1 스타일) */}
      {activeTab === 'basic' && (
        <>
          {/* 기본 정보 (이름, 이메일, 전화번호) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" /> 이름
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> 이메일
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2" /> 전화번호
                  <span className="text-red-500 ml-1">*</span>
                  <span className="ml-2 text-xs text-gray-500 font-normal">(사용자에게 비공개)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  placeholder="01012345678"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Flex layout: Profile Image (left) + Form Fields (right) */}
              <div className="flex gap-6">
                {/* Profile Image Section - Fixed Width */}
                <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" /> 프로필 사진
                  <span className="text-red-500 ml-1">*</span>
                </h3>
                <div className="w-64">
                  <div className="w-full h-96 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden mb-3">
                    {formData.profileImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={formData.profileImage}
                          alt="프로필"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleInputChange('profileImage', null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <ImageIcon className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">프로필 사진</p>
                        <p className="text-xs text-gray-500 mt-1">권장: 2:3 비율 (1024×1536)</p>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-image-upload"
                      className="cursor-pointer w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.profileImage ? '사진 변경' : '사진 업로드'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAiStudioOpen(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/30"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI 스튜디오
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">JPG, PNG (최대 5MB)</p>
                </div>
              </div>

              {/* Form Fields Section - Flexible Width */}
              <div className="flex-1 space-y-6">
                {/* Grid for specialty, experience and languages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" /> 상담분야
                      <span className="text-red-500 ml-1">*</span>
                      <span className="text-xs text-gray-500 ml-2 font-normal">(승인 후 변경 불가)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.specialty}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                      placeholder="예: 심리상담, 법률상담"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" /> 경력
                      <span className="ml-2 text-xs text-gray-500 font-normal">(경력 사항 입력 시 자동 계산)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.experience === 0 ? '0년' : `${Math.floor(formData.experience)}년 ${Math.round((formData.experience % 1) * 12)}개월`}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Globe className="w-4 h-4 mr-2" /> 구사 언어
                      <span className="ml-2 text-xs text-gray-500 font-normal">(콤마로 구분)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.languages.join(', ')}
                      onChange={(e) => {
                        const languagesArray = e.target.value
                          .split(',')
                          .map(lang => lang.trim())
                          .filter(lang => lang.length > 0);
                        handleInputChange('languages', languagesArray);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="예: 한국어, 영어"
                    />
                  </div>
                </div>

                {/* Keywords Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" /> 키워드 (상담 주제)
                    <span className="text-red-500 ml-1">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(콤마로 구분, 최대 10개)</span>
                  </h3>
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => handleKeywordsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 스트레스, 우울, 불안, 계약법, 이직, 커리어"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {formData.keywords.length > 0 && `입력된 키워드: ${formData.keywords.length}개`}
                    </p>
                    {formData.keywords.length >= 10 && (
                      <p className="text-xs text-red-500">최대 10개까지만 입력 가능합니다</p>
                    )}
                  </div>

                  {/* 입력된 키워드 태그 표시 */}
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio Section */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> 자기소개
                    <span className="text-red-500 ml-1">*</span>
                    <span className="ml-2 text-xs text-gray-500 font-normal">(최소 30자)</span>
                  </h3>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="작성예시) 안녕하세요. 10년 경력의 심리상담 전문가입니다.
공감적이고 따뜻한 분위기에서 내담자의 이야기를 경청하며,
실질적인 문제 해결을 돕고 있습니다."
                  />
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {formData.bio.length} / 최소 30자
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* MBTI & 상담 스타일 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" /> MBTI & 상담 스타일
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">MBTI</label>
                <select
                  value={formData.mbti}
                  onChange={(e) => handleInputChange('mbti', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택</option>
                  <option value="INTJ">INTJ</option>
                  <option value="INTP">INTP</option>
                  <option value="ENTJ">ENTJ</option>
                  <option value="ENTP">ENTP</option>
                  <option value="INFJ">INFJ</option>
                  <option value="INFP">INFP</option>
                  <option value="ENFJ">ENFJ</option>
                  <option value="ENFP">ENFP</option>
                  <option value="ISTJ">ISTJ</option>
                  <option value="ISFJ">ISFJ</option>
                  <option value="ESTJ">ESTJ</option>
                  <option value="ESFJ">ESFJ</option>
                  <option value="ISTP">ISTP</option>
                  <option value="ISFP">ISFP</option>
                  <option value="ESTP">ESTP</option>
                  <option value="ESFP">ESFP</option>
                </select>
              </div>

              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">상담 스타일</label>
                <input
                  type="text"
                  value={formData.consultationStyle}
                  onChange={(e) => handleInputChange('consultationStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 따뜻하고 공감적인 태도로 내담자의 감정을 경청하며 상담합니다"
                />
              </div>
            </div>
          </div>

          {/* 경력사항 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" /> 경력사항
              </h3>
              <button
                onClick={addWorkExperience}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                추가
              </button>
            </div>

            <div className="space-y-4">
              {formData.workExperience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  {formData.workExperience.length > 1 && (
                    <button
                      onClick={() => removeWorkExperience(index)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr] gap-3 pr-10">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="회사명"
                    />
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="직책"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => updateWorkExperience(index, 'period', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="기간 (예: 2020.01 ~ 2023.12 또는 2020.01 ~ 현재)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 학력 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" /> 학력
              </h3>
              <button
                onClick={addEducation}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                추가
              </button>
            </div>

            <div className="space-y-4">
              {formData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  {formData.education.length > 1 && (
                    <button
                      onClick={() => removeEducation(index)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-10">
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="학교명"
                    />
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => updateEducation(index, 'major', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="전공"
                    />
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="학위 (예: 학사, 석사)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 일정 및 설정 탭 (Step3-2 스타일) */}
      {activeTab === 'schedule' && (
        <>
          {/* 자격증 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center">
                <Award className="w-4 h-4 mr-2" /> 자격증
              </h3>
              <button
                onClick={addCertification}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                추가
              </button>
            </div>

            <div className="space-y-4">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  {formData.certifications.length > 1 && (
                    <button
                      onClick={() => removeCertification(index)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-10">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="자격증명"
                    />
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="발급기관"
                    />
                    <input
                      type="text"
                      value={cert.year}
                      onChange={(e) => updateCertification(index, 'year', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="발급년도"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 자격증 및 포트폴리오 이미지 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" /> 자격증 및 포트폴리오 이미지
              <span className="ml-2 text-xs text-gray-500 font-normal">(최대 5개, 선택사항)</span>
            </h3>

            {/* 업로드된 이미지 미리보기 */}
            {formData.portfolioPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {formData.portfolioPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`포트폴리오 ${index + 1}`}
                      className="w-full h-auto object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removePortfolio(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 드래그 앤 드롭 영역 - 파일 없을 때만 대형 영역 표시 */}
            {formData.portfolioPreviews.length === 0 && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <input
                  type="file"
                  id="portfolioUpload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePortfolioUpload}
                />
                <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <label
                  htmlFor="portfolioUpload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mb-2"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> 파일 선택
                </label>
                <p className="text-sm text-gray-600 mb-1">
                  또는 여기로 이미지를 드래그하세요
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG 파일 (각 최대 5MB)
                </p>
              </div>
            )}

            {/* 컴팩트 업로드 버튼 - 파일 1-4개일 때 표시 */}
            {formData.portfolioPreviews.length > 0 && formData.portfolioPreviews.length < 5 && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-lg transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                aria-label={`이미지 추가 영역, ${5 - formData.portfolioPreviews.length}개 더 업로드 가능`}
              >
                <input
                  type="file"
                  id="portfolioUploadCompact"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePortfolioUpload}
                />

                <Upload className={`w-5 h-5 flex-shrink-0 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />

                <label
                  htmlFor="portfolioUploadCompact"
                  className="flex-1 cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-700">
                    이미지 추가 ({5 - formData.portfolioPreviews.length}개 더 가능)
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    또는 여기로 드래그
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 제공 가능한 상담유형 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-4 h-4 mr-2" /> 제공 가능한 상담유형
              <span className="text-red-500 ml-1">*</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => toggleConsultationType('voice')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  formData.consultationTypes.includes('voice')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Phone className={`w-6 h-6 ${formData.consultationTypes.includes('voice') ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.consultationTypes.includes('voice') ? 'text-blue-900' : 'text-gray-900'}`}>
                  음성 통화
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleConsultationType('chat')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  formData.consultationTypes.includes('chat')
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <MessageCircle className={`w-6 h-6 ${formData.consultationTypes.includes('chat') ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.consultationTypes.includes('chat') ? 'text-green-900' : 'text-gray-900'}`}>
                  채팅 상담
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleConsultationType('video')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  formData.consultationTypes.includes('video')
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <Video className={`w-6 h-6 ${formData.consultationTypes.includes('video') ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData.consultationTypes.includes('video') ? 'text-purple-900' : 'text-gray-900'}`}>
                  화상 상담
                </span>
              </button>
            </div>
          </div>

          {/* 예약 가능 시간 설정 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <AvailabilityScheduleEditor
              initialSlots={formData.availabilitySlots}
              initialHolidaySettings={formData.holidaySettings}
              initialRestTimeSettings={formData.restTimeSettings}
              onChange={handleAvailabilityChange}
            />
          </div>

          {/* 소셜 링크 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-4 h-4 mr-2" /> 소셜 링크
              <span className="ml-2 text-xs text-gray-500 font-normal">(선택사항)</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  placeholder="웹사이트 주소 (예: https://example.com)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-500 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  placeholder="Instagram 사용자명 (예: @username)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
                <input
                  type="url"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  placeholder="YouTube 채널 URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="LinkedIn 프로필 URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="url"
                  value={formData.socialLinks.blog}
                  onChange={(e) => handleSocialLinkChange('blog', e.target.value)}
                  placeholder="블로그 URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Photo Studio Modal */}
      <AiPhotoStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        onPhotoUpdate={(avatarUrl: string) => {
          handleInputChange('profileImage', avatarUrl);
          setIsAiStudioOpen(false);
        }}
        specialty={formData.specialty}
      />
    </div>
  );
});

ExpertProfileEdit.displayName = 'ExpertProfileEdit';

export default ExpertProfileEdit;
