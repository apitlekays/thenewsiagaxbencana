"use client";

import dynamic from 'next/dynamic';

// Dynamically import the decoupled map component to avoid SSR issues
const VesselTrackerMapDecoupled = dynamic(() => import('@/components/VesselTrackerMapDecoupled'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Vessel Tracker...</p>
      </div>
    </div>
  )
});

export default function SumudNusantaraPage() {
  return <VesselTrackerMapDecoupled />;
}