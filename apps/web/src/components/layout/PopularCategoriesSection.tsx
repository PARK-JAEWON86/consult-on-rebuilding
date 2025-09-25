import { CategoryOption } from "./HomePage";
import { 
  ChevronDown,
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
  GraduationCap
} from "lucide-react";

interface PopularCategoriesSectionProps {
  categories: CategoryOption[];
  showAllCategories: boolean;
  setShowAllCategories: (value: boolean) => void;
  isLoading?: boolean;
}

// 아이콘 문자열을 실제 컴포넌트로 매핑
const getIconComponent = (iconName: string) => {
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
    GraduationCap
  };
  
  return iconMap[iconName] || Target; // 기본값으로 Target 사용
};

export default function PopularCategoriesSection({
  categories,
  showAllCategories,
  setShowAllCategories,
  isLoading = false,
}: PopularCategoriesSectionProps) {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            인기 상담 분야
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            많은 분들이 찾고 있는 상담 분야를 확인해보세요
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {isLoading ? (
            // 로딩 상태: 스켈레톤 UI 표시
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-3 sm:p-4 text-center min-h-[120px] sm:min-h-[160px] flex flex-col justify-center animate-pulse"
              >
                <div className="flex justify-center mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gray-300 rounded-full"></div>
                </div>
                <div className="h-3 sm:h-4 bg-gray-300 rounded mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-300 rounded"></div>
              </div>
            ))
          ) : (
            categories.slice(0, 5).map((category) => {
              const IconComponent = getIconComponent(category.icon as string);
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl p-3 sm:p-4 text-center hover:shadow-lg transition-shadow duration-200 cursor-pointer min-h-[120px] sm:min-h-[160px] flex flex-col justify-center"
                >
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <IconComponent className="h-6 w-6 sm:h-10 sm:w-10 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              );
            })
          )}

          <div
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-400 group min-h-[120px] sm:min-h-[160px] flex flex-col justify-center"
          >
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="bg-blue-100 rounded-full p-1.5 sm:p-2 group-hover:bg-blue-200 transition-colors">
                <ChevronDown
                  className={`h-6 w-6 sm:h-10 sm:w-10 text-blue-600 transition-transform duration-200 ${showAllCategories ? "rotate-180" : ""}`}
                />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
              {showAllCategories ? "접기" : "더 많은 분야"}
            </h3>
            <p className="text-xs text-gray-600">
              {isLoading ? "로딩 중..." : `총 ${categories.length}개의 상담 분야`}
            </p>
          </div>
        </div>

        {showAllCategories && !isLoading && (
          <div className="mt-6 sm:mt-8">
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.slice(5).map((category) => {
                const IconComponent = getIconComponent(category.icon as string);
                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[120px] sm:min-h-[160px] flex flex-col justify-center"
                  >
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <IconComponent className="h-6 w-6 sm:h-10 sm:w-10 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
