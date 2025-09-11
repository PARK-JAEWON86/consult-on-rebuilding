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
