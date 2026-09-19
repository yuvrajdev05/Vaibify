import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Music2,
  Sparkles,
} from 'lucide-react';
import { musicApi } from '../services/musicApi';
import { ApiStatus } from '../types';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenApiConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenApiConfig,
}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  useEffect(() => {
    musicApi.getStatus().then(setApiStatus).catch(() => null);
  }, []);

  return (
    <header
      id="vaibify-top-header"
      className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4"
    >
      {/* Left: History navigation & Mobile Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand */}
        <div
          onClick={() => onNavigate('/')}
          className="flex md:hidden items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md border border-neutral-800 shrink-0">
            <img src="/logo.png" alt="Vaibify" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-wider">
            VAIB<span className="text-cyan-400">IFY</span>
          </span>
        </div>

        {/* Desktop Back / Forward controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            title="Go forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center/Right: Quick Search shortcut & API status button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!currentPath.startsWith('/search') && (
          <button
            onClick={() => onNavigate('/search')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs sm:text-sm transition-all"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Search songs, artists...</span>
            <span className="sm:hidden">Search</span>
          </button>
        )}

        {/* API Settings button */}
        <button
          onClick={onOpenApiConfig}
          className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
          title="Configure API Connection"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus?.status === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            }`}
          />
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden md:inline">
            {apiStatus?.status === 'connected' ? 'API Active' : 'API Setup'}
          </span>
        </button>
      </div>
    </header>
  );
};
