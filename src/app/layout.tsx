import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
  },
  openGraph: {
    title: "MAPIM Strategic Centre - MAGIC Digital Humanitarian Initiatives",
    description: "Advancing Malaysia's Digital Humanitarian Future",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
