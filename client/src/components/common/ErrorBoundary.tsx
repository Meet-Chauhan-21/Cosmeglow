import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError() as any;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-light-gray font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-border-gray/50 space-y-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display text-dark">
            Something went wrong
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            {error?.statusText || error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
          >
            <RefreshCw size={14} />
            Reload Page
          </button>
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
          >
            <Home size={14} />
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
