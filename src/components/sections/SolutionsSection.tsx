"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  MapPin, 
  BarChart3, 
  Heart, 
  Lock,
  Zap,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function SolutionsSection() {
  return (
    <section id="solutions" className="py-24 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Digital Humanitarian Solutions
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Comprehensive technology platforms designed to enhance Malaysia&apos;s humanitarian technological capabilities and national resilience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* SiagaX Bencana */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-900 dark:text-white">SiagaX Bencana</CardTitle>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Maintenance</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Real-time disaster monitoring and alert system for Malaysia with advanced early warning capabilities
              </CardDescription>
              <Button variant="outline" className="w-full group" disabled>
                Temporarily Unavailable
              </Button>
            </CardContent>
          </Card>

          {/* SiagaX Sumud Nusantara */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-900 dark:text-white">SiagaX Sumud Nusantara</CardTitle>
                <Badge className="bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-green-500/30 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></div>
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Digital vessel tracking and management system for humanitarian missions by sea
              </CardDescription>
                <Button className="w-full group animate-pulse bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                  <Link href="/sumudnusantara">
                    Live Tracker
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
            </CardContent>
          </Card>

          {/* SiagaX Analitika */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-900 dark:text-white">SiagaX Analitika</CardTitle>
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Advanced project management and reporting platform for Civil Society Organisations
              </CardDescription>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* SiagaX Bantu */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-900 dark:text-white">SiagaX Bantu</CardTitle>
                <Badge className="bg-slate-500 hover:bg-slate-600 text-white">Planning</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Comprehensive digital donor, warehouse and asnaf data management for CSOs
              </CardDescription>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* SiagaX Cyber */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-900 dark:text-white">SiagaX Cyber</CardTitle>
                <Badge className="bg-slate-500 hover:bg-slate-600 text-white">Planning</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Comprehensive digital security and threat monitoring platform
              </CardDescription>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Custom Solution */}
          <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/20 dark:to-amber-900/20 border-2 border-dashed border-emerald-300 dark:border-emerald-700">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">Custom Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 dark:text-slate-300 mb-6">
                Need a tailored solution? Let&apos;s build something amazing together for your organization
              </CardDescription>
              <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white group" asChild>
                <a href="mailto:&#115;&#97;&#108;&#97;&#109;&#64;&#109;&#97;&#112;&#105;&#109;&#46;&#111;&#114;&#103;">
                  Contact Us
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
