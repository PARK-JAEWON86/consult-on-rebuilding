"use client";

import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

interface ExpertLevelBadgeProps {
  expertId: string;
  size?: 'sm' | 'md' | 'lg' | 'like';
}

interface LevelInfo {
  name: string;
  levelRange: { min: number; max: number };
  creditsPerMinute: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export default function ExpertLevelBadge({ expertId, size = 'md' }: ExpertLevelBadgeProps) {
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [koreanName, setKoreanName] = useState<string>('');

  useEffect(() => {
    const loadLevelInfo = async () => {
      try {
        const response = await fetch(`/api/expert-levels?action=getExpertLevel&expertId=${expertId}`);
        const data = await response.json();

        if (data.success) {
          setLevelInfo(data.levelInfo);
          setKoreanName(data.koreanName || data.levelInfo.name);
        }
      } catch (error) {
        console.error('레벨 정보 로드 실패:', error);
        // 기본값 설정
        setLevelInfo({
          name: "Tier 1 (Lv.1-99)",
          levelRange: { min: 1, max: 99 },
          creditsPerMinute: 100,
          color: "from-orange-500 to-red-600",
          bgColor: "bg-gradient-to-r from-orange-100 to-red-100",
          textColor: "text-orange-700",
          borderColor: "border-orange-500",
        });
        setKoreanName("브론즈");
      }
    };

    loadLevelInfo();
  }, [expertId]);

  if (!levelInfo) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    like: 'px-3 py-1.5 text-sm'
  };

  return (
    <div className={`inline-flex items-center rounded-full font-medium border ${levelInfo.borderColor} ${levelInfo.bgColor} ${levelInfo.textColor} ${sizeClasses[size]}`}>
      <Crown className="h-4 w-4 mr-1" />
      <span>{koreanName}</span>
    </div>
  );
}