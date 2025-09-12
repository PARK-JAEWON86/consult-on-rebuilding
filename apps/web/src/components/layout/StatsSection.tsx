"use client";

import { useEffect, useState } from "react";

interface PlatformStats {
  totalUsers: number;
  totalExperts: number;
  totalConsultations: number;
  averageConsultationRating: number;
  averageMatchingTimeMinutes: number;
  monthlyActiveUsers: number;
  monthlyActiveExperts: number;
  consultationCompletionRate: number;
  userSatisfactionScore: number;
  lastUpdated: string;
}

interface StatItem {
  id: string;
  value: string;
  targetNumber: number;
  suffix: string;
  label: string;
  description: string;
}

interface AnimatedNumberProps {
  targetNumber: number;
  suffix: string;
  isVisible: boolean;
  duration?: number;
}

function AnimatedNumber({ targetNumber, suffix, isVisible, duration = 2000 }: AnimatedNumberProps) {
  const [currentNumber, setCurrentNumber] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutCubic 함수로 부드러운 애니메이션
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOutCubic * targetNumber);
      
      setCurrentNumber(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, targetNumber, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
    }
    return num.toString();
  };

  return (
    <span>
      {formatNumber(currentNumber)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalExperts: 0,
    totalConsultations: 0,
    averageConsultationRating: 0,
    averageMatchingTimeMinutes: 0,
    monthlyActiveUsers: 0,
    monthlyActiveExperts: 0,
    consultationCompletionRate: 0,
    userSatisfactionScore: 0,
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    // 기본값으로 설정 (실제 API는 추후 구현)
    setPlatformStats({
      totalUsers: 1250,
      totalExperts: 85,
      totalConsultations: 3200,
      averageConsultationRating: 4.8,
      averageMatchingTimeMinutes: 15,
      monthlyActiveUsers: 450,
      monthlyActiveExperts: 65,
      consultationCompletionRate: 95,
      userSatisfactionScore: 4.7,
      lastUpdated: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("stats-section");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // 실제 데이터를 기반으로 stats 배열 생성
  const stats: StatItem[] = [
    {
      id: "consultations",
      value: platformStats.totalConsultations >= 1000 
        ? `${(platformStats.totalConsultations / 1000).toFixed(platformStats.totalConsultations % 1000 === 0 ? 0 : 1)}k+`
        : `${platformStats.totalConsultations}+`,
      targetNumber: platformStats.totalConsultations,
      suffix: "+",
      label: "상담완료",
      description: "이용자 수",
    },
    {
      id: "matching-time",
      value: `${platformStats.averageMatchingTimeMinutes}분`,
      targetNumber: platformStats.averageMatchingTimeMinutes,
      suffix: "분",
      label: "평균 매칭시간",
      description: "빠른 매칭",
    },
    {
      id: "experts",
      value: platformStats.totalExperts >= 1000 
        ? `${(platformStats.totalExperts / 1000).toFixed(platformStats.totalExperts % 1000 === 0 ? 0 : 1)}k+`
        : `${platformStats.totalExperts}+`,
      targetNumber: platformStats.totalExperts,
      suffix: "+",
      label: "전문가 등록수",
      description: "다양한 분야",
    },
    {
      id: "users",
      value: platformStats.totalUsers >= 1000 
        ? `${(platformStats.totalUsers / 1000).toFixed(platformStats.totalUsers % 1000 === 0 ? 0 : 1)}k+`
        : `${platformStats.totalUsers}+`,
      targetNumber: platformStats.totalUsers,
      suffix: "+",
      label: "누적 이용자",
      description: "신뢰받는 플랫폼",
    },
  ];

  return (
    <section
      id="stats-section"
      className="py-24 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`text-center transform transition-all duration-700 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
              style={{
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <div className="mb-2">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                  <AnimatedNumber 
                    targetNumber={stat.targetNumber}
                    suffix={stat.suffix}
                    isVisible={isVisible}
                    duration={2000 + index * 200}
                  />
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {stat.label}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
