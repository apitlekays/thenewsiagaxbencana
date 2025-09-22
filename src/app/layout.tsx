import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAPIM Strategic Centre - MAGIC Digital Humanitarian Initiatives",
  description: "MAPIM Strategic Centre (MAGIC) is dedicated to driving digital transformation and innovation across Malaysia through cutting-edge technology initiatives.",
  keywords: "MAPIM, Strategic Centre, MAGIC, Digital Humanitarian, Malaysia, Technology, Innovation, Disaster Preparedness, National Security",
  authors: [{ name: "MAPIM Strategic Centre" }],
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MAGIC',
  },
  openGraph: {
    title: "MAPIM Strategic Centre - MAGIC Digital Humanitarian Initiatives",
    description: "Advancing Malaysia's Digital Humanitarian Future",
    type: "website",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#dc2626',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MAGIC" />
        <meta name="msapplication-TileColor" content="#dc2626" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  );
}
