"use client";

import { Globe } from "lucide-react";

export default function Navigation() {
  return (
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
          <div className="hidden md:flex space-x-8">
            <a href="#showcase" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
              Showcase
            </a>
            <a href="#solutions" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
              Solutions
            </a>
            <a href="#about" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
