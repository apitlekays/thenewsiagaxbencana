import { Metadata } from 'next';
import BencanaClient from './BencanaClient';

// Generate metadata for the disaster monitoring page
export const generateMetadata = (): Metadata => {
  return {
    title: "SiagaX Bencana - Real-time Disaster Monitoring System | MAPIM",
    description: "Real-time disaster monitoring and alert system for Malaysia. Track water levels, rainfall, and emergency incidents across Malaysia with live updates and interactive maps.",
    keywords: "disaster monitoring, Malaysia, water level, rainfall, emergency alerts, SiagaX Bencana, MAPIM, real-time alerts, flood monitoring, weather alerts",
    openGraph: {
      title: "SiagaX Bencana - Real-time Disaster Monitoring System",
      description: "Real-time disaster monitoring and alert system for Malaysia. Track water levels, rainfall, and emergency incidents across Malaysia with live updates and interactive maps.",
      type: "website",
      images: [
        {
          url: "/metaImage.png",
          width: 1200,
          height: 630,
          alt: "SiagaX Bencana - Real-time Disaster Monitoring System",
        },
      ],
    },
    twitter: {
      title: "SiagaX Bencana - Real-time Disaster Monitoring System",
      description: "Real-time disaster monitoring and alert system for Malaysia. Track water levels, rainfall, and emergency incidents across Malaysia with live updates and interactive maps.",
      card: "summary_large_image",
      images: ["/metaImage.png"],
    },
  };
};

export default function BencanaHome() {
  return <BencanaClient />;
} 