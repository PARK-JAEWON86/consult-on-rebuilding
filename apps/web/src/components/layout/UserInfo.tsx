"use client";

import { useState } from "react";
import { User, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import { User as UserType } from "@/types/layout";
import Button from "@/components/ui/Button";

interface UserInfoProps {
  user: UserType;
  onLogout: () => void;
  onCreditsClick: () => void;
  onSettingsClick: () => void;
}

export default function UserInfo({ 
  user, 
  onLogout, 
  onCreditsClick, 
  onSettingsClick 
}: UserInfoProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="relative">
      {/* 사용자 정보 카드 */}
      <div 
        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
        <ChevronRight 
          className={`w-4 h-4 text-gray-400 transition-transform ${
            showUserMenu ? 'rotate-90' : ''
          }`} 
        />
      </div>

      {/* 사용자 메뉴 드롭다운 */}
      {showUserMenu && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {/* 크레딧 정보 */}
            <div 
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={onCreditsClick}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">크레딧</p>
                <p className="text-xs text-gray-500">{user.credits.toLocaleString()}개</p>
              </div>
            </div>

            {/* 설정 */}
            <div 
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={onSettingsClick}
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-900">설정</span>
            </div>

            <div className="border-t border-gray-100 my-1" />

            {/* 로그아웃 */}
            <div 
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">로그아웃</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
