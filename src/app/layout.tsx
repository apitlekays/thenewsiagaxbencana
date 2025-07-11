import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAPIM Strategic Centre - MAGIC Digital Initiatives",
  description: "MAPIM Strategic Centre (MAGIC) is dedicated to driving digital transformation and innovation across Malaysia through cutting-edge technology initiatives including disaster monitoring, data analytics, and digital security.",
  keywords: "MAPIM, Malaysia, digital transformation, disaster monitoring, SiagaX, humanitarian, technology",
  authors: [{ name: "MAPIM Strategic Centre" }],
  creator: "MAPIM Strategic Centre",
  publisher: "MAPIM Strategic Centre",
  robots: "index, follow",
  metadataBase: new URL('https://magic.mapim.dev'),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://magic.mapim.dev",
    siteName: "MAPIM Strategic Centre",
    title: "MAPIM Strategic Centre - MAGIC Digital Initiatives",
    description: "Advancing Malaysia's Digital Humanitarian Future through cutting-edge technology initiatives.",
    images: [
      {
        url: "/metaImage.png",
        width: 1200,
        height: 630,
        alt: "MAPIM Strategic Centre - MAGIC Digital Initiatives",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAPIM Strategic Centre - MAGIC Digital Initiatives",
    description: "Advancing Malaysia's Digital Humanitarian Future through cutting-edge technology initiatives.",
    images: ["/metaImage.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f2937",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Q3PZCKPNXS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q3PZCKPNXS');
          `}
        </Script>
      </head>
      <body className={inter.className} style={{ minHeight: '100vh', height: '100%', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
