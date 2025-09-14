import { Metadata } from 'next';
import FlotillaClient from './FlotillaClient';

// Generate metadata for the Sumud Nusantara tracking page
export const generateMetadata = (): Metadata => {
  return {
    title: "Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking | MAPIM",
    description: "Track the Global Sumud Flotilla and Sumud Nusantara humanitarian mission to Gaza in real-time. Monitor vessel locations, routes, and mission progress with live updates every 10 minutes. Support the humanitarian mission to Gaza.",
    keywords: [
      "global sumud flotilla",
      "global sumud flotilla tracker", 
      "sumud nusantara tracker",
      "sumud nusantara",
      "flotilla tracking",
      "Gaza humanitarian mission",
      "vessel tracking",
      "Sumud Flotilla",
      "MAPIM",
      "real-time tracking",
      "maritime mission",
      "humanitarian aid",
      "Gaza relief",
      "vessel monitoring",
      "ship tracking",
      "flotilla mission",
      "Gaza flotilla",
      "humanitarian flotilla",
      "vessel positions",
      "maritime tracking"
    ].join(", "),
    authors: [{ name: "MAPIM - Malaysian Consultative Council of Islamic Organizations" }],
    creator: "MAPIM",
    publisher: "MAPIM",
    robots: "index, follow",
    alternates: {
      canonical: "https://magic.mapim.dev/sumudnusantara"
    },
    openGraph: {
      title: "Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking",
      description: "Track the Global Sumud Flotilla and Sumud Nusantara humanitarian mission to Gaza in real-time. Monitor vessel locations, routes, and mission progress with live updates every 10 minutes.",
      type: "website",
      url: "https://magic.mapim.dev/sumudnusantara",
      siteName: "SiagaX Sumud Nusantara",
      images: [
        {
          url: "/sumudflotillametaimage.png",
          width: 1200,
          height: 630,
          alt: "Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking System",
        },
      ],
    },
    twitter: {
      title: "Global Sumud Flotilla Tracker - Sumud Nusantara Vessel Tracking",
      description: "Track the Global Sumud Flotilla and Sumud Nusantara humanitarian mission to Gaza in real-time. Monitor vessel locations, routes, and mission progress.",
      card: "summary_large_image",
      images: ["/sumudflotillametaimage.png"],
      creator: "@MAPIMOfficial",
    },
  };
};

export default function SumudNusantaraHome() {
  return <FlotillaClient />;
}
