import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function Card({ 
  children, 
  hover = false, 
  className = '', 
  ...props 
}: CardProps) {
  const baseClasses = 'bg-white border border-gray-200 rounded-2xl p-6';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow duration-200' : '';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

// Named export for new components
export { Card };
