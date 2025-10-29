'use client';

interface BudgetRangeSliderProps {
  min: number;
  max: number;
  onChange: (range: { min: number; max: number }) => void;
}

export default function BudgetRangeSlider({ min, max, onChange }: BudgetRangeSliderProps) {
  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  const average = Math.round((min + max) / 2);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        예산 범위 (시간당)
      </label>
      <div className="space-y-4">
        {/* 최소 예산 */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">최소</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(min)}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={min}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin <= max) {
                onChange({ min: newMin, max });
              }
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* 최대 예산 */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">최대</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(max)}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={max}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax >= min) {
                onChange({ min, max: newMax });
              }
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* 평균 표시 */}
        <div className="text-center py-2 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">평균: </span>
          <span className="text-lg font-semibold text-blue-600">{formatCurrency(average)}</span>
        </div>
      </div>
    </div>
  );
}
