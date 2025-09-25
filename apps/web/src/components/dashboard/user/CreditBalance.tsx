"use client";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Plus,
  History,
  Gift
} from "lucide-react";
import type { CreditBalance, CreditTransaction } from '@/lib/credits';

interface CreditBalanceProps {
  balance: CreditBalance;
  recentTransactions: CreditTransaction[];
  onPurchaseCredits: () => void;
  onViewHistory: () => void;
}

export const CreditBalance = ({ 
  balance, 
  recentTransactions,
  onPurchaseCredits,
  onViewHistory 
}: CreditBalanceProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'PURCHASE': return '구매';
      case 'USAGE': return '사용';
      case 'REFUND': return '환불';
      default: return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'USAGE': return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'REFUND': return <Gift className="h-4 w-4 text-blue-600" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const isLowBalance = balance.balance < 500;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
          크레딧 잔액
        </h2>
        <Button onClick={onViewHistory} variant="ghost" size="sm">
          <History className="h-4 w-4 mr-1" />
          내역
        </Button>
      </div>

      {/* 잔액 표시 */}
      <div className="text-center mb-6">
        <div className="relative">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {balance.balance.toLocaleString()}
          </div>
          {isLowBalance && (
            <Badge variant="destructive" className="absolute -top-2 -right-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              부족
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">사용 가능한 크레딧</p>
        
        {balance.expiresAt && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              만료: {new Date(balance.expiresAt).toLocaleDateString('ko-KR')}
            </Badge>
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-700">
            {balance.totalPurchased.toLocaleString()}
          </div>
          <p className="text-xs text-green-600">총 구매</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-semibold text-red-700">
            {balance.totalUsed.toLocaleString()}
          </div>
          <p className="text-xs text-red-600">총 사용</p>
        </div>
      </div>

      {/* 최근 거래 내역 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">최근 거래</h3>
        <div className="space-y-2">
          {recentTransactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'USAGE' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'USAGE' ? '-' : '+'}{transaction.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTransactionType(transaction.type)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <Button 
          onClick={onPurchaseCredits} 
          className="w-full"
          variant={isLowBalance ? "default" : "outline"}
        >
          <Plus className="h-4 w-4 mr-2" />
          크레딧 충전
        </Button>
        
        {isLowBalance && (
          <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            <span>크레딧이 부족합니다. 충전을 권장합니다.</span>
          </div>
        )}
      </div>
    </Card>
  );
};
