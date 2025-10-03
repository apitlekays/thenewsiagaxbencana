import React from 'react';

interface SecondLastPositionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function SecondLastPositionToggle({ enabled, onToggle }: SecondLastPositionToggleProps) {
  return (
    <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="sr-only"
        />
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-300'
        }`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </div>
      </label>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          Show Second-to-Last Positions
        </span>
        <span className="text-xs text-gray-500">
          {enabled ? 'Showing previous positions' : 'Showing current positions'}
        </span>
      </div>
    </div>
  );
}
