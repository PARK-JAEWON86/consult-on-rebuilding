"use client";

import { useState, useEffect } from "react";

interface ExpertLevelBadgeProps {
  expertId: string;
  size?: 'sm' | 'md' | 'lg' | 'like';
  className?: string;
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
  className = ''
}: ExpertLevelBadgeProps) {
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExpertLevel = async () => {
      try {
        setIsLoading(true);
        
        // 새로운 API를 통해 전문가 레벨 정보를 가져옴
        const response = await fetch(`/api/expert-levels?action=getExpertLevel&expertId=${expertId}`);
        const result = await response.json();
        
        if (result.currentLevel && result.levelTitle) {
          setLevelData(result);
        } else {
          // API에서 데이터를 가져올 수 없는 경우 기본 레벨 표시
          setLevelData({
            currentLevel: 1,
            levelTitle: "Tier 1 (Lv.1-99)",
            levelProgress: {
              current: 1,
              next: 2,
              percentage: 0
            }
          });
        }
      } catch (error) {
        console.error('전문가 레벨 로드 실패:', error);
        // 에러 발생 시 기본 레벨 표시
        setLevelData({
          currentLevel: 1,
          levelTitle: "Tier 1 (Lv.1-99)",
          levelProgress: {
            current: 1,
            next: 2,
            percentage: 0
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (expertId) {
      loadExpertLevel();
    }
  }, [expertId]);

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
      return 'w-8 h-6 px-1';
    case 'md':
      return 'w-10 h-6 px-2';
    case 'lg':
      return 'w-12 h-8 px-3';
    case 'like':
      return 'px-3 py-1.5';
    default:
      return 'w-10 h-6 px-2';
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
