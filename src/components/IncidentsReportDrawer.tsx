'use client';

import React from 'react';
import { X, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { useIncidentsData } from '@/hooks/useIncidentsData';

interface IncidentsReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(dateTimeStr: string): { date: string; time: string } {
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      return { date: dateTimeStr, time: 'Invalid Date' };
    }
    
    return {
      date: date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  } catch {
    return { date: dateTimeStr, time: 'Invalid Date' };
  }
}

function getTimeAgo(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return 'Invalid Date';
  }
}

export default function IncidentsReportDrawer({ isOpen, onClose }: IncidentsReportDrawerProps) {
  const { incidents, loading, refreshing, error, refetch } = useIncidentsData();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl z-[2001] overflow-hidden animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-red-400 font-mono text-sm font-bold tracking-wider uppercase">
                INCIDENTS REPORT
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refetch}
                disabled={refreshing}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-blue-500/20 rounded transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                title="Refresh incidents"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 rounded transition-all duration-200 hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && incidents.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-mono">Loading incidents...</span>
              </div>
            </div>
          ) : error && incidents.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-mono">Failed to load incidents</p>
                <button
                  onClick={refetch}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-mono">No incidents reported</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Background refresh indicator */}
              {refreshing && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center space-x-2 text-slate-400 bg-slate-800/50 rounded-lg px-3 py-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="text-xs font-mono">Updating...</span>
                  </div>
                </div>
              )}
              
              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/50 via-amber-500/30 to-slate-600/20"></div>
                
                {incidents.map((incident, index) => {
                  const { date, time } = formatDateTime(incident.datetime);
                  const timeAgo = getTimeAgo(incident.datetime);
                  const isLatest = index === 0;
                  
                  return (
                    <div 
                      key={`${incident.datetime}-${index}`} 
                      className="relative flex items-start space-x-4 pb-6 animate-in fade-in slide-in-from-bottom duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Time dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          isLatest 
                            ? 'bg-red-500/20 border-red-500 animate-pulse' 
                            : 'bg-amber-500/20 border-amber-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            isLatest ? 'bg-red-500' : 'bg-amber-500'
                          }`}></div>
                        </div>
                      </div>
                      
                      {/* Content box */}
                      <div className="flex-1 min-w-0">
                        <div className={`bg-gradient-to-br border rounded-lg shadow-lg backdrop-blur-sm p-3 ${
                          isLatest 
                            ? 'from-red-900/20 via-slate-800 to-red-900/20 border-red-500/30' 
                            : 'from-amber-900/20 via-slate-800 to-amber-900/20 border-amber-500/30'
                        }`}>
                          {/* Header */}
                          <div className={`flex items-center justify-between mb-2 ${
                            isLatest ? 'border-b border-red-500/30 pb-2' : 'border-b border-amber-500/30 pb-2'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isLatest ? 'bg-red-500' : 'bg-amber-500'
                              }`}></div>
                              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
                                isLatest ? 'text-red-400' : 'text-amber-400'
                              }`}>
                                {isLatest ? 'LATEST' : 'INCIDENT'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              {timeAgo}
                            </span>
                          </div>
                          
                          {/* Date and time */}
                          <div className="space-y-1 mb-3">
                            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">DATE & TIME</div>
                            <div className="text-sm font-mono text-white">
                              {date} {time && `• ${time}`}
                            </div>
                          </div>
                          
                          {/* Notes */}
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">REPORT</div>
                            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                              {incident.notes_published}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-700/50 px-4 py-2">
          <div className="text-xs text-slate-500 font-mono text-center">
            {refreshing ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Refreshing...</span>
              </div>
            ) : (
              `Auto-refresh every 15s • ${incidents.length} incidents`
            )}
          </div>
        </div>
      </div>
    </>
  );
}
