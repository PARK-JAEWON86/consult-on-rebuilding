"use client";

import { useState, useEffect } from "react";
import { X, Hash, HelpCircle, Star, Award, MessageSquare } from "lucide-react";

interface PostData {
  title: string;
  content: string;
  category: string;
  postType: string;
  tags: string[];
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: PostData) => void;
}

const CreatePostModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreatePostModalProps) => {
  const [formData, setFormData] = useState<PostData>({
    title: "",
    content: "",
    category: "",
    postType: "general",
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileVisibility, setProfileVisibility] = useState<"public" | "experts" | "private">("experts");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // 프로필 정보 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoadingProfile(true);
        const response = await fetch('/api/profile');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProfileVisibility(result.data.profileVisibility || "experts");
          }
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [isOpen]);

  const [categories, setCategories] = useState([
    { value: "consultation", label: "상담요청" },
    { value: "review", label: "후기" },
    { value: "question", label: "질문" },
    { value: "tip", label: "팁" },
    { value: "discussion", label: "토론" },
  ]);

  // 게시글 타입 옵션
  const postTypeOptions = [
    { 
      id: "general", 
      name: "일반글", 
      icon: MessageSquare, 
      color: "text-gray-600", 
      bgColor: "bg-gray-100", 
      hoverColor: "hover:bg-gray-200",
      description: "자유로운 주제의 일반적인 글"
    },
    { 
      id: "consultation_request", 
      name: "상담요청", 
      icon: HelpCircle, 
      color: "text-orange-600", 
      bgColor: "bg-orange-100", 
      hoverColor: "hover:bg-orange-200",
      description: "전문가에게 상담을 요청하는 글"
    },
    { 
      id: "consultation_review", 
      name: "상담후기", 
      icon: Star, 
      color: "text-green-600", 
      bgColor: "bg-green-100", 
      hoverColor: "hover:bg-green-200",
      description: "상담 경험에 대한 후기나 리뷰"
    },
    { 
      id: "expert_intro", 
      name: "전문가소개", 
      icon: Award, 
      color: "text-blue-600", 
      bgColor: "bg-blue-100", 
      hoverColor: "hover:bg-blue-200",
      description: "전문가가 자신을 소개하는 글"
    },
  ];

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories?activeOnly=true');
        const result = await response.json();
        
        if (result.success) {
          const transformedCategories = result.data.map((cat: any) => ({
            value: cat.id.toString(),
            label: cat.name
          }));
          setCategories(transformedCategories);
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };

    loadCategories();
  }, []);

  const handleInputChange = (
    field: keyof PostData,
    value: string | string[],
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
      newErrors.content = "내용을 입력해주세요.";
    }

    if (!formData.category) {
      newErrors.category = "카테고리를 선택해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const postData = {
      ...formData,
      tags: formData.tags.map((tag) => tag.trim()).filter((tag) => tag),
    };

    onSubmit && onSubmit(postData);
    setFormData({ title: "", content: "", category: "", postType: "general", tags: [] });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setFormData({ title: "", content: "", category: "", postType: "general", tags: [] });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">새 게시글 작성</h2>
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
          className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          {/* 프로필 공개설정 안내 */}
          {profileVisibility !== "public" && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <span className="text-sm font-medium">
                  {profileVisibility === "experts" 
                    ? "전문가만 설정: 일반 사용자에게는 이름이 마스킹 처리됩니다."
                    : "비공개 설정: 모든 사용자에게 이름이 마스킹 처리됩니다."
                  }
                </span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                예시: 김* (김철수 → 김*)
              </p>
            </div>
          )}

          {/* 게시글 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              게시글 타입 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {postTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.postType === option.id;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleInputChange("postType", option.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? `${option.bgColor} ${option.color} border-current shadow-md`
                        : `bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:shadow-sm`
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className={`h-5 w-5 ${isSelected ? option.color : "text-gray-400"}`} />
                      <span className={`font-medium text-sm ${isSelected ? option.color : "text-gray-700"}`}>
                        {option.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={8}
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="게시글 내용을 입력하세요"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={formData.tags.join(", ")}
                onChange={(e) =>
                  handleInputChange(
                    "tags",
                    e.target.value.split(",").map((tag) => tag.trim()),
                  )
                }
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 상담후기, 스트레스관리)"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              태그는 다른 사용자들이 게시글을 찾는데 도움이 됩니다.
            </p>
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
            게시하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
