// @ts-nocheck
import React from 'react';

class GlobalErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-xl font-black text-white italic uppercase mb-4">System Interrupt</h1>
          <p className="text-text-secondary text-xs mb-8">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-white px-8 py-3 rounded text-[10px] font-black uppercase"
          >
            Re-Initialize System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
