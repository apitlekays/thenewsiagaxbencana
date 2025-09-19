"use client";

import Navigation from "@/components/sections/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import SocialProofSection from "@/components/sections/SocialProofSection";
import FeaturedShowcaseSection from "@/components/sections/FeaturedShowcaseSection";
import SolutionsSection from "@/components/sections/SolutionsSection";
import AboutSection from "@/components/sections/AboutSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navigation />
      <HeroSection />
      <SocialProofSection />
      <FeaturedShowcaseSection />
      <SolutionsSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </div>
  );
}
