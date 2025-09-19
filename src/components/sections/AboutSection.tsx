"use client";

import { Shield, AlertTriangle, TrendingUp } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              About MAGIC
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              The MAPIM Strategic Centre (MAGIC) Digital Humanitarian Initiatives program focuses on leveraging technology to enhance national security, disaster preparedness, and digital transformation across Malaysia.
            </p>
          </div>
          <div className="lg:col-span-2 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">National Security</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Enhancing Malaysia&apos;s digital security infrastructure and threat monitoring capabilities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Disaster Preparedness</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Real-time monitoring and early warning systems for natural disasters and emergencies.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Digital Transformation</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Supporting organizations and government agencies in their digital transformation journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
