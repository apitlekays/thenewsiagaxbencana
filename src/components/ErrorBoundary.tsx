"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.error('📍 Error Boundary Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'Performance Optimized Components',
    });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-8">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-400">
              ⚠️ Performance Component Error
            </h2>
            <p className="text-slate-300 mb-4">
              Something went wrong with a performance-critical component. The application will continue to work, but some optimizations may be disabled.
            </p>
            <details className="text-xs text-slate-400 text-left">
              <summary className="cursor-pointer hover:text-slate-200">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-slate-800 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
