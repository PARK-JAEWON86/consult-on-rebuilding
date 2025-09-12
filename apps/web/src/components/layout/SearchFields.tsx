"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import {
  Calendar,
  Target,
  Brain,
  DollarSign,
  Scale,
  BookOpen,
  Heart,
  Users,
  Briefcase,
  Code,
  Palette,
  Languages,
  Music,
  Plane,
  Scissors,
  Trophy,
  Sprout,
  TrendingUp,
  Video,
  Star,
  ShoppingBag,
  ChefHat,
  PawPrint,
  Building2,
  GraduationCap,
  Clock,
  ChevronDown,
  Search,
  School,
  User,
  UserCheck,
} from "lucide-react";
import { CategoryOption, AgeGroupOption, DurationOption } from "./HomePage";

type IconType = React.ElementType;

interface SearchFieldsProps {
  searchCategory: string;
  setSearchCategory: (value: string) => void;
  searchStartDate: string;
  setSearchStartDate: (value: string) => void;
  searchEndDate: string;
  setSearchEndDate: (value: string) => void;
  searchAgeGroup: string;
  setSearchAgeGroup: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  categories: CategoryOption[];
  ageGroups: AgeGroupOption[];
  durations: DurationOption[];
}

// 아이콘 문자열을 실제 컴포넌트로 매핑
const getIconComponent = (iconName: string | IconType) => {
  if (typeof iconName === 'string') {
    const iconMap: { [key: string]: any } = {
      Target,
      Brain,
      DollarSign,
      Scale,
      BookOpen,
      Heart,
      Users,
      Briefcase,
      Code,
      Palette,
      Languages,
      Music,
      Plane,
      Scissors,
      Trophy,
      Sprout,
      TrendingUp,
      Video,
      Star,
      ShoppingBag,
      ChefHat,
      PawPrint,
      Building2,
      GraduationCap,
      School,
      User,
      UserCheck,
    };
    
    return iconMap[iconName] || Target;
  }
  return iconName;
};

