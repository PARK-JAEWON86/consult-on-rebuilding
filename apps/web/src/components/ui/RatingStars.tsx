interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingStars({ 
  rating, 
  count, 
  size = 'md' 
}: RatingStarsProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= rating;
    const isHalfFilled = starValue - 0.5 <= rating && starValue > rating;

    return (
      <svg
        key={index}
        className={`${sizes[size]} ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        {isHalfFilled ? (
          <defs>
            <linearGradient id={`half-${index}`}>
              <stop offset="50%" stopColor="currentColor" className="text-yellow-400" />
              <stop offset="50%" stopColor="currentColor" className="text-gray-300" />
            </linearGradient>
          </defs>
        ) : null}
        <path
          fillRule="evenodd"
          d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
          clipRule="evenodd"
          fill={isHalfFilled ? `url(#half-${index})` : 'currentColor'}
        />
      </svg>
    );
  });

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">{stars}</div>
      <span className={`${textSizes[size]} text-gray-600`}>
        {rating.toFixed(1)}
        {count && ` (${count})`}
      </span>
    </div>
  );
}
