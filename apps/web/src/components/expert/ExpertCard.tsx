"use client";

import { Star, Award, Users, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExpertProfile } from '@/types';

interface ExpertCardProps {
  expert: ExpertProfile;
  showFavoriteButton?: boolean;
  showProfileButton?: boolean;
}

export default function ExpertCard({
  expert,
  showFavoriteButton = true,
  showProfileButton = true
}: ExpertCardProps) {
  const router = useRouter();

  const handleViewProfile = () => {
    router.push(`/experts/${expert.id}`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          {expert.profileImage ? (
            <img
              src={expert.profileImage}
              alt={expert.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-gray-600">
              {expert.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {expert.name}
            </h3>
            {showFavoriteButton && (
              <button className="p-1 text-gray-400 hover:text-red-500">
                <Heart className="h-5 w-5" />
              </button>
            )}
          </div>

          <p className="text-sm text-blue-600 font-medium mb-2">{expert.specialty}</p>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
              <span>{expert.rating}</span>
              <span className="ml-1">({expert.reviewCount})</span>
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              <span>{expert.experience}년</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{expert.totalSessions}회</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {expert.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">
              {expert.pricePerMinute}크레딧/분
            </div>
            {showProfileButton && (
              <button
                onClick={handleViewProfile}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                프로필 보기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}