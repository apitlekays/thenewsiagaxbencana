import { Metadata } from 'next';
import Navigation from "@/components/sections/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import SocialProofSection from "@/components/sections/SocialProofSection";
import FeaturedShowcaseSection from "@/components/sections/FeaturedShowcaseSection";
import SolutionsSection from "@/components/sections/SolutionsSection";
import AboutSection from "@/components/sections/AboutSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: 'MAPIM Strategic Centre - Advancing Malaysia\'s Digital Humanitarian Future',
  description: 'Cutting-edge technology solutions for national security, disaster preparedness, and digital transformation across Malaysia. Real-time monitoring and advanced analytics.',
  keywords: 'MAPIM, Malaysia, digital transformation, humanitarian technology, disaster preparedness, national security, real-time monitoring, analytics',
  authors: [{ name: 'MAPIM Strategic Centre' }],
  creator: 'MAPIM Strategic Centre',
  publisher: 'MAPIM Strategic Centre',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://magic.mapim.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MAPIM Strategic Centre - Advancing Malaysia\'s Digital Humanitarian Future',
    description: 'Cutting-edge technology solutions for national security, disaster preparedness, and digital transformation across Malaysia.',
    url: 'https://magic.mapim.dev',
    siteName: 'MAPIM Strategic Centre',
    images: [
      {
        url: '/mainMeta.png',
        width: 1200,
        height: 630,
        alt: 'MAPIM Strategic Centre - Digital Humanitarian Solutions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MAPIM Strategic Centre - Advancing Malaysia\'s Digital Humanitarian Future',
    description: 'Cutting-edge technology solutions for national security, disaster preparedness, and digital transformation across Malaysia.',
    images: ['/mainMeta.png'],
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navigation />
      <HeroSection />
      <SocialProofSection />
      <FeaturedShowcaseSection />
      <SolutionsSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </div>
  );
}
