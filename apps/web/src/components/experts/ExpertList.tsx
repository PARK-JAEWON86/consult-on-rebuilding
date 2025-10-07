"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Grid, List, Users } from "lucide-react";
import ExpertCard from "@/components/experts/ExpertCard";
import { Expert } from "@/lib/experts";

/**
 * 전문가 데이터 유효성 검사 함수
 */
const validateExpert = (expert: Expert): boolean => {
  try {
    // 기본 구조 검증
    if (!expert || typeof expert !== 'object') {
      console.warn('유효하지 않은 전문가 데이터 구조:', expert);
      return false;
    }

    // 필수 필드 검증
    const requiredFields = {
      id: expert.id,
      displayId: expert.displayId,
      name: expert.name,
      ratingAvg: expert.ratingAvg,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => value === undefined || value === null)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.warn('전문가 데이터 필수 필드 누락:', {
        expertId: expert.id,
        missingFields,
      });
      return false;
    }

    // 타입 검증
    if (typeof expert.displayId !== "string") {
      console.warn('displayId 타입 오류:', typeof expert.displayId);
      return false;
    }

    if (typeof expert.name !== "string") {
      console.warn('name 타입 오류:', typeof expert.name);
      return false;
    }

    if (typeof expert.ratingAvg !== "number" || isNaN(expert.ratingAvg)) {
      console.warn('ratingAvg 타입 또는 값 오류:', expert.ratingAvg);
      return false;
    }

    return true;
  } catch (error) {
    console.error('전문가 데이터 검증 중 오류:', error, expert);
    return false;
  }
};

interface ExpertListProps {
  experts?: Expert[];
  onExpertSelect?: (expert: Expert) => void;
  loading?: boolean;
  defaultViewMode?: "grid" | "list";
  defaultSortBy?: "rating" | "latest" | "popular";
  showViewModeToggle?: boolean;
  showSortOptions?: boolean;
  itemsPerPage?: number;
  searchContext?: {
    category?: string;
    ageGroup?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * 전문가 목록을 표시하는 컴포넌트
 * 그리드/리스트 뷰 전환, 정렬, 페이지네이션 기능을 제공합니다.
 */
const ExpertList = ({
  experts = [],
  onExpertSelect,
  loading = false,
  defaultViewMode = "grid",
  defaultSortBy = "rating",
  showViewModeToggle = true,
  showSortOptions = true,
  itemsPerPage = 12,
  searchContext,
}: ExpertListProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultViewMode);
  const [sortBy, setSortBy] = useState<"rating" | "latest" | "popular">(defaultSortBy);
  const [currentPage, setCurrentPage] = useState(1);

  // 유효한 전문가 데이터만 필터링
  const validExperts = useMemo(() => {
    return experts.filter(validateExpert);
  }, [experts]);

  // 정렬된 전문가 목록
  const sortedExperts = useMemo(() => {
    try {
      const sorted = [...validExperts].sort((a, b) => {
        switch (sortBy) {
          case "rating": {
            const ratingA = typeof a.ratingAvg === 'number' ? a.ratingAvg : 0;
            const ratingB = typeof b.ratingAvg === 'number' ? b.ratingAvg : 0;
            return ratingB - ratingA;
          }
          case "latest": {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            // NaN 체크
            if (isNaN(dateA) || isNaN(dateB)) {
              console.warn('날짜 파싱 오류:', {
                aCreatedAt: a.createdAt,
                bCreatedAt: b.createdAt
              });
              return 0;
            }

            return dateB - dateA;
          }
          case "popular": {
            const countA = typeof a.reviewCount === 'number' ? a.reviewCount : 0;
            const countB = typeof b.reviewCount === 'number' ? b.reviewCount : 0;
            return countB - countA;
          }
          default:
            return 0;
        }
      });
      return sorted;
    } catch (error) {
      console.error('전문가 목록 정렬 중 오류:', error);
      return validExperts; // 정렬 실패 시 원본 반환
    }
  }, [validExperts, sortBy]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sortedExperts.length / itemsPerPage));
  const startIndex = Math.max(0, (currentPage - 1) * itemsPerPage);
  const endIndex = Math.min(sortedExperts.length, startIndex + itemsPerPage);
  const currentExperts = sortedExperts.slice(startIndex, endIndex);

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    setCurrentPage(1); // 뷰 모드 변경 시 첫 페이지로 이동
  }, []);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((sort: "rating" | "latest" | "popular") => {
    setSortBy(sort);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  }, []);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 전문가 선택 핸들러
  const handleExpertSelect = useCallback((expert: Expert) => {
    onExpertSelect?.(expert);
  }, [onExpertSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 패널 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* 정렬 옵션 */}
          {showSortOptions && (
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                정렬:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as "rating" | "latest" | "popular")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">평점 높은 순</option>
                <option value="latest">최신순</option>
                <option value="popular">추천순</option>
              </select>
            </div>
          )}

          {/* 뷰 모드 전환 */}
          {showViewModeToggle && (
            <div
              className="flex items-center border border-gray-300 rounded-lg overflow-hidden"
              role="group"
              aria-label="보기 모드 선택"
            >
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-2 text-sm transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-label="그리드 보기"
                aria-pressed={viewMode === "grid"}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange("list")}
                className={`p-2 text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
                aria-label="리스트 보기"
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 결과 수 표시 */}
        <div className="text-sm text-gray-500">
          총 {validExperts.length}명의 전문가
        </div>
      </div>

      {/* 전문가 목록 */}
      {currentExperts.length > 0 ? (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {currentExperts.map((expert) => (
              <ExpertCard
                key={expert.displayId}
                expert={{
                  id: expert.id,
                  displayId: expert.displayId,
                  name: expert.name,
                  specialty: expert.title || expert.categories[0] || "전문 분야",
                  rating: expert.ratingAvg,
                  reviewCount: expert.reviewCount,
                  experience: 0, // API에서 제공하지 않음
                  description: expert.bio || "",
                  specialties: expert.categories,
                  consultationTypes: ["video", "chat"],
                  profileImage: expert.avatarUrl,
                  level: 1, // 기본값, ExpertCard에서 계산됨
                  totalSessions: 0, // API에서 제공하지 않음
                  avgRating: expert.ratingAvg,
                }}
                mode={viewMode}
                showProfileButton={true}
                onProfileView={() => handleExpertSelect(expert)}
                searchContext={searchContext}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm border rounded-lg ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">전문가를 찾을 수 없습니다</h3>
          <p className="text-gray-500">검색 조건을 변경해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default ExpertList;
