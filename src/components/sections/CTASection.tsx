"use client";

import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-emerald-800 to-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the digital humanitarian revolution. Let&apos;s build the future of Malaysia&apos;s Humanitarian technology infrastructure together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-4 text-lg font-semibold" asChild>
              <a href="mailto:&#115;&#97;&#108;&#97;&#109;&#64;&#109;&#97;&#112;&#105;&#109;&#46;&#111;&#114;&#103;">
                Contact Us
              </a>
            </Button>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">39+</div>
              <div className="text-blue-100">Active Vessels Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">5</div>
              <div className="text-blue-100">Digital Solutions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Real-time Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
