'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

export default function NotFound() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back in history
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      // If no history, try to go to a common page
      router.push('/bencana');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-blue-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-gray-300 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaHome className="mr-2" />
            Go Home
          </Link>
          <button 
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 bg-gray-800 text-blue-400 font-semibold rounded-lg border-2 border-blue-500 hover:bg-gray-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            {canGoBack ? 'Go Back' : 'Go to Bencana'}
          </button>
        </div>
        
        <div className="mt-12 text-gray-400 text-sm">
          <p>MAPIM Strategic Centre - MAGIC Digital Initiatives</p>
        </div>
      </div>
    </div>
  );
} 