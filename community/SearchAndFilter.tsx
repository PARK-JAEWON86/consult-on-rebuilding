"use client";

import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: "latest" | "popular" | "comments" | "views";
  onSortChange: (value: "latest" | "popular" | "comments" | "views") => void;
  onFilterClick: () => void;
}

const SearchAndFilter = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onFilterClick,
}: SearchAndFilterProps) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "comments", label: "댓글순" },
    { value: "views", label: "조회순" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* 검색 입력 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="궁금한 내용을 검색해보세요..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 정렬 옵션 */}
        <select
          value={sortBy}
          onChange={(e) =>
            onSortChange(
              e.target.value as "latest" | "popular" | "comments" | "views",
            )
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 필터 버튼 */}
        <button
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
            showAdvancedFilter
              ? "border-blue-500 bg-blue-50 text-blue-600"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          고급필터
        </button>

        <button
          onClick={onFilterClick}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          필터
        </button>
      </div>

      {/* 고급 필터 옵션 */}
      {showAdvancedFilter && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 기간 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작성 기간
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">전체</option>
                <option value="today">오늘</option>
                <option value="week">1주일</option>
                <option value="month">1개월</option>
                <option value="year">1년</option>
              </select>
            </div>

            {/* 작성자 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작성자
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">전체</option>
                <option value="expert">전문가만</option>
                <option value="user">일반 사용자만</option>
              </select>
            </div>

            {/* 최소 좋아요 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 좋아요
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">제한없음</option>
                <option value="5">5개 이상</option>
                <option value="10">10개 이상</option>
                <option value="20">20개 이상</option>
                <option value="50">50개 이상</option>
              </select>
            </div>
          </div>

          {/* 필터 적용/초기화 버튼 */}
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              초기화
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              필터 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
