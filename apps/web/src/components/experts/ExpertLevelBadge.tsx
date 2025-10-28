"use client";

import { useState, useEffect } from "react";

interface ExpertLevelBadgeProps {
  expertId: string;
  size?: 'sm' | 'md' | 'lg' | 'like';
  className?: string;
  level?: number; // 백엔드에서 이미 계산된 레벨 (있으면 API 호출 생략)
  tierInfo?: any; // 백엔드에서 제공하는 티어 정보 (선택적)
}

interface LevelData {
  currentLevel: number;
  levelTitle: string;
  levelProgress: {
    current: number;
    next: number;
    percentage: number;
  };
}

export default function ExpertLevelBadge({
  expertId,
  size = 'md',
  className = '',
  level: providedLevel,
  tierInfo: providedTierInfo
}: ExpertLevelBadgeProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🎯 백엔드 레벨 데이터 필수 - API 폴백 제거
    if (providedLevel) {
      console.log('✅ [ExpertLevelBadge] Using backend level data:', {
        expertId,
        level: providedLevel,
        tierName: providedTierInfo?.name,
        source: 'BACKEND_ONLY'
      });

      setLevelData({
        currentLevel: providedLevel,
        levelTitle: providedTierInfo?.name || `Lv.${providedLevel}`,
        levelProgress: {
          current: providedLevel,
          next: providedLevel + 1,
          percentage: 0
        }
      });
      setIsLoading(false);
      return;
    }

    // 백엔드 데이터 누락 시 Lv.1로 표시 (API 폴백 제거)
    console.error('❌ [ExpertLevelBadge] 백엔드 레벨 데이터 누락 - Lv.1 표시:', {
      expertId,
      message: '모든 전문가는 백엔드에서 calculatedLevel을 제공해야 합니다',
      action: 'experts.service.ts의 레벨 계산 로직 확인 필요'
    });

    setLevelData({
      currentLevel: 1,
      levelTitle: "Iron (아이언)",
      levelProgress: {
        current: 1,
        next: 2,
        percentage: 0
      }
    });
    setIsLoading(false);
  }, [expertId, providedLevel, providedTierInfo]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full ${getSizeClasses(size)} ${className}`} />
    );
  }

  if (!levelData) {
    return null;
  }

  const { currentLevel, levelTitle } = levelData;
  const bgColor = getLevelBackgroundColor(currentLevel);
  const sizeClasses = getSizeClasses(size);

  return (
    <div className={`relative ${className}`}>
      {/* 레벨 배지 */}
      <div
        className={`${bgColor} ${sizeClasses} ${size === 'like' ? 'rounded-full border border-white shadow-sm' : 'border-2 border-white rounded-full shadow-sm'} flex items-center justify-center text-white font-bold ${getTextSize(size)}`}
        title={`${levelTitle} - 레벨 ${currentLevel}`}
      >
        Lv.{currentLevel}
      </div>
    </div>
  );
}

function getLevelBackgroundColor(level: number): string {
  // 전문가 레벨 API의 티어 체계에 맞춰 색상 결정 (그라데이션 제거)
  if (level >= 900) return 'bg-red-500'; // Tier 10 (Lv.900+)
  if (level >= 800) return 'bg-purple-500'; // Tier 9-10
  if (level >= 600) return 'bg-indigo-500'; // Tier 7-8
  if (level >= 400) return 'bg-blue-500'; // Tier 5-6
  if (level >= 200) return 'bg-cyan-500'; // Tier 3-4
  if (level >= 100) return 'bg-teal-500'; // Tier 2
  return 'bg-green-500'; // Tier 1
}

function getSizeClasses(size: 'sm' | 'md' | 'lg' | 'like'): string {
  switch (size) {
    case 'sm':
      return 'w-12 h-6 px-2';
    case 'md':
      return 'w-14 h-6 px-3';
    case 'lg':
      return 'w-16 h-8 px-4';
    case 'like':
      return 'px-3 py-1.5';
    default:
      return 'w-14 h-6 px-3';
  }
}

function getTextSize(size: 'sm' | 'md' | 'lg' | 'like'): string {
  switch (size) {
    case 'sm':
      return 'text-[8px]';
    case 'md':
      return 'text-[10px]';
    case 'lg':
      return 'text-xs';
    case 'like':
      return 'text-sm';
    default:
      return 'text-[10px]';
  }
}
