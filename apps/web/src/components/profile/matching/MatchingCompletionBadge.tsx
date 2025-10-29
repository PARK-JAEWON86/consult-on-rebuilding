'use client';

interface MatchingCompletionBadgeProps {
  percentage: number;
  showHint?: boolean;
}

export default function MatchingCompletionBadge({ percentage, showHint = false }: MatchingCompletionBadgeProps) {
  const getColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 50) return 'bg-blue-500';
    if (percent >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getMessage = (percent: number) => {
    if (percent >= 80) return '매칭 준비 완료!';
    if (percent >= 50) return '거의 다 왔어요!';
    if (percent >= 25) return '조금만 더 작성해주세요';
    return '프로필 작성을 시작해보세요';
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">완성도: {percentage}%</span>
          {showHint && (
            <span className="text-xs text-gray-500">{getMessage(percentage)}</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
