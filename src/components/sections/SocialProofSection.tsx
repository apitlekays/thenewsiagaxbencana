"use client";

import Image from "next/image";

export default function SocialProofSection() {
  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
            Trusted by organizations around the world
          </p>
        </div>
        
        {/* Animated Logo Carousel */}
        <div className="relative">
          <div className="flex animate-scroll space-x-12 items-center">
            {/* Logo set 1 */}
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo1.png" alt="MyAQSA Defenders" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo2.png" alt="PCGM" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo3.webp" alt="MAPIM Official" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo4.png" alt="Malaysia Coat of Arms" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo5.png" alt="Dubai Humanitarian" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo6.png" alt="DIHAD" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo7.png" alt="CSM Logo" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo8.png" alt="Sumud Logo" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo9.png" alt="Global Sumud Flotilla" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            
            {/* Logo set 2 - Exact duplicate for seamless loop */}
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo1.png" alt="MyAQSA Defenders" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo2.png" alt="PCGM" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo3.webp" alt="MAPIM Official" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo4.png" alt="Malaysia Coat of Arms" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo5.png" alt="Dubai Humanitarian" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo6.png" alt="DIHAD" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo7.png" alt="CSM Logo" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo8.png" alt="Sumud Logo" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
            <div className="flex-shrink-0 w-32 h-16 flex items-center justify-center">
              <Image src="/logos/logo9.png" alt="Global Sumud Flotilla" width={128} height={64} className="h-12 w-auto grayscale opacity-60 hover:opacity-80 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
