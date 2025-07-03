'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="mb-4">
          {/* Lottie Animation */}
          <div className={`${sizeClasses[size]} mx-auto mb-4`}>
            <DotLottieReact
              src="/animations/magicloading.lottie"
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="text-sm text-gray-500">{text}</div>
        </div>
        {fullScreen && (
          <div className="text-2xl font-semibold text-gray-700">The MAPIM Strategic Centre</div>
        )}
      </div>
    </div>
  );
} 