import type { Metadata } from "next";
import Link from "next/link";
import { FaShieldAlt, FaLock, FaEye, FaDatabase, FaUserShield } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Privacy Policy - MAPIM Strategic Centre",
  description: "Privacy policy for MAPIM Strategic Centre's disaster monitoring and digital initiatives platform.",
  keywords: "privacy policy, data protection, MAPIM, Malaysia, disaster monitoring",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Privacy Policy</h1>
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
              <FaShieldAlt className="text-blue-400 text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-white">Data Protection Commitment</h2>
            </div>
            <p className="text-gray-300">
              MAPIM Strategic Centre is committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our disaster monitoring platform.
            </p>
          </div>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaEye className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Public Data</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Disaster alert information from official Malaysian government sources</li>
                <li>• Weather data and meteorological information</li>
                <li>• Geographic location data for disaster monitoring</li>
                <li>• Public safety information and emergency protocols</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-blue-400 mb-3 mt-6">Usage Data</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Browser type and version</li>
                <li>• Operating system information</li>
                <li>• IP address and general location</li>
                <li>• Pages visited and time spent on our platform</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaDatabase className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">How We Use Your Information</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <ul className="text-gray-300 space-y-3">
                <li>• <strong>Emergency Response:</strong> Provide real-time disaster monitoring and alert systems</li>
                <li>• <strong>Platform Improvement:</strong> Analyze usage patterns to enhance user experience</li>
                <li>• <strong>Security:</strong> Protect against unauthorized access and ensure platform security</li>
                <li>• <strong>Compliance:</strong> Meet legal and regulatory requirements</li>
                <li>• <strong>Communication:</strong> Send important updates about disaster situations when necessary</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaLock className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Data Security</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Encryption of data in transit and at rest</li>
                <li>• Regular security audits and updates</li>
                <li>• Access controls and authentication measures</li>
                <li>• Secure hosting infrastructure</li>
                <li>• Regular backups and disaster recovery procedures</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FaUserShield className="text-blue-400 text-xl mr-3" />
              <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• <strong>Access:</strong> Request information about what data we hold about you</li>
                <li>• <strong>Correction:</strong> Request correction of inaccurate information</li>
                <li>• <strong>Deletion:</strong> Request deletion of your personal data</li>
                <li>• <strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li>• <strong>Objection:</strong> Object to processing of your personal data</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="text-gray-300 space-y-2">
                <p><strong>Email:</strong> privacy@mapim.dev</p>
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