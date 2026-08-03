import React from 'react';

const LoadingSpinner = ({ size = 'md', message = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-2',
    lg: 'h-14 w-14 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-indigo-200 border-t-indigo-600`}
        style={{ animation: 'spin 0.7s linear infinite' }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const SkeletonFlightCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="shimmer h-14 w-full" />
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="shimmer h-10 w-16 rounded-lg" />
        <div className="space-y-1 flex flex-col items-center">
          <div className="shimmer h-3 w-20 rounded" />
          <div className="shimmer h-1 w-28 rounded" />
          <div className="shimmer h-3 w-16 rounded" />
        </div>
        <div className="shimmer h-10 w-16 rounded-lg" />
      </div>
      <div className="shimmer h-px w-full rounded" />
      <div className="flex justify-between items-center">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="flex items-center gap-3">
          <div className="shimmer h-8 w-20 rounded-lg" />
          <div className="shimmer h-10 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonHotelCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="shimmer h-44 w-full" />
    <div className="p-5 space-y-3">
      <div className="shimmer h-5 w-3/4 rounded" />
      <div className="shimmer h-4 w-1/2 rounded" />
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => <div key={i} className="shimmer w-4 h-4 rounded" />)}
      </div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-6 w-16 rounded-full" />)}
      </div>
      <div className="shimmer h-px w-full" />
      <div className="flex justify-between items-center">
        <div className="shimmer h-8 w-20 rounded-lg" />
        <div className="shimmer h-10 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
