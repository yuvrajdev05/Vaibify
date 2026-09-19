import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Library,
  Heart,
  Clock,
  ListMusic,
  Plus,
  Radio,
  Sparkles,
  Music2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { storage } from '../utils/storage';
import { Playlist, ApiStatus } from '../types';
import { musicApi } from '../services/musicApi';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenApiConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  onOpenCreatePlaylist,
  onOpenApiConfig,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  useEffect(() => {
    setPlaylists(storage.getPlaylists());
    musicApi.getStatus().then(setApiStatus).catch(() => null);
  }, [currentPath]);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Library', path: '/library', icon: Library },
    { label: 'Favorites', path: '/favorites', icon: Heart },
    { label: 'Recently Played', path: '/recent', icon: Clock },
    { label: 'Playlists', path: '/playlists', icon: ListMusic },
  ];

  return (
    <aside
      id="vaibify-sidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 bg-neutral-950 border-r border-neutral-800/80 p-5 h-screen sticky top-0 shrink-0 text-neutral-300 select-none overflow-hidden"
    >
      {/* Brand Header */}
      <div
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 cursor-pointer group pb-6"
      >
        <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all border border-neutral-800 shrink-0">
          <img src="/logo.png" alt="Vaibify" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>

        <div>
          <div className="flex items-center gap-1 font-black text-xl tracking-wider text-white">
            <span>VAIB</span>
            <span className="text-cyan-400">IFY</span>
          </div>
          <p className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
            Find Your Vibe.
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="space-y-1 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          return (
            <button
              key={item.path}
              id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-neutral-400 group-hover:text-white'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Playlists Divider & Action */}
      <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          My Playlists
        </span>
        <button
          onClick={onOpenCreatePlaylist}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          title="Create Playlist"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-4">
        {playlists.map((pl) => {
          const isSelected = currentPath === `/playlist/${pl.id}`;
          return (
            <button
              key={pl.id}
              onClick={() => onNavigate(`/playlist/${pl.id}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left truncate transition-colors ${
                isSelected
                  ? 'text-cyan-400 bg-neutral-900'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">{pl.title}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom API Health / Integration Badge */}
      <div className="pt-3 border-t border-neutral-800/80">
        <button
          onClick={onOpenApiConfig}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 transition-all text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                apiStatus?.status === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              }`}
            />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-neutral-200 truncate">
                {apiStatus?.status === 'connected' ? 'API Connected' : 'Catalog Mode'}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">
                {apiStatus?.baseUrl ? apiStatus.baseUrl.replace(/^https?:\/\//, '') : 'YouTube Audio Active'}
              </div>
            </div>
          </div>
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 hover:text-cyan-400 shrink-0" />
        </button>
      </div>
    </aside>
  );
};
