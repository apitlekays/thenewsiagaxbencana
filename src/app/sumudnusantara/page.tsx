import { Metadata } from 'next';
import SumudNusantaraClient from './SumudNusantaraClient';

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

export default function SumudNusantaraPage() {
  return <SumudNusantaraClient />;
}