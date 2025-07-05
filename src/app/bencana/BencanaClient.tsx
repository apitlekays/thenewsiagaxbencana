'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ScrollingAlertBanner from '@/components/ScrollingAlertBanner';
import WaterRainAlertPanel from '@/components/WaterRainAlertPanel';
import IncidentDetailsPanel from '@/components/IncidentDetailsPanel';
import PPSPanel from '@/components/PPSPanel';
import { MapProvider, useMap } from '@/contexts/MapContext';
import { useRef } from 'react';

// Dynamically import the map component to avoid SSR issues
const MalaysiaMap = dynamic(() => import('@/components/MalaysiaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-4">
          <DotLottieReact
            src="/animations/magicloading.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="text-sm text-gray-500">Loading map...</div>
      </div>
    </div>
  )
});

function AppContent() {
  const { currentAlert, isIncidentPanelVisible, hideIncidentDetails } = useMap();
  const ppsPanelRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50 hidden md:block">
        <Link 
          href="/"
          className="inline-flex items-center px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <FaArrowLeft className="mr-2" />
          Back to MAGIC
        </Link>
      </div>

      <WaterRainAlertPanel />
      <ScrollingAlertBanner />
      <MalaysiaMap />
      <div className="fixed right-6 top-15 z-50 flex flex-col items-end gap-2 hidden md:flex" style={{ maxWidth: '95vw' }}>
        <PPSPanel ref={ppsPanelRef} />
        <IncidentDetailsPanel 
          alert={currentAlert}
          isVisible={isIncidentPanelVisible}
          onClose={hideIncidentDetails}
        />
      </div>
    </>
  );
}

export default function BencanaClient() {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
} 