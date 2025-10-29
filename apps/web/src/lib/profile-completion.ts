/**
 * 프로필 완성도 계산 유틸리티
 * 백엔드와 동일한 로직으로 계산
 */

export interface ProfileCompletionData {
  // 기본 정보 (page.tsx)
  name?: string;
  bio?: string;
  ageGroup?: string;
  mbti?: string;

  // 매칭 프로필 (UserMatchingPreferences)
  interestedCategories?: any[];
  preferredConsultationType?: any[];
  preferredTimes?: any[];
}

export function calculateProfileCompletion(data: ProfileCompletionData): number {
  const fields = [
    { check: !!data.name, weight: 15 },
    { check: !!data.bio, weight: 15 },
    { check: !!data.ageGroup, weight: 10 },
    { check: !!data.mbti, weight: 5 },
    { check: Array.isArray(data.interestedCategories) && data.interestedCategories.length > 0, weight: 25 },
    { check: Array.isArray(data.preferredConsultationType) && data.preferredConsultationType.length > 0, weight: 10 },
    { check: Array.isArray(data.preferredTimes) && data.preferredTimes.length > 0, weight: 20 },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  const completedWeight = fields.filter(f => f.check).reduce((sum, f) => sum + f.weight, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}
