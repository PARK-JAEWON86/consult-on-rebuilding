"use client";

import { useState } from "react";
import {
  X,
  AlertCircle,
  Clock,
  Video,
  Users,
  MessageSquare,
} from "lucide-react";

interface FormData {
  title: string;
  content: string;
  urgency: string;
  preferredMethod: string;
  availableTime: string;
  tags: string[];
  isAnonymous: boolean;
}

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: FormData) => void;
}

const ConsultationRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
}: ConsultationRequestModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    urgency: "",
    preferredMethod: "",
    availableTime: "",
    tags: [],
    isAnonymous: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const urgencyOptions = [
    {
      value: "낮음",
      label: "낮음",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      value: "보통",
      label: "보통",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      value: "높음",
      label: "높음",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

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
      value: "채팅상담",
      label: "채팅상담",
      icon: MessageSquare,
      description: "텍스트 채팅",
    },
  ];

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[],
  ) => {
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

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.content.trim()) {
      newErrors.content = "상담 내용을 입력해주세요.";
    }

    if (!formData.urgency) {
      newErrors.urgency = "긴급도를 선택해주세요.";
    }

    if (!formData.preferredMethod) {
      newErrors.preferredMethod = "선호하는 상담 방식을 선택해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const requestData = {
      ...formData,
      category: "상담요청",
      isConsultationRequest: true,
      tags: formData.tags.filter((tag) => tag).concat(["상담요청"]), // 자동으로 상담요청 태그 추가
    };

    onSubmit && onSubmit(requestData);
    setFormData({
      title: "",
      content: "",
      urgency: "",
      preferredMethod: "",
      availableTime: "",
      tags: [],
      isAnonymous: false,
    });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: "",
      content: "",
      urgency: "",
      preferredMethod: "",
      availableTime: "",
      tags: [],
      isAnonymous: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">상담 요청하기</h2>
              <p className="text-sm text-gray-600">
                전문가가 직접 연락드려 상담을 도와드립니다
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

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="예: 직장 스트레스로 인한 불안감 해결 도움 요청"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 상담 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="상담받고 싶은 내용을 자세히 설명해주세요. 현재 상황, 어려움, 원하는 도움 등을 구체적으로 작성해주시면 더 적합한 전문가를 매칭해드릴 수 있습니다."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 긴급도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                긴급도 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {urgencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.urgency === option.value
                        ? `${option.bgColor} border-current ${option.color}`
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={(e) =>
                        handleInputChange("urgency", e.target.value)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        formData.urgency === option.value
                          ? `${option.color.replace(
                              "text",
                              "border",
                            )} ${option.color.replace("text", "bg")}`
                          : "border-gray-300"
                      }`}
                    />
                    <span
                      className={
                        formData.urgency === option.value
                          ? option.color
                          : "text-gray-700"
                      }
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.urgency && (
                <p className="mt-1 text-sm text-red-600">{errors.urgency}</p>
              )}
            </div>

            {/* 선호 상담 방식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선호 상담 방식 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {methodOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.preferredMethod === option.value
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredMethod"
                        value={option.value}
                        checked={formData.preferredMethod === option.value}
                        onChange={(e) =>
                          handleInputChange("preferredMethod", e.target.value)
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
              {errors.preferredMethod && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.preferredMethod}
                </p>
              )}
            </div>
          </div>

          {/* 선호 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              선호 상담 시간
            </label>
            <input
              type="text"
              value={formData.availableTime}
              onChange={(e) =>
                handleInputChange("availableTime", e.target.value)
              }
              placeholder="예: 평일 오후 2-6시, 주말 오전 가능"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              상담 가능한 시간대를 알려주시면 전문가 매칭에 도움이 됩니다.
            </p>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관련 태그
            </label>
            <input
              type="text"
              value={formData.tags.join(", ")}
              onChange={(e) =>
                handleInputChange(
                  "tags",
                  e.target.value.split(",").map((tag) => tag.trim()),
                )
              }
              placeholder="예: 스트레스, 불안감, 직장생활 (쉼표로 구분)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              상담 분야와 관련된 태그를 입력하면 적합한 전문가를 찾는데 도움이
              됩니다.
            </p>
          </div>

          {/* 익명 옵션 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) =>
                handleInputChange("isAnonymous", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
              익명으로 상담 요청하기
            </label>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-1">상담 진행 과정</h4>
                <ul className="space-y-1 text-xs">
                  <li>
                    • 상담 요청 후 24시간 내에 적합한 전문가가 연락드립니다
                  </li>
                  <li>• 전문가와 상담 일정 및 방식을 협의합니다</li>
                  <li>
                    • 개인정보는 안전하게 보호되며, 상담 목적으로만 사용됩니다
                  </li>
                </ul>
              </div>
            </div>
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
            상담 요청하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRequestModal;
