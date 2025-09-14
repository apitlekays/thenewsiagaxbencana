'use client';

import { FaTimes, FaShip, FaMapMarkedAlt, FaClock, FaUsers, FaGlobe, FaQuestionCircle } from 'react-icons/fa';
import { useState } from 'react';

interface AboutMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is the Global Sumud Flotilla?",
    answer: "The Global Sumud Flotilla is a humanitarian mission organized to deliver aid to Gaza by sea. It consists of multiple vessels carrying essential supplies and humanitarian aid to support the people of Gaza."
  },
  {
    question: "How often is the tracking data updated?",
    answer: "The vessel tracking data is updated every 10 minutes with real-time positions, ensuring you can monitor the progress of the humanitarian mission continuously."
  },
  {
    question: "What vessels are part of the Sumud Nusantara mission?",
    answer: "The Sumud Nusantara mission includes multiple vessels from different countries, all coordinated to deliver humanitarian aid to Gaza. Each vessel's progress can be tracked individually on this platform."
  },
  {
    question: "How can I support the mission?",
    answer: "You can support the mission by sharing this tracker, spreading awareness about the humanitarian situation in Gaza, and supporting organizations involved in humanitarian aid efforts."
  },
  {
    question: "Is the tracking data accurate?",
    answer: "Yes, the tracking data comes from official maritime tracking systems and is updated regularly. However, please note that vessel positions may have slight delays due to satellite communication constraints."
  },
  {
    question: "What does 'Sumud' mean?",
    answer: "'Sumud' is an Arabic word meaning 'steadfastness' or 'resilience'. It represents the determination and perseverance of the Palestinian people and their supporters in the face of adversity."
  }
];

export default function AboutMissionModal({ isOpen, onClose }: AboutMissionModalProps) {
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <FaShip className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">About the Mission</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Mission Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Global Sumud Flotilla Mission</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Global Sumud Flotilla is a humanitarian mission organized to deliver aid to Gaza by sea. 
                This international effort brings together vessels from different countries, all coordinated to 
                deliver essential supplies and humanitarian aid to support the people of Gaza.
              </p>
              <p className="text-gray-700 leading-relaxed">
                &ldquo;Sumud&rdquo; is an Arabic word meaning &ldquo;steadfastness&rdquo; or &ldquo;resilience,&rdquo; representing the determination 
                and perseverance of the Palestinian people and their supporters in the face of adversity.
              </p>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaMapMarkedAlt className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Real-time Tracking</h4>
                    <p className="text-gray-600 text-sm">Monitor vessel positions and routes with live updates every 10 minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaClock className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Timeline View</h4>
                    <p className="text-gray-600 text-sm">Track mission progress with interactive timeline controls</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaUsers className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Multi-vessel Support</h4>
                    <p className="text-gray-600 text-sm">Track multiple vessels simultaneously in the Global Sumud Flotilla</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FaGlobe className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Global Mission</h4>
                    <p className="text-gray-600 text-sm">Supporting humanitarian aid delivery to Gaza through international cooperation</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mission Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Mission Details</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Mission Type:</span>
                  <span>Humanitarian Aid Delivery</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Destination:</span>
                  <span>Gaza, Palestine</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Update Frequency:</span>
                  <span>Every 10 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tracking System:</span>
                  <span>Real-time maritime tracking</span>
                </div>
              </div>
            </div>
            
            {/* Support Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">How You Can Support</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Share this tracker to spread awareness about the humanitarian mission
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Support organizations involved in humanitarian aid efforts
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Stay informed about the situation in Gaza and humanitarian needs
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Advocate for peaceful resolution and humanitarian access
                </li>
              </ul>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <FaQuestionCircle className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h3>
            </div>
            
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{faq.question}</span>
                    <span className={`transform transition-transform ${openFAQIndex === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFAQIndex === index && (
                    <div className="px-6 pb-4 text-gray-600 border-t border-gray-100">
                      <p className="pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
