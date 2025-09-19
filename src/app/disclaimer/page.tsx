"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Mail, MapPin, Calendar, Shield, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Disclaimer() {
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
      <section className="py-16 bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Disclaimer
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
            
            {/* Important Notice */}
            <Card className="border-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  This disclaimer governs your use of MAPIM Strategic Centre&apos;s disaster monitoring platform. By using this platform, you accept this disclaimer in full.
                </p>
              </CardContent>
            </Card>

            {/* Information Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-600" />
                  Information Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  While we strive to provide accurate and up-to-date information:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Information is provided &quot;as is&quot; without warranties of any kind
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    We do not guarantee the accuracy, completeness, or timeliness of data
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Disaster information may change rapidly and should be verified with official sources
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Users should always consult official government sources for critical decisions
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    We are not responsible for any decisions made based on information from this platform
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3 text-orange-600" />
                  Limitation of Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  MAPIM Strategic Centre shall not be liable for:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Any direct, indirect, incidental, or consequential damages
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Loss of life, property, or data resulting from use of this platform
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Interruptions in service or data availability
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Actions taken by users based on platform information
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Third-party content or external links
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Technical issues beyond our reasonable control
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* External Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <ExternalLink className="w-6 h-6 mr-3 text-emerald-600" />
                  External Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  This platform aggregates information from various sources:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300 mb-4">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Official Malaysian government agencies
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Meteorological departments
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Emergency response organizations
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Public safety authorities
                  </li>
                </ul>
                <p className="text-slate-600 dark:text-slate-300">
                  We do not endorse or take responsibility for the accuracy of information from external sources. Users should verify critical information with official authorities.
                </p>
              </CardContent>
            </Card>

            {/* Service Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-600" />
                  Service Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  We strive to maintain high service availability, but:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Service may be interrupted for maintenance or updates
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Technical issues may affect data availability
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    We do not guarantee 24/7 uninterrupted service
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    During emergencies, service may be affected by high demand
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Users should have alternative information sources available
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Emergency Situations */}
            <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="text-2xl text-red-800 dark:text-red-300 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                  Emergency Situations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-300 font-semibold text-lg">
                    ⚠️ Critical Notice
                  </p>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  In emergency situations, always follow official government instructions and emergency protocols. This platform is a supplementary information source and should not replace official emergency communications.
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Contact emergency services (999) for immediate assistance
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Follow evacuation orders from local authorities
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Monitor official government channels for updates
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Do not rely solely on this platform for emergency decisions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Acceptance of Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-600" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  By using this platform, you acknowledge that:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You have read and understood this disclaimer
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You accept the limitations and conditions stated herein
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You will use the platform responsibly and at your own risk
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You will not hold MAPIM Strategic Centre liable for any damages
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You understand this is not a substitute for official emergency services
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
                  For questions about this disclaimer or platform usage:
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
