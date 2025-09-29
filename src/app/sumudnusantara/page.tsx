import { Metadata, Viewport } from 'next';
import SumudNusantaraClient from './SumudNusantaraClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Sumud Nusantara Flotilla Tracker - Real-time Vessel Tracking',
  description: 'Real-time tracking of the Global Sumud Flotilla humanitarian mission. Monitor vessels sailing to break the illegal siege on Gaza with live GPS tracking, vessel status, and mission updates.',
  keywords: 'Sumud Nusantara, flotilla tracker, vessel tracking, humanitarian mission, Gaza, Global Sumud Flotilla, real-time GPS, maritime tracking, humanitarian aid',
  authors: [{ name: 'MAPIM Strategic Centre' }],
  creator: 'MAPIM Strategic Centre',
  publisher: 'MAPIM Strategic Centre',
  metadataBase: new URL('https://magic.mapim.dev'),
  alternates: {
    canonical: '/sumudnusantara',
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' }
    ],
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/icons/apple-touch-icon-180x180.png' }
    ]
  },
  manifest: '/sumudnusantara-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sumud Tracker',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Sumud Nusantara Tracker',
  },
  openGraph: {
    title: 'Sumud Nusantara Flotilla Tracker - Real-time Vessel Tracking',
    description: 'Real-time tracking of the Global Sumud Flotilla humanitarian mission. Monitor vessels sailing to break the illegal siege on Gaza.',
    url: 'https://magic.mapim.dev/sumudnusantara',
    siteName: 'MAPIM Strategic Centre',
    images: [
      {
        url: '/sumudflotillametaimage.png',
        width: 1200,
        height: 630,
        alt: 'Sumud Nusantara Flotilla Tracker - Real-time Vessel Tracking Map',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sumud Nusantara Flotilla Tracker - Real-time Vessel Tracking',
    description: 'Real-time tracking of the Global Sumud Flotilla humanitarian mission. Monitor vessels sailing to break the illegal siege on Gaza.',
    images: ['/sumudflotillametaimage.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090909',
};

export default function SumudNusantaraPage() {
  return (
    <ErrorBoundary>
      <SumudNusantaraClient />
    </ErrorBoundary>
  );
}