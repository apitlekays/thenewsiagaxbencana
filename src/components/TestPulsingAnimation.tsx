"use client";

import { useEffect, useState } from 'react';

export default function TestPulsingAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="absolute top-20 left-4 z-[1000] bg-white/95 dark:bg-slate-800/95 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm w-[120px]">
      <div className="space-y-2">
        <div className="text-center">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Vessel Status
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="w-3 h-3 bg-red-500 rounded-full pulse-red"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">Attacked</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="w-3 h-3 bg-amber-500 rounded-full pulse-amber"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">Emergency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
