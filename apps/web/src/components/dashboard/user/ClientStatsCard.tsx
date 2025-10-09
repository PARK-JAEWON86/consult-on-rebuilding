import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ClientStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    value: 'text-blue-700'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    value: 'text-green-700'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
    value: 'text-yellow-700'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    value: 'text-purple-700'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    value: 'text-red-700'
  }
};

export const ClientStatsCard = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = 'blue'
}: ClientStatsCardProps) => {
  const classes = colorClasses[color];

  return (
    <Card className={`p-6 ${classes.bg} ${classes.border} border`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${classes.value}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-white ${classes.icon}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <Badge
            variant={trend.isPositive ? 'green' : 'red'}
            className="text-xs"
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Badge>
          <span className="text-xs text-gray-500 ml-2">지난 달 대비</span>
        </div>
      )}
    </Card>
  );
};
