import { Metadata } from 'next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Mail, MapPin, Calendar, Lock, Eye } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: 'Privacy Policy - MAPIM Strategic Centre',
  description: 'Privacy Policy for MAPIM Strategic Centre\'s digital humanitarian initiatives. Learn how we protect your data and ensure security in our disaster monitoring platform.',
  keywords: 'privacy policy, data protection, MAPIM, Malaysia, digital humanitarian, disaster monitoring, data security, privacy rights',
  authors: [{ name: 'MAPIM Strategic Centre' }],
  creator: 'MAPIM Strategic Centre',
  publisher: 'MAPIM Strategic Centre',
  metadataBase: new URL('https://magic.mapim.dev'),
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy - MAPIM Strategic Centre',
    description: 'Privacy Policy for MAPIM Strategic Centre\'s digital humanitarian initiatives. Learn how we protect your data and ensure security.',
    url: 'https://magic.mapim.dev/privacy',
    siteName: 'MAPIM Strategic Centre',
    images: [
      {
        url: '/mainMeta.png',
        width: 1200,
        height: 630,
        alt: 'MAPIM Strategic Centre - Privacy Policy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy - MAPIM Strategic Centre',
    description: 'Privacy Policy for MAPIM Strategic Centre\'s digital humanitarian initiatives. Learn how we protect your data and ensure security.',
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
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                MAPIM Strategic Centre
              </span>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            MAPIM Strategic Centre - MAGIC Digital Humanitarian Initiatives
          </p>
          <div className="flex items-center justify-center space-x-6 text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Last Updated: 16 September 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>v1.0.32</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* Data Protection Commitment */}
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-600" />
                  Data Protection Commitment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  MAPIM Strategic Centre is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our disaster monitoring platform.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Eye className="w-6 h-6 mr-3 text-emerald-600" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Public Data</h3>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Disaster alert information from official Malaysian government sources
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Weather data and meteorological information
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Geographic location data for disaster monitoring
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Public safety information and emergency protocols
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Usage Data</h3>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Browser type and version
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Operating system information
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      IP address and general location
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Pages visited and time spent on our platform
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Lock className="w-6 h-6 mr-3 text-emerald-600" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Emergency Response:</strong> Provide real-time disaster monitoring and alert systems
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Platform Improvement:</strong> Analyze usage patterns to enhance user experience
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Security:</strong> Protect against unauthorized access and ensure platform security
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Compliance:</strong> Meet legal and regulatory requirements
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Communication:</strong> Send important updates about disaster situations when necessary
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-600" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Encryption of data in transit and at rest
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Regular security audits and updates
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Access controls and authentication measures
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Secure hosting infrastructure
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Regular backups and disaster recovery procedures
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Eye className="w-6 h-6 mr-3 text-emerald-600" />
                  Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Access:</strong> Request information about what data we hold about you
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Correction:</strong> Request correction of inaccurate information
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Deletion:</strong> Request deletion of your personal data
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Portability:</strong> Request a copy of your data in a portable format
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">Objection:</strong> Object to processing of your personal data
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Mail className="w-6 h-6 mr-3 text-emerald-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <a href="mailto:&#115;&#97;&#108;&#97;&#109;&#64;&#109;&#97;&#112;&#105;&#109;&#46;&#111;&#114;&#103;" className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors">
                      &#115;&#97;&#108;&#97;&#109;&#64;&#109;&#97;&#112;&#105;&#109;&#46;&#111;&#114;&#103;
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="text-slate-600 dark:text-slate-300">MAPIM Strategic Centre, Malaysia</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 mb-4">&copy; 2025 MAPIM Strategic Centre. All rights reserved.</p>
          <div className="flex justify-center space-x-4">
            <span className="text-slate-400">v1.0.32</span>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
