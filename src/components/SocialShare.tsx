'use client';

import { FaTwitter, FaFacebook, FaWhatsapp, FaTelegram, FaShare, FaCopy } from 'react-icons/fa';
import { useState, useEffect } from 'react';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function SocialShare({ 
  url = '',
  title = 'Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking',
  description = 'Track the Global Sumud Flotilla and Sumud Nusantara humanitarian mission to Gaza in real-time. Monitor vessel locations, routes, and mission progress with live updates every 10 minutes.',
  className = ''
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  // Set the URL on client-side only to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined' && !url) {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const shareUrl = encodeURIComponent(currentUrl);
  const shareTitle = encodeURIComponent(title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}&hashtags=SumudFlotilla,GazaMission,MAPIM,HumanitarianAid`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`
  };

  const trackShare = (platform: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'social_share', {
        platform: platform,
        content_type: 'flotilla_tracker',
        event_category: 'social_engagement'
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackShare('copy_link');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openShareDialog = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url: currentUrl
      }).then(() => {
        trackShare('native_share');
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">Share:</span>
      
      {/* Twitter */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        aria-label="Share on Twitter"
        onClick={() => trackShare('twitter')}
      >
        <FaTwitter className="w-4 h-4" />
      </a>

      {/* Facebook */}
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        aria-label="Share on Facebook"
        onClick={() => trackShare('facebook')}
      >
        <FaFacebook className="w-4 h-4" />
      </a>

      {/* WhatsApp */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        aria-label="Share on WhatsApp"
        onClick={() => trackShare('whatsapp')}
      >
        <FaWhatsapp className="w-4 h-4" />
      </a>

      {/* Telegram */}
      <a
        href={shareLinks.telegram}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors"
        aria-label="Share on Telegram"
        onClick={() => trackShare('telegram')}
      >
        <FaTelegram className="w-4 h-4" />
      </a>

      {/* Native Share or Copy */}
      <button
        onClick={openShareDialog}
        className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
        aria-label={copied ? "Copied!" : "Copy link"}
      >
        {copied ? <FaCopy className="w-4 h-4" /> : <FaShare className="w-4 h-4" />}
      </button>
    </div>
  );
}
