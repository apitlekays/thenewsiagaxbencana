"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Ship } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Advancing Malaysia&apos;s{" "}
              <span className="bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                Digital Humanitarian Future
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Cutting-edge technology solutions for national security, disaster preparedness, and digital transformation across Malaysia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-4 text-lg font-semibold group"
                onClick={() => {
                  document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore Solutions
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Real-time Monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Advanced Analytics</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-amber-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 text-sm text-slate-600 dark:text-slate-300">Live Dashboard</div>
                </div>
              </div>
              <div>
                <div className="aspect-video bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-600 dark:to-slate-700 rounded-br-lg rounded-bl-lg flex items-center justify-center relative overflow-hidden">
                  {/* World Map Background */}
                  <div className="absolute inset-0 opacity-20">
                    <Image
                      src="/world-map.svg"
                      alt="World Map"
                      fill
                      className="object-cover"
                      style={{ 
                        filter: 'brightness(1.3) contrast(0.8)',
                        mixBlendMode: 'overlay'
                      }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Large Yellow Pulsing Map Marker */}
                    <div className="relative">
                      {/* Pulsing outer ring */}
                      <div className="absolute inset-0 w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                      {/* Main marker */}
                      <div className="relative w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        {/* Ship icon inside marker */}
                        <Ship className="w-8 h-8 text-white" />
                        {/* Triangle pointing direction (heading indicator) - smaller with more offset */}
                        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent border-b-yellow-300 transform rotate-45 absolute -top-4 -right-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
