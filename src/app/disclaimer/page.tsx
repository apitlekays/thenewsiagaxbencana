import type { Metadata } from "next";
import Link from "next/link";
import { FaExclamationTriangle, FaInfoCircle, FaShieldAlt, FaGlobe, FaClock } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Disclaimer - MAPIM Strategic Centre",
  description: "Disclaimer and terms of use for MAPIM Strategic Centre's disaster monitoring and digital initiatives platform.",
  keywords: "disclaimer, terms of use, MAPIM, Malaysia, disaster monitoring, legal",
};

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Disclaimer</h1>
              <p className="text-gray-300 mt-2">MAPIM Strategic Centre - MAGIC Digital Initiatives</p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-400 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-white">Important Notice</h2>
            </div>
                          <p className="text-gray-300">
                This disclaimer governs your use of MAPIM Strategic Centre&apos;s disaster monitoring platform. 
                By using this platform, you accept this disclaimer in full.
              </p>
          </div>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaInfoCircle className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Information Accuracy</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                While we strive to provide accurate and up-to-date information:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Information is provided &quot;as is&quot; without warranties of any kind</li>
                <li>• We do not guarantee the accuracy, completeness, or timeliness of data</li>
                <li>• Disaster information may change rapidly and should be verified with official sources</li>
                <li>• Users should always consult official government sources for critical decisions</li>
                <li>• We are not responsible for any decisions made based on information from this platform</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaShieldAlt className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Limitation of Liability</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                MAPIM Strategic Centre shall not be liable for:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Any direct, indirect, incidental, or consequential damages</li>
                <li>• Loss of life, property, or data resulting from use of this platform</li>
                <li>• Interruptions in service or data availability</li>
                <li>• Actions taken by users based on platform information</li>
                <li>• Third-party content or external links</li>
                <li>• Technical issues beyond our reasonable control</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaGlobe className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">External Sources</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                This platform aggregates information from various sources:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Official Malaysian government agencies</li>
                <li>• Meteorological departments</li>
                <li>• Emergency response organizations</li>
                <li>• Public safety authorities</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We do not endorse or take responsibility for the accuracy of information from external sources. 
                Users should verify critical information with official authorities.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaClock className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Service Availability</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We strive to maintain high service availability, but:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Service may be interrupted for maintenance or updates</li>
                <li>• Technical issues may affect data availability</li>
                <li>• We do not guarantee 24/7 uninterrupted service</li>
                <li>• During emergencies, service may be affected by high demand</li>
                <li>• Users should have alternative information sources available</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Emergency Situations</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 mb-4">
                <p className="text-yellow-200 font-semibold mb-2">⚠️ Critical Notice</p>
                <p className="text-yellow-100">
                  In emergency situations, always follow official government instructions and emergency protocols. 
                  This platform is a supplementary information source and should not replace official emergency communications.
                </p>
              </div>
              <ul className="text-gray-300 space-y-2">
                <li>• Contact emergency services (999) for immediate assistance</li>
                <li>• Follow evacuation orders from local authorities</li>
                <li>• Monitor official government channels for updates</li>
                <li>• Do not rely solely on this platform for emergency decisions</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                By using this platform, you acknowledge that:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• You have read and understood this disclaimer</li>
                <li>• You accept the limitations and conditions stated herein</li>
                <li>• You will use the platform responsibly and at your own risk</li>
                <li>• You will not hold MAPIM Strategic Centre liable for any damages</li>
                <li>• You understand this is not a substitute for official emergency services</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                For questions about this disclaimer or platform usage:
              </p>
              <div className="text-gray-300 space-y-2">
                <p><strong>Email:</strong> legal@mapim.dev</p>
                <p><strong>Address:</strong> MAPIM Strategic Centre, Malaysia</p>
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} MAPIM Strategic Centre. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
              <Link href="/disclaimer" className="text-blue-400 hover:text-blue-300">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 