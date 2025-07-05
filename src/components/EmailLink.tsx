'use client';

import { FaCopy , FaEnvelope } from 'react-icons/fa';
import { useState } from 'react';

export default function EmailLink() {
  const [isRevealed, setIsRevealed] = useState(false);
  const realEmail = 'salam@mapim.org';
  const obfuscatedEmail = 's***m@mapim.org';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRevealed) {
      setIsRevealed(true);
    }
    navigator.clipboard.writeText(realEmail);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-600">
        <FaEnvelope className="text-blue-400" />
        <span className="text-gray-300">
          Email: {isRevealed ? realEmail : obfuscatedEmail}
        </span>
        {!isRevealed && (
          <button
            onClick={() => {
              setIsRevealed(true);
              navigator.clipboard.writeText(realEmail);
            }}
            className="ml-2 text-xs text-blue-400 hover:text-blue-300 underline"
            title="Click to reveal and copy email"
          >
            (reveal)
          </button>
        )}
        {isRevealed && (
          <span className="ml-2 text-xs text-green-400">
            ✓ copied
          </span>
        )}
      </div>
      <a 
        href="mailto:salam@mapim.org"
        onClick={handleClick}
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors border border-blue-500"
        title="Click to copy email address"
      >
        <FaCopy  className="mr-2" />
        Copy Email
      </a>
    </div>
  );
} 