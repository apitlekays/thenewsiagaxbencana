"use client";

import { Button } from "@/components/ui/button";
import { Globe, Mail } from "lucide-react";
import packageJson from '../../../package.json';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">MAPIM Strategic Centre</span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              Driving digital transformation and innovation across Malaysia through cutting-edge technology initiatives.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-slate-900 text-slate-800 hover:bg-slate-600" asChild>
                <a href="mailto:&#115;&#97;&#108;&#97;&#109;&#64;&#109;&#97;&#112;&#105;&#109;&#46;&#111;&#114;&#103;">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </a>
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">SiagaX Bencana</a></li>
              <li><a href="/about-sumudnusantara" className="hover:text-white transition-colors">SiagaX Sumud Nusantara</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SiagaX Analitika</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SiagaX Bantu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">SiagaX Cyber</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400">&copy; 2025 MAPIM Strategic Centre. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-slate-400">v{packageJson.version}</span>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-400 text-sm">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
