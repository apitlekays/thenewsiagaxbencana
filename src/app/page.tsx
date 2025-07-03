import Link from 'next/link';
import Image from 'next/image';
import { FaMapMarkedAlt, FaShieldAlt, FaChartLine, FaUsers, FaRocket, FaArrowRight } from 'react-icons/fa';
import { Metadata } from 'next';
import LottieBackground from '../components/LottieBackground';

// Generate metadata for the home page
export const generateMetadata = (): Metadata => {
  return {
    title: "MAPIM Strategic Centre - Advancing Malaysia's Digital Humanitarian Future",
    description: "MAPIM Strategic Centre (MAGIC) Digital Initiatives program focuses on leveraging technology to enhance national security, disaster preparedness, and digital transformation across Malaysia.",
    keywords: "MAPIM, Malaysia, digital transformation, disaster preparedness, national security, SiagaX, humanitarian technology, MAGIC",
    openGraph: {
      title: "MAPIM Strategic Centre - Advancing Malaysia's Digital Humanitarian Future",
      description: "MAPIM Strategic Centre (MAGIC) Digital Initiatives program focuses on leveraging technology to enhance national security, disaster preparedness, and digital transformation across Malaysia.",
      images: [
        {
          url: "/metaImage.png",
          width: 1200,
          height: 630,
          alt: "MAPIM Strategic Centre - Advancing Malaysia's Digital Humanitarian Future",
        },
      ],
    },
    twitter: {
      title: "MAPIM Strategic Centre - Advancing Malaysia's Digital Humanitarian Future",
      description: "MAPIM Strategic Centre (MAGIC) Digital Initiatives program focuses on leveraging technology to enhance national security, disaster preparedness, and digital transformation across Malaysia.",
      images: ["/metaImage.png"],
    },
  };
};

export default function Home() {
  const initiatives = [
    {
      id: 'siagax-bencana',
      title: 'SiagaX Bencana',
      description: 'Real-time disaster monitoring and alert system for Malaysia',
      icon: FaMapMarkedAlt,
      color: 'bg-red-500',
      href: '/bencana',
      status: 'Live'
    },
    {
      id: 'siagax-analitika',
      title: 'SiagaX Analitika',
      description: 'Advanced project management and reporting for Civil Society Organisations',
      icon: FaChartLine,
      color: 'bg-blue-500',
      href: '#',
      status: 'Coming Soon'
    },
    {
      id: 'siagax-bantu',
      title: 'SiagaX Bantu',
      description: 'Comprehensive digital donor, warehouse and asnaf data management for Civil Society Organisations',
      icon: FaShieldAlt,
      color: 'bg-green-500',
      href: '#',
      status: 'Planning'
    },
    {
      id: 'siagax-cyber',
      title: 'SiagaX Cyber',
      description: 'Comprehensive digital security and threat monitoring',
      icon: FaRocket,
      color: 'bg-purple-500',
      href: '#',
      status: 'Planning'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-white">MAPIM Strategic Centre</h1>
                <p className="text-sm text-blue-300">MAGIC Digital Humanitarian Initiatives</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#about" className="text-gray-300 hover:text-blue-400 transition-colors">About</a>
              <a href="#initiatives" className="text-gray-300 hover:text-blue-400 transition-colors">Initiatives</a>
              <a href="#contact" className="text-gray-300 hover:text-blue-400 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900/20 overflow-hidden">
        <LottieBackground />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* MAPIM Logo */}
          <div className="mb-8">
            <Image 
              src="/mapimlogo.png" 
              alt="MAPIM Logo" 
              width={128}
              height={128}
              className="mx-auto h-32 md:h-48 w-auto opacity-90"
            />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Advancing Malaysia&apos;s
            <span className="text-blue-400 block">Digital Humanitarian Future</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            MAPIM Strategic Centre (MAGIC) is dedicated to driving digital transformation 
            and innovation across Malaysia through cutting-edge technology initiatives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#initiatives"
              className="inline-flex items-center px-8 py-4 bg-gray-800 text-blue-400 font-semibold rounded-lg border-2 border-blue-500 hover:bg-gray-700 transition-colors"
            >
              Explore Initiatives
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">About MAGIC</h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              The MAPIM Strategic Centre (MAGIC) Digital Initiatives program focuses on 
              leveraging technology to enhance national security, disaster preparedness, 
              and digital transformation across Malaysia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500">
                <FaShieldAlt className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">National Security</h4>
              <p className="text-gray-300">
                Enhancing Malaysia&apos;s digital security infrastructure and threat monitoring capabilities.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500">
                <FaMapMarkedAlt className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Disaster Preparedness</h4>
              <p className="text-gray-300">
                Real-time monitoring and early warning systems for natural disasters and emergencies.
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500">
                <FaRocket className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Digital Transformation</h4>
              <p className="text-gray-300">
                Supporting organizations and government agencies in their digital transformation journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Initiatives Section */}
      <section id="initiatives" className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Digital Initiatives</h3>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Explore our cutting-edge digital initiatives designed to enhance Malaysia&apos;s 
              technological capabilities and national resilience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {initiatives.map((initiative) => {
              const IconComponent = initiative.icon;
              return (
                <div 
                  key={initiative.id}
                  className="bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-700 hover:border-blue-500/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${initiative.color} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      initiative.status === 'Live' ? 'bg-green-900/50 text-green-300 border border-green-500' :
                      initiative.status === 'Coming Soon' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500' :
                      'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {initiative.status}
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-semibold text-white mb-2">
                    {initiative.title}
                  </h4>
                  <p className="text-gray-300 mb-4">
                    {initiative.description}
                  </p>
                  
                  {initiative.href !== '#' ? (
                    <Link 
                      href={initiative.href}
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Access Platform
                      <FaArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  ) : (
                    <span className="text-gray-500 font-semibold">Coming Soon</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Get in Touch</h3>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Interested in learning more about our digital initiatives or partnering with MAPIM Strategic Centre?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:salam@mapim.org"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors border border-blue-500"
            >
              <FaUsers className="mr-2" />
              Contact Us
            </a>
            <a 
              href="#"
              className="inline-flex items-center px-6 py-3 bg-gray-800 text-blue-400 font-semibold rounded-lg border-2 border-blue-500 hover:bg-gray-700 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4 text-white">MAPIM Strategic Centre</h4>
              <p className="text-gray-400">
                Driving digital transformation and innovation across Malaysia through 
                cutting-edge technology initiatives.
              </p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4 text-white">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#initiatives" className="hover:text-blue-400 transition-colors">Initiatives</a></li>
                <li><Link href="/bencana" className="hover:text-blue-400 transition-colors">SiagaX Bencana</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4 text-white">Contact</h5>
              <div className="text-gray-400 space-y-2">
                <p>Email: salam@mapim.org</p>
                <p>Phone: +60 13-3158684</p>
                <p>Address: Selangor, Malaysia</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} MAPIM Strategic Centre. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</Link>
              <Link href="/disclaimer" className="text-blue-400 hover:text-blue-300 transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
