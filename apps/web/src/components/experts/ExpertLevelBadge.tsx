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
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
        const response = await fetch(`${apiBaseUrl}/expert-levels?action=getExpertLevel&expertId=${expertId}`);

        if (!response.ok) {
          console.warn('레벨 정보 API 응답 오류:', response.status);
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // API 응답은 {success: true, data: {...}} 형태
        const data = result.success && result.data ? result.data : result;

        if (data.currentLevel && data.levelTitle) {
          setLevelData({
            currentLevel: data.currentLevel,
            levelTitle: data.levelTitle,
            levelProgress: data.levelProgress || {
              current: data.currentLevel,
              next: data.currentLevel + 1,
              percentage: 0
            }
          });
        } else {
          console.warn('불완전한 레벨 데이터:', { result, data });
          // API에서 데이터를 가져올 수 없는 경우 기본 레벨 표시
          setLevelData({
            currentLevel: 1,
            levelTitle: "Iron (아이언)",
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
