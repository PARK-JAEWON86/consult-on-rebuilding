"use client";

import { useState } from "react";
import {
  X,
  User,
  Star,
  Calendar,
  MessageSquare,
  Video,
  Users,
  Phone,
  CheckCircle,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ConsultationPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  urgency?: string;
  preferredMethod?: string;
  createdAt?: string;
}

interface FormData {
  message: string;
  proposedMethod: string;
  proposedTime: string;
  experience: string;
  credentials: string;
}

interface ExpertContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationPost?: ConsultationPost;
  onSubmit?: (data: FormData) => void;
}

const ExpertContactModal = ({
  isOpen,
  onClose,
  consultationPost,
  onSubmit,
}: ExpertContactModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    message: "",
    proposedMethod: "",
    proposedTime: "",
    experience: "",
    credentials: "",
  });

  const [currentExpert] = useState({
    id: 1,
    name: "김전문",
    avatar: "김",
    title: "심리상담 전문가",
    experience: "5년",
    rating: 4.8,
    reviewCount: 127,
    specialties: ["스트레스 관리", "불안감 치료", "직장 적응"],
    credentials: ["임상심리사 1급", "상담심리사 2급"],
    consultationCount: 340,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1: 제안서 작성, 2: 완료

  const methodOptions = [
    {
      value: "화상상담",
      label: "화상상담",
      icon: Video,
      description: "온라인 화상 통화",
    },
    {
      value: "대면상담",
      label: "대면상담",
      icon: Users,
      description: "직접 만나서 상담",
    },
    {
      value: "전화상담",
      label: "전화상담",
      icon: Phone,
      description: "전화 통화",
    },
    {
      value: "채팅상담",
      label: "채팅상담",
      icon: MessageSquare,
      description: "텍스트 채팅",
    },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 에러 클리어
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.message.trim()) {
      newErrors.message = "상담 제안 메시지를 입력해주세요.";
    }

    if (!formData.proposedMethod) {
      newErrors.proposedMethod = "제안하는 상담 방식을 선택해주세요.";
    }

    if (!formData.proposedTime.trim()) {
      newErrors.proposedTime = "제안하는 상담 시간을 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const proposalData = {
      expertId: currentExpert.id,
      expertName: currentExpert.name,
      consultationPostId: consultationPost?.id,
      ...formData,
      submittedAt: new Date().toISOString(),
    };

    onSubmit && onSubmit(proposalData);
    setStep(2);
  };

  const handleClose = () => {
    setFormData({
      message: "",
      proposedMethod: "",
      proposedTime: "",
      experience: "",
      credentials: "",
    });
    setErrors({});
    setStep(1);
    onClose();
  };

  const handleComplete = () => {
    handleClose();
  };

  if (!isOpen || !consultationPost) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {step === 1 ? "상담 제안하기" : "제안 완료"}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 1
                  ? "상담 요청자에게 전문적인 도움을 제안해보세요"
                  : "상담 제안이 성공적으로 전송되었습니다"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* 상담 요청 정보 */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">
                상담 요청 내용
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">
                  {consultationPost.title}
                </h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {consultationPost.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>긴급도: {consultationPost.urgency}</span>
                  <span>선호 방식: {consultationPost.preferredMethod}</span>
                  <span>작성자: {consultationPost.author}</span>
                </div>
              </div>
            </div>

            {/* 전문가 정보 */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">전문가 정보</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-medium">
                    {currentExpert.avatar}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {currentExpert.name}
                    </h4>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      전문가
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{currentExpert.title}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>
                        {currentExpert.rating} ({currentExpert.reviewCount}개
                        리뷰)
                      </span>
                    </div>
                    <span>경력 {currentExpert.experience}</span>
                    <span>상담 {currentExpert.consultationCount}회</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentExpert.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>자격증:</strong>{" "}
                    {currentExpert.credentials.join(", ")}
                  </div>
                </div>
              </div>
            </div>

            {/* 제안서 작성 폼 */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto max-h-[calc(50vh)]"
            >
              {/* 상담 제안 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담 제안 메시지 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="상담 요청자에게 보낼 메시지를 작성해주세요. 어떤 도움을 드릴 수 있는지, 상담 접근 방식 등을 설명해주세요."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.message ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 제안 상담 방식 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제안 상담 방식 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {methodOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.proposedMethod === option.value
                              ? "bg-blue-50 border-blue-500 text-blue-700"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="proposedMethod"
                            value={option.value}
                            checked={formData.proposedMethod === option.value}
                            onChange={(e) =>
                              handleInputChange(
                                "proposedMethod",
                                e.target.value,
                              )
                            }
                            className="sr-only"
                          />
                          <Icon className="h-5 w-5 mr-3" />
                          <div className="flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.proposedMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.proposedMethod}
                    </p>
                  )}
                </div>

                {/* 제안 상담 시간 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제안 상담 시간 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.proposedTime}
                    onChange={(e) =>
                      handleInputChange("proposedTime", e.target.value)
                    }
                    placeholder="예: 이번 주 화요일 오후 2시~4시 가능합니다. 다른 시간대도 협의 가능합니다."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.proposedTime ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.proposedTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.proposedTime}
                    </p>
                  )}
                </div>
              </div>

              {/* 관련 경험 (선택사항) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관련 경험 및 접근 방식 (선택사항)
                </label>
                <textarea
                  rows={3}
                  value={formData.experience}
                  onChange={(e) =>
                    handleInputChange("experience", e.target.value)
                  }
                  placeholder="관련 분야에서의 경험과 전문성을 간단히 설명해주세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 자격증 (선택사항) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  자격증 및 학력 (선택사항)
                </label>
                <textarea
                  rows={3}
                  value={formData.credentials}
                  onChange={(e) =>
                    handleInputChange("credentials", e.target.value)
                  }
                  placeholder="보유한 자격증, 학위, 수료 과정 등을 간단히 설명해주세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </form>

            {/* 푸터 */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                상담 제안 보내기
              </button>
            </div>
          </>
        ) : (
          /* 완료 단계 */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              상담 제안이 전송되었습니다
            </h3>
            <p className="text-gray-600 mb-6">
              상담 요청자에게 제안서가 전송되었습니다. 요청자가 수락하면 알림을
              받으실 수 있습니다.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">다음 단계</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• 상담 요청자가 제안을 검토합니다</li>
                <li>• 수락 시 연락처가 공유되어 직접 소통할 수 있습니다</li>
                <li>• 상담 일정과 세부사항을 협의하세요</li>
                <li>
                  • 프로필 &gt; 상담 관리에서 진행 상황을 확인할 수 있습니다
                </li>
              </ul>
            </div>
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertContactModal;
