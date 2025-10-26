import React, { useState } from 'react';
import { Filter, X, Calendar, CreditCard, User } from 'lucide-react';

interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  expertName?: string;
}

interface AdvancedFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function AdvancedFilter({ filters, onFiltersChange }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
          hasActiveFilters
            ? 'border-blue-500 bg-blue-50 text-blue-600'
            : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-5 w-5" />
        <span className="font-medium">고급 필터</span>
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">필터 옵션</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 날짜 범위 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  날짜 범위
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          start: e.target.value,
                          end: filters.dateRange?.end || '',
                        },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          start: filters.dateRange?.start || '',
                          end: e.target.value,
                        },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 가격 범위 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4" />
                  가격 범위
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="최소"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        priceRange: {
                          min: Number(e.target.value),
                          max: filters.priceRange?.max || 0,
                        },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="최대"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        priceRange: {
                          min: filters.priceRange?.min || 0,
                          max: Number(e.target.value),
                        },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 전문가 이름 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  전문가 이름
                </label>
                <input
                  type="text"
                  placeholder="전문가 이름 입력"
                  value={filters.expertName || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      expertName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                초기화
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                적용
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
