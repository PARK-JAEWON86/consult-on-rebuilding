"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  User,
  MapPin,
  Globe,
  Phone,
  Mail,
  Plus,
  Trash2,
  Upload,
  Save,
  Edit3,
  Clock,
  Award,
  Star,
  Users,
  Calendar,
  MessageCircle,
  Video,
  CheckCircle,
  FileText,
  X,
  Download,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
  ArrowLeft
} from "lucide-react";

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
  creditsPerMinute?: number;
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

interface ExpertProfileProps {
  expertData: Partial<ExpertProfileData>;
  onSave: (data: ExpertProfileData & { isProfileComplete: boolean }) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onBack?: () => void;
}

const ExpertProfile = forwardRef<any, ExpertProfileProps>(({
  expertData,
  onSave,
  isEditing,
  onEditingChange,
  onBack
}, ref) => {
  const [formData, setFormData] = useState<ExpertProfileData>({
    name: "",
    specialty: "",
    experience: 0,
    description: "",
    education: [""],
    certifications: [{ name: "", issuer: "" }],
    specialties: [""],
    consultationTypes: [],
    languages: ["한국어"],
    hourlyRate: 0,
    creditsPerMinute: 0,
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
      email: "",
      location: "",
      website: ""
    },
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      instagram: "",
      facebook: "",
      youtube: ""
    },
    profileImage: null,
    portfolioFiles: [],
  });

  // 데이터 초기화
  useEffect(() => {
    if (expertData) {
      setFormData(prev => ({
        ...prev,
        ...expertData,
        // 소셜 링크 데이터 초기화
        socialLinks: {
          linkedin: expertData.socialLinks?.linkedin || '',
          github: expertData.socialLinks?.github || '',
          twitter: expertData.socialLinks?.twitter || '',
          instagram: expertData.socialLinks?.instagram || '',
          facebook: expertData.socialLinks?.facebook || '',
          youtube: expertData.socialLinks?.youtube || '',
        },
        // 포트폴리오 파일 데이터 초기화
        portfolioFiles: expertData.portfolioFiles || []
      }));
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

    // 프로필 완성도 체크
    const isComplete = Boolean(
      formData.name.trim() &&
      formData.specialty.trim() &&
      formData.description.trim() &&
      Number(formData.experience) > 0 &&
      formData.education.some(edu => edu.trim()) &&
      formData.specialties.some(spec => spec.trim()) &&
      formData.consultationTypes.length > 0
    );

    onSave({
      ...formData,
      isProfileComplete: isComplete
    });
  };

  const handleInputChange = (field: keyof ExpertProfileData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayAdd = (field: keyof ExpertProfileData, newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), newItem]
    }));
  };

  const handleArrayRemove = (field: keyof ExpertProfileData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const handleArrayUpdate = (field: keyof ExpertProfileData, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  };

  const weekDays = [
    { key: "monday", label: "월요일" },
    { key: "tuesday", label: "화요일" },
    { key: "wednesday", label: "수요일" },
    { key: "thursday", label: "목요일" },
    { key: "friday", label: "금요일" },
    { key: "saturday", label: "토요일" },
    { key: "sunday", label: "일요일" },
  ];

  const consultationTypeOptions = [
    { value: "video", label: "화상 상담", icon: Video },
    { value: "chat", label: "채팅 상담", icon: MessageCircle },
    { value: "voice", label: "음성 상담", icon: Phone },
  ];

  // 파일 업로드 핸들러
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`파일 크기가 너무 큽니다: ${file.name} (최대 10MB)`);
        return;
      }

      // 파일 타입 제한
      const allowedTypes = ['image/', 'application/pdf', 'text/', '.doc', '.docx', '.ppt', '.pptx'];
      const isAllowed = allowedTypes.some(type =>
        file.type.startsWith(type) || file.name.toLowerCase().includes(type.replace('.', ''))
      );

      if (!isAllowed) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: PortfolioFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: e.target?.result as string
        };

        setFormData(prev => ({
          ...prev,
          portfolioFiles: [...prev.portfolioFiles, newFile]
        }));
      };
      reader.readAsDataURL(file);
    });

    // 파일 입력 초기화
    event.target.value = '';
  };

  const handleFileRemove = (fileId: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioFiles: prev.portfolioFiles.filter(file => file.id !== fileId)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return Linkedin;
      case 'github': return Github;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'youtube': return Youtube;
      default: return Globe;
    }
  };

  if (!isEditing) {
    // 읽기 전용 모드
    return (
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-6 mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{formData.name}</h2>
              <p className="text-xl text-gray-600 mb-3">{formData.specialty}</p>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="ml-1 font-semibold">{formData.avgRating}</span>
                  <span className="ml-1 text-gray-500">({formData.reviewCount} 리뷰)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Award className="h-5 w-5 mr-1" />
                  {formData.experience}년 경력
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.filter(spec => spec.trim()).map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 소개 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">소개</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {formData.description || "소개글이 없습니다."}
          </p>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{formData.totalSessions}</div>
            <div className="text-sm text-gray-500">총 상담 횟수</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{formData.completionRate}%</div>
            <div className="text-sm text-gray-500">완료율</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{formData.responseTime}</div>
            <div className="text-sm text-gray-500">평균 응답 시간</div>
          </div>
        </div>
      </div>
    );
  }

  // 편집 모드
  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {onBack && (
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </button>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <User className="h-5 w-5 mr-2" />
          기본 정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="전문가 이름을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전문 분야 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 법률, 심리, 경영 등"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">경력 (년)</label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분당 크레딧 <span className="text-blue-600 text-xs">(자동 계산)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.creditsPerMinute || 0}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center text-xs text-gray-500">
                  <span>크레딧</span>
                </div>
              </div>
            </div>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">크레딧은 전문가 레벨과 실적을 기반으로 자동 계산됩니다</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li>총 상담 세션: {formData.totalSessions || 0}회</li>
                    <li>평점: {formData.avgRating || 0}점</li>
                    <li>완료율: {formData.completionRate || 0}%</li>
                    <li>시간당 요금: {((formData.creditsPerMinute || 0) * 60).toLocaleString()} 크레딧</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">소개</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="자신을 소개하는 글을 작성하세요"
          />
        </div>
      </div>

      {/* 학력 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            학력
          </h3>
          <button
            onClick={() => handleArrayAdd('education', '')}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </button>
        </div>

        <div className="space-y-3">
          {formData.education.map((edu, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={edu}
                onChange={(e) => handleArrayUpdate('education', index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="학교명 및 전공을 입력하세요"
              />
              {formData.education.length > 1 && (
                <button
                  onClick={() => handleArrayRemove('education', index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 자격증 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            자격증
          </h3>
          <button
            onClick={() => handleArrayAdd('certifications', { name: '', issuer: '' })}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </button>
        </div>

        <div className="space-y-4">
          {formData.certifications.map((cert, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={cert.name}
                onChange={(e) => handleArrayUpdate('certifications', index, { ...cert, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="자격증명"
              />
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => handleArrayUpdate('certifications', index, { ...cert, issuer: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="발급기관"
                />
                {formData.certifications.length > 1 && (
                  <button
                    onClick={() => handleArrayRemove('certifications', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 전문 영역 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">전문 영역</h3>
          <button
            onClick={() => handleArrayAdd('specialties', '')}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </button>
        </div>

        <div className="space-y-3">
          {formData.specialties.map((specialty, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                value={specialty}
                onChange={(e) => handleArrayUpdate('specialties', index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="전문 영역을 입력하세요"
              />
              {formData.specialties.length > 1 && (
                <button
                  onClick={() => handleArrayRemove('specialties', index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 상담 방식 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">상담 방식</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {consultationTypeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consultationTypes.includes(option.value as ConsultationType)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('consultationTypes', [...formData.consultationTypes, option.value]);
                    } else {
                      handleInputChange('consultationTypes', formData.consultationTypes.filter(type => type !== option.value));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Icon className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          연락처 정보
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              이메일
            </label>
            <input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              전화번호
            </label>
            <input
              type="tel"
              value={formData.contactInfo.phone}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              지역
            </label>
            <input
              type="text"
              value={formData.contactInfo.location}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 서울특별시 강남구"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              웹사이트
            </label>
            <input
              type="url"
              value={formData.contactInfo.website}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* 상담 가능 시간 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          상담 가능 시간
        </h3>

        <div className="space-y-4">
          {weekDays.map((day) => (
            <div key={day.key} className="flex items-center space-x-4">
              <div className="w-20">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.availability[day.key as keyof Availability]?.available || false}
                    onChange={(e) => {
                      handleInputChange('availability', {
                        ...formData.availability,
                        [day.key]: {
                          ...formData.availability[day.key as keyof Availability],
                          available: e.target.checked
                        }
                      });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{day.label}</span>
                </label>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={formData.availability[day.key as keyof Availability]?.hours || "09:00-18:00"}
                  onChange={(e) => {
                    handleInputChange('availability', {
                      ...formData.availability,
                      [day.key]: {
                        ...formData.availability[day.key as keyof Availability],
                        hours: e.target.value
                      }
                    });
                  }}
                  disabled={!formData.availability[day.key as keyof Availability]?.available}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="09:00-18:00"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 추가 설정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">추가 설정</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">응답 시간</label>
            <select
              value={formData.responseTime}
              onChange={(e) => handleInputChange('responseTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="즉시">즉시</option>
              <option value="30분 내">30분 내</option>
              <option value="1시간 내">1시간 내</option>
              <option value="2시간 내">2시간 내</option>
              <option value="6시간 내">6시간 내</option>
              <option value="12시간 내">12시간 내</option>
              <option value="24시간 내">24시간 내</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">취소 정책</label>
            <textarea
              value={formData.cancellationPolicy}
              onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="상담 취소 및 환불에 대한 정책을 입력하세요"
            />
          </div>
        </div>
      </div>

      {/* 소셜 링크 관리 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <ExternalLink className="h-5 w-5 mr-2" />
          소셜 링크
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries({
            linkedin: { label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname', icon: Linkedin },
            github: { label: 'GitHub', placeholder: 'https://github.com/yourname', icon: Github },
            twitter: { label: 'Twitter', placeholder: 'https://twitter.com/yourname', icon: Twitter },
            instagram: { label: 'Instagram', placeholder: 'https://instagram.com/yourname', icon: Instagram },
            facebook: { label: 'Facebook', placeholder: 'https://facebook.com/yourname', icon: Facebook },
            youtube: { label: 'YouTube', placeholder: 'https://youtube.com/@yourname', icon: Youtube }
          }).map(([key, config]) => {
            const IconComponent = config.icon;
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <IconComponent className="h-4 w-4 mr-2" />
                  {config.label}
                </label>
                <input
                  type="url"
                  value={formData.socialLinks?.[key as keyof typeof formData.socialLinks] || ''}
                  onChange={(e) => handleInputChange('socialLinks', {
                    ...formData.socialLinks,
                    [key]: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={config.placeholder}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 포트폴리오 파일 관리 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          포트폴리오 파일
        </h3>

        {/* 파일 업로드 영역 */}
        <div className="mb-6">
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-gray-500">
                이미지, PDF, DOC, PPT 파일 지원 (최대 10MB)
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* 업로드된 파일 목록 */}
        {formData.portfolioFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">업로드된 파일 ({formData.portfolioFiles.length})</h4>
            <div className="space-y-2">
              {formData.portfolioFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        // 파일 다운로드 기능
                        const link = document.createElement('a');
                        link.href = file.data;
                        link.download = file.name;
                        link.click();
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(file.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="삭제"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ExpertProfile.displayName = 'ExpertProfile';

export default ExpertProfile;