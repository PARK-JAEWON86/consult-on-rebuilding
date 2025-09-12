"use client";

import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ExpertStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    value: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    value: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    value: 'text-yellow-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    value: 'text-purple-600'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    value: 'text-red-600'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    value: 'text-orange-600'
  }
};

export const ExpertStatsCard = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = 'blue'
}: ExpertStatsCardProps) => {
  const colors = colorClasses[color];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 ${colors.bg} rounded-full`}>
          <div className={colors.text}>
            {icon}
          </div>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-gray-500 ml-1">전월 대비</span>
        </div>
      )}
    </Card>
  );
};
