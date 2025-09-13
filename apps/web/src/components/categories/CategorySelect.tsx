'use client';

import { useState, useMemo } from 'react';
import { useCategoriesPublic } from '@/hooks/useCategories';
import { Category } from '@/lib/categories';
import { 
  Scale, 
  Receipt, 
  Users, 
  Code, 
  Palette, 
  TrendingUp, 
  DollarSign, 
  Rocket, 
  Briefcase, 
  UserCheck, 
  GraduationCap, 
  Languages, 
  Music, 
  Video, 
  Heart, 
  PawPrint, 
  Plane, 
  ChefHat, 
  Scissors, 
  Building2, 
  Baby, 
  Trophy, 
  ShoppingBag, 
  BookOpen, 
  Brain,
  Search,
  X
} from 'lucide-react';

// 아이콘 매핑
const ICONS: Record<string, any> = {
  Scale,
  Receipt,
  Users,
  Code,
  Palette,
  TrendingUp,
  DollarSign,
  Rocket,
  Briefcase,
  UserCheck,
  GraduationCap,
  Languages,
  Music,
  Video,
  Heart,
  PawPrint,
  Plane,
  ChefHat,
  Scissors,
  Building2,
  Baby,
  Trophy,
  ShoppingBag,
  BookOpen,
  Brain,
};

interface CategorySelectProps {
  value?: string[] | string;
  onChange: (value: string[] | string) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSearch?: boolean;
}

export default function CategorySelect({
  value,
  onChange,
  multiple = false,
  placeholder = '카테고리를 선택하세요',
  className = '',
  disabled = false,
  showSearch = true,
}: CategorySelectProps) {
  // value 기본값 설정
  const defaultValue = multiple ? [] : '';
  const currentValue = value !== undefined ? value : defaultValue;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: categories = [], isLoading, error } = useCategoriesPublic();

  // 검색 필터링
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    
    return categories.filter(category =>
      category.nameKo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // 선택된 카테고리들
  const selectedCategories = useMemo(() => {
    if (multiple) {
      const selectedSlugs = Array.isArray(currentValue) ? currentValue : [];
      return categories.filter(cat => selectedSlugs.includes(cat.slug));
    } else {
      const selectedSlug = typeof currentValue === 'string' ? currentValue : '';
      return categories.filter(cat => cat.slug === selectedSlug);
    }
  }, [categories, currentValue, multiple]);

  const handleSelect = (category: Category) => {
    if (multiple) {
      const selectedSlugs = Array.isArray(currentValue) ? currentValue : [];
      const newValue = selectedSlugs.includes(category.slug)
        ? selectedSlugs.filter(slug => slug !== category.slug)
        : [...selectedSlugs, category.slug];
      onChange(newValue);
    } else {
      onChange(category.slug);
      setIsOpen(false);
    }
  };

  const handleRemove = (categorySlug: string) => {
    if (multiple) {
      const selectedSlugs = Array.isArray(currentValue) ? currentValue : [];
      onChange(selectedSlugs.filter(slug => slug !== categorySlug));
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = ICONS[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  if (error) {
    return (
      <div className={`p-3 text-red-600 bg-red-50 rounded-md ${className}`}>
        카테고리를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 선택된 카테고리 표시 */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCategories.map(category => (
            <div
              key={category.slug}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {getIcon(category.icon)}
              <span>{category.nameKo}</span>
              {multiple && (
                <button
                  type="button"
                  onClick={() => handleRemove(category.slug)}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 드롭다운 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`
          w-full px-3 py-2 text-left border border-gray-300 rounded-md
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        aria-label={placeholder}
      >
        {isLoading ? (
          <span className="text-gray-500">로딩 중...</span>
        ) : (
          <span className={selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCategories.length > 0 
              ? multiple 
                ? `${selectedCategories.length}개 선택됨`
                : selectedCategories[0]?.nameKo
              : placeholder
            }
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* 검색 입력 */}
          {showSearch && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="카테고리 검색..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 카테고리 목록 */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-3 text-gray-500 text-center">
                {searchTerm ? '검색 결과가 없습니다' : '카테고리가 없습니다'}
              </div>
            ) : (
              filteredCategories.map(category => {
                const isSelected = multiple
                  ? Array.isArray(currentValue) && currentValue.includes(category.slug)
                  : currentValue === category.slug;

                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => handleSelect(category)}
                    className={`
                      w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3
                      ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    {getIcon(category.icon)}
                    <div className="flex-1">
                      <div className="font-medium">{category.nameKo}</div>
                      {category.nameEn && (
                        <div className="text-sm text-gray-500">{category.nameEn}</div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
