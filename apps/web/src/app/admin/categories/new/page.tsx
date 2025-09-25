'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

interface CategoryFormData {
  slug: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  description: string;
  order: number;
  isActive: boolean;
}

interface CategoryFormErrors {
  slug?: string;
  nameKo?: string;
  nameEn?: string;
  icon?: string;
  description?: string;
  order?: string;
  isActive?: string;
}

export default function NewCategoryPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CategoryFormData>({
    slug: '',
    nameKo: '',
    nameEn: '',
    icon: '',
    description: '',
    order: 0,
    isActive: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CategoryFormErrors>({});

  // 권한 확인
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.roles?.includes('ADMIN'))) {
      router.push('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // 슬러그 자동 생성
  const generateSlug = (nameKo: string) => {
    return nameKo
      .toLowerCase()
      .replace(/[^가-힣a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[가-힣]/g, (char) => {
        const map: { [key: string]: string } = {
          '가': 'ga', '나': 'na', '다': 'da', '라': 'ra', '매': 'ma',
          '바': 'ba', '사': 'sa', '아': 'a', '자': 'ja', '차': 'cha',
          '카': 'ka', '타': 'ta', '파': 'pa', '하': 'ha',
          '법': 'law', '세': 'tax', '노': 'labor', '개': 'dev',
          '디': 'design', '마': 'marketing', '재': 'finance',
          '창': 'startup', '영': 'sales', '인': 'hr', '교': 'edu',
          '번': 'translation', '음': 'music', '예': 'art', '비': 'video',
          '건': 'health', '반': 'pet', '여': 'travel', '요': 'cooking',
          '뷰': 'beauty', '부': 'realestate', '육': 'parenting',
          '커': 'career', '상': 'product', '리': 'research', '심': 'mindset'
        };
        return map[char] || char;
      });
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // 슬러그 자동 생성
    if (field === 'nameKo' && typeof value === 'string') {
      const slug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CategoryFormErrors = {};

    if (!formData.slug.trim()) {
      newErrors.slug = '슬러그는 필수입니다';
    } else if (!/^[a-z0-9-]{2,40}$/.test(formData.slug)) {
      newErrors.slug = '슬러그는 2-40자의 영문 소문자, 숫자, 하이픈만 허용됩니다';
    }

    if (!formData.nameKo.trim()) {
      newErrors.nameKo = '한국어 이름은 필수입니다';
    } else if (formData.nameKo.length > 100) {
      newErrors.nameKo = '한국어 이름은 100자 이하여야 합니다';
    }

    if (formData.nameEn && formData.nameEn.length > 100) {
      newErrors.nameEn = '영어 이름은 100자 이하여야 합니다';
    }

    if (formData.icon && formData.icon.length > 50) {
      newErrors.icon = '아이콘은 50자 이하여야 합니다';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '설명은 500자 이하여야 합니다';
    }

    if (formData.order < 0) {
      newErrors.order = '순서는 0 이상이어야 합니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/v1/categories/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create category');
      }

      const data = await response.json();
      
      if (data.success) {
        alert('카테고리가 성공적으로 생성되었습니다.');
        router.push('/admin/categories');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert(`카테고리 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.roles?.includes('ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">새 카테고리</h1>
              <p className="mt-2 text-gray-600">새로운 전문가 카테고리를 생성합니다</p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 한국어 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  한국어 이름 *
                </label>
                <input
                  type="text"
                  value={formData.nameKo}
                  onChange={(e) => handleInputChange('nameKo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nameKo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="예: 법률"
                />
                {errors.nameKo && (
                  <p className="mt-1 text-sm text-red-600">{errors.nameKo}</p>
                )}
              </div>

              {/* 영어 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영어 이름
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nameEn ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="예: Law"
                />
                {errors.nameEn && (
                  <p className="mt-1 text-sm text-red-600">{errors.nameEn}</p>
                )}
              </div>

              {/* 슬러그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  슬러그 *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.slug ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="예: law"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  URL에 사용되는 고유 식별자입니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
                </p>
              </div>

              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아이콘
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.icon ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="예: Scale"
                />
                {errors.icon && (
                  <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Lucide 아이콘 이름을 입력하세요.
                </p>
              </div>

              {/* 순서 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬 순서
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.order ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.order && (
                  <p className="mt-1 text-sm text-red-600">{errors.order}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  작은 숫자가 먼저 표시됩니다.
                </p>
              </div>

              {/* 활성 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    활성 (사용자에게 표시됨)
                  </span>
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="카테고리에 대한 간단한 설명을 입력하세요"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    생성 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    생성
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
