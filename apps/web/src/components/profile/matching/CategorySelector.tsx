'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Target,
  Brain,
  DollarSign,
  Scale,
  BookOpen,
  Heart,
  Users,
  Briefcase,
  Code,
  Palette,
  Languages,
  Music,
  Plane,
  Scissors,
  Trophy,
  Sprout,
  TrendingUp,
  Video,
  Star,
  ShoppingBag,
  ChefHat,
  PawPrint,
  Building2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Category {
  id: number;
  slug: string;
  nameKo: string;
  nameEn: string | null;
  icon: string | null;
  description: string | null;
}

interface CategorySelectorProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  maxSelection?: number;
}

// 아이콘 매핑
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return Target;

  const iconMap: { [key: string]: any } = {
    Target, Brain, DollarSign, Scale, BookOpen, Heart, Users, Briefcase,
    Code, Palette, Languages, Music, Plane, Scissors, Trophy, Sprout,
    TrendingUp, Video, Star, ShoppingBag, ChefHat, PawPrint, Building2, GraduationCap,
  };

  return iconMap[iconName] || Target;
};

export default function CategorySelector({ selected, onChange, maxSelection = 3 }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories?activeOnly=true');
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter(s => s !== slug));
    } else {
      if (selected.length < maxSelection) {
        onChange([...selected, slug]);
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // 표시할 카테고리 결정 (상위 8개 또는 전체)
  const displayedCategories = showAll ? categories : categories.slice(0, 8);
  const hasMore = categories.length > 8;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayedCategories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          const isSelected = selected.includes(category.slug);
          const isDisabled = !isSelected && selected.length >= maxSelection;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleToggle(category.slug)}
              disabled={isDisabled}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 border-2 ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : isDisabled
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <IconComponent className={`h-5 w-5 mr-2 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="text-sm">{category.nameKo}</span>
            </button>
          );
        })}
      </div>

      {/* 더보기/접기 버튼 */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              더보기 ({categories.length - 8}개 더 있음)
            </>
          )}
        </button>
      )}

      {selected.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          선택됨: {selected.length} / {maxSelection}
          {' - '}
          {selected.map(slug => {
            const category = categories.find(c => c.slug === slug);
            return category?.nameKo;
          }).join(', ')}
        </div>
      )}
    </div>
  );
}