export default function SearchFields(props: SearchFieldsProps) {
  const {
    searchCategory,
    setSearchCategory,
    searchStartDate,
    setSearchStartDate,
    searchEndDate,
    setSearchEndDate,
    searchAgeGroup,
    setSearchAgeGroup,
    isSearching,
    onSearch,
    categories,
    ageGroups,
    durations,
  } = props;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  const closeDropdown = () => setActiveDropdown(null);

  const getDisplayText = (type: string, value: string) => {
    switch (type) {
      case "category": {
        const category = categories.find((c) => c.id === value);
        return category ? category.name : "상담 분야 선택";
      }
      case "startDate":
        return value
          ? new Date(value).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })
          : "날짜 선택";
      case "duration": {
        if (value === "decide_after_matching") {
          return "전문가와 매칭 후 결정";
        }
        const duration = durations.find((d) => d.id === value);
        return duration ? duration.name : "상담시간 선택";
      }
      case "ageGroup": {
        const ageGroup = ageGroups
          .filter((a) => !a.name.includes("어린이"))
          .find((a) => a.id === value);
        return ageGroup ? ageGroup.name : "연령대 선택";
      }
      default:
        return "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-16">
      <div className="flex flex-col items-stretch md:flex-row md:flex-wrap md:items-end md:justify-center gap-3 md:gap-4">
        {/* 상담 카테고리 */}
        <div className="relative md:flex-none">
          <button
            onClick={() => toggleDropdown("category")}
            className={`w-full md:w-auto md:min-w-[220px] h-12 md:h-14 px-4 rounded-2xl text-left transition-all duration-200 flex items-center justify-between border ${
              activeDropdown === "category"
                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                : searchCategory
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-white/60 hover:bg-white"
            }`}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {searchCategory ? (
                <>
                  {(() => {
                    const category = categories.find(
                      (c) => c.id === searchCategory
                    );
                    const IconComponent = getIconComponent(category?.icon || 'Target');
                    return IconComponent ? (
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    ) : null;
                  })()}
                  <span className="text-gray-900 font-medium whitespace-nowrap">
                    {getDisplayText("category", searchCategory)}
                  </span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-500 whitespace-nowrap">
                    상담 분야 선택
                  </span>
                </>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                activeDropdown === "category" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 카테고리 드롭다운 */}
          {activeDropdown === "category" && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSearchCategory(category.id);
                        closeDropdown();
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                    >
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 상담 희망일 */}
        <div className="relative md:flex-none">
          <button
            onClick={() => toggleDropdown("startDate")}
            className={`w-full md:w-auto md:min-w-[220px] h-12 md:h-14 px-4 rounded-2xl text-left transition-all duration-200 flex items-center justify-between border ${
              activeDropdown === "startDate"
                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                : searchStartDate
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-white/60 hover:bg-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span
                className={
                  searchStartDate
                    ? "text-gray-900 font-medium whitespace-nowrap"
                    : "text-gray-500 whitespace-nowrap"
                }
              >
                {getDisplayText("startDate", searchStartDate)}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                activeDropdown === "startDate" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 달력 드롭다운 */}
          {activeDropdown === "startDate" && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  상담 희망일 선택
                </h3>
                <div className="small-calendar">
                  <DatePicker
                    selected={searchStartDate ? new Date(searchStartDate) : null}
                    onChange={(date) => {
                      if (date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        setSearchStartDate(formattedDate);
                        closeDropdown();
                      }
                    }}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    locale={ko}
                    inline
                    dayClassName={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      date.setHours(0, 0, 0, 0);
                      
                      if (date < today) {
                        return "text-gray-300 cursor-not-allowed";
                      }
                      return "hover:bg-blue-100 text-gray-700";
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 상담시간 */}
        <div className="relative md:flex-none">
          <button
            onClick={() => toggleDropdown("duration")}
            className={`w-full md:w-auto md:min-w-[220px] h-12 md:h-14 px-4 rounded-2xl text-left transition-all duration-200 flex items-center justify-between border ${
              activeDropdown === "duration"
                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                : searchEndDate
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-white/60 hover:bg-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span
                className={
                  searchEndDate
                    ? "text-gray-900 font-medium whitespace-nowrap"
                    : "text-gray-500 whitespace-nowrap"
                }
              >
                {getDisplayText("duration", searchEndDate)}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                activeDropdown === "duration" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 상담시간 선택 드롭다운 */}
          {activeDropdown === "duration" && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="p-2">
                <button
                  key="decide_after_matching"
                  onClick={() => {
                    setSearchEndDate("decide_after_matching");
                    closeDropdown();
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">전문가와 매칭 후 결정</div>
                  <div className="text-sm text-gray-500">상담 시간은 전문가와 상의하여 정합니다</div>
                </button>
                <div className="my-1 border-t border-gray-100" />
                {durations.map((duration) => (
                  <button
                    key={duration.id}
                    onClick={() => {
                      setSearchEndDate(duration.id);
                      closeDropdown();
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-900">
                      {duration.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {duration.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 연령대 */}
        <div className="relative md:flex-none">
          <button
            onClick={() => toggleDropdown("ageGroup")}
            className={`w-full md:w-auto md:min-w-[220px] h-12 md:h-14 px-4 rounded-2xl text-left transition-all duration-200 flex items-center justify-between border ${
              activeDropdown === "ageGroup"
                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                : searchAgeGroup
                  ? "border-gray-200 bg-white"
                  : "border-gray-200 bg-white/60 hover:bg-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              {searchAgeGroup ? (
                <>
                  {(() => {
                    const ageGroup = ageGroups
                      .filter((a) => !a.name.includes("어린이"))
                      .find(
                      (a) => a.id === searchAgeGroup
                      );
                    const IconComponent = ageGroup?.icon as
                      | IconType
                      | undefined;
                    return IconComponent ? (
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    ) : null;
                  })()}
                  <span className="text-gray-900 font-medium whitespace-nowrap">
                    {getDisplayText("ageGroup", searchAgeGroup)}
                  </span>
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-500 whitespace-nowrap">
                    연령대 선택
                  </span>
                </>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                activeDropdown === "ageGroup" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 연령대 선택 드롭다운 */}
          {activeDropdown === "ageGroup" && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-50 overflow-y-auto">
              <div className="p-2">
                {ageGroups
                  .filter((ageGroup) => !ageGroup.name.includes("어린이"))
                  .map((ageGroup) => {
                  const IconComponent = ageGroup.icon as IconType;
                  return (
                    <button
                      key={ageGroup.id}
                      onClick={() => {
                        setSearchAgeGroup(ageGroup.id);
                        closeDropdown();
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                    >
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {ageGroup.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 검색 버튼 */}
        <div className="relative md:flex-none md:self-stretch md:flex md:items-stretch flex justify-center md:justify-start">
          <button
            aria-label="전문가 검색"
            onClick={onSearch}
            disabled={isSearching}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-transparent bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
