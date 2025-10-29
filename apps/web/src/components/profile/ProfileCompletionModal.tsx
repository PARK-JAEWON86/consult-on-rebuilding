'use client';

import { Award, X } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditAmount: number;
  newBalance: number;
}

export default function ProfileCompletionModal({
  isOpen,
  onClose,
  creditAmount,
  newBalance,
}: ProfileCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-[scale-in_0.3s_ease-out]">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 축하 아이콘 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-4">
            <Award className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 프로필 완성 축하합니다!
          </h2>
          <p className="text-gray-600">
            프로필을 완성하여 보상을 받았습니다
          </p>
        </div>

        {/* 보상 정보 */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-yellow-800 mb-2">획득한 크레딧</p>
            <p className="text-4xl font-bold text-yellow-600 mb-1">
              +{creditAmount}
            </p>
            <p className="text-xs text-yellow-700">
              ({creditAmount * 10}원 상당)
            </p>
          </div>
        </div>

        {/* 현재 잔액 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">현재 크레딧 잔액</span>
            <span className="text-lg font-bold text-blue-600">
              {newBalance} 크레딧
            </span>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="text-center text-sm text-gray-600 mb-6">
          <p>크레딧을 사용하여</p>
          <p>전문가 상담을 예약해보세요!</p>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          확인
        </button>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
