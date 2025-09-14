'use client';

import { FaQuestionCircle } from 'react-icons/fa';
import { useState } from 'react';

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

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-6">
        <FaQuestionCircle className="w-6 h-6 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
      </div>
      
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-800">{faq.question}</span>
              <span className={`transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-gray-600 border-t border-gray-100">
                <p className="pt-4">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

