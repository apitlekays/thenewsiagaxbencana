import { Metadata } from 'next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, MapPin, Ship, Users, Activity, Clock, Navigation } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import packageJson from '../../../package.json';

export const metadata: Metadata = {
  title: 'About Sumud Nusantara - Global Sumud Flotilla Tracking System',
  description: 'Learn about the SiagaX Sumud Nusantara vessel tracking system supporting the Global Sumud Flotilla humanitarian mission. Real-time GPS tracking, fleet management, and mission monitoring.',
  keywords: 'Sumud Nusantara, Global Sumud Flotilla, vessel tracking system, humanitarian mission, Gaza, maritime tracking, fleet management, real-time GPS, SiagaX',
  authors: [{ name: 'MAPIM Strategic Centre' }],
  creator: 'MAPIM Strategic Centre',
  publisher: 'MAPIM Strategic Centre',
  metadataBase: new URL('https://magic.mapim.dev'),
  alternates: {
    canonical: '/about-sumudnusantara',
  },
  openGraph: {
    title: 'About Sumud Nusantara - Global Sumud Flotilla Tracking System',
    description: 'Learn about the SiagaX Sumud Nusantara vessel tracking system supporting the Global Sumud Flotilla humanitarian mission.',
    url: 'https://magic.mapim.dev/about-sumudnusantara',
    siteName: 'MAPIM Strategic Centre',
    images: [
      {
        url: '/sumudflotillametaimage.png',
        width: 1200,
        height: 630,
        alt: 'Sumud Nusantara - Global Sumud Flotilla Tracking System',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Sumud Nusantara - Global Sumud Flotilla Tracking System',
    description: 'Learn about the SiagaX Sumud Nusantara vessel tracking system supporting the Global Sumud Flotilla humanitarian mission.',
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

export default function AboutSumudNusantaraPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                MAPIM Strategic Centre
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sumudnusantara" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors font-medium">
                <MapPin className="w-5 h-5" />
                <span>Live Tracker</span>
              </Link>
              <Link href="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Ship className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              SiagaX Sumud Nusantara
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-6">
              Real-time digital vessel tracking and management system for the Global Sumud Flotilla humanitarian missions
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Badge className="bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-green-500/30 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping"></div>
                Live System
              </Badge>
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400">
                Real-time Tracking
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Global Sumud Flotilla Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              About the Global Sumud Flotilla
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">
              The largest coordinated civilian flotilla in history, sailing to break the illegal siege on Gaza
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center">
                  <Ship className="w-6 h-6 text-emerald-600 mr-2" />
                  Mission Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    The Global Sumud Flotilla is a coordinated, nonviolent fleet of vessels sailing from ports across the Mediterranean to break the Israeli occupation&apos;s illegal siege on Gaza. This summer, dozens of boats will set sail from ports around the world, converging toward Gaza in the largest coordinated civilian flotilla in history.
                  </p>
                  <p>
                    Delegations from 39 countries have already committed to sail to Gaza as part of this historic maritime mission to break Israel&apos;s illegal siege and open a humanitarian corridor.
                  </p>
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-2" />
                  Coalition Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    The flotilla brings together coordinators, organizers, and participants from the Maghreb Sumud Flotilla, Freedom Flotilla Coalition, Global Movement to Gaza, and Sumud Nusantara - united under a common goal to break the illegal siege on Gaza by sea.
                  </p>
                  <p>
                    We are a coalition of everyday people—organizers, humanitarians, doctors, artists, clergy, lawyers, and seafarers—who believe in human dignity and the power of nonviolent action.
                  </p>
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">When the World Stays Silent, We Set Sail</h3>
            <p className="text-emerald-100 text-lg mb-6">
              Our efforts build on decades of Palestinian resistance and international solidarity. Though we belong to different nations, faiths, and political beliefs, we are united by a single truth: the siege and genocide must end.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 px-6 py-3" asChild>
                <a href="https://globalsumudflotilla.org/" target="_blank" rel="noopener noreferrer">
                  Learn More About the Flotilla
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              System Features
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive vessel tracking capabilities for humanitarian operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Real-time GPS Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Live position updates and route monitoring for all vessels in the humanitarian fleet
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Status Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Monitor vessel status, speed, heading, and operational conditions in real-time
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Route Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Advanced route planning and optimization for humanitarian missions
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Fleet Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Comprehensive fleet overview and management capabilities
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Historical Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Access historical tracking data and mission reports
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Ship className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">Vessel Details</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Detailed vessel information and specifications
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Live Dashboard Preview
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Experience the power of real-time vessel tracking
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-4 text-sm text-slate-600 dark:text-slate-300">SiagaX Sumud Nusantara - Live Dashboard</div>
              </div>
            </div>
            <div className="p-8">
              <div className="aspect-video bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-600 dark:to-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                <Image
                  src="/aboutTracker.png"
                  alt="SiagaX Sumud Nusantara Dashboard"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Track Humanitarian Vessels?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Access the full SiagaX Sumud Nusantara platform for comprehensive vessel tracking and management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold" asChild>
              <Link href="/sumudnusantara">
                Access Live Tracker
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <p className="text-slate-400">&copy; 2025 MAPIM Strategic Centre. All rights reserved. v{packageJson.version}</p>
          </div>
          
          {/* Forensic Architecture Credit */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-700">
            <span className="text-slate-500 text-sm">Vessel tracking data provided by:</span>
            <a 
              href="https://forensic-architecture.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
            >
              <Image 
                src="/forensic-architecture-logo.svg" 
                alt="Forensic Architecture" 
                width={90}
                height={37}
                className="h-6 w-auto"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
