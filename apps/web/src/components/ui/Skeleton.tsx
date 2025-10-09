interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  const variantClasses = variant === 'circular' ? 'rounded-full' : 'rounded';

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-center mb-4">
          <Skeleton className="w-10 h-10" variant="rectangular" />
          <Skeleton className="ml-3 h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function ReservationCardSkeleton() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="animate-pulse space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
        <div className="flex space-x-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-3">
      <Skeleton className="w-10 h-10" variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
