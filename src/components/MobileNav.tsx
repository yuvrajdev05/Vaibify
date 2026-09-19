import React from 'react';
import { Home, Search, Library, Heart, ListMusic } from 'lucide-react';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate }) => {
  const items = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Library', path: '/library', icon: Library },
    { label: 'Favorites', path: '/favorites', icon: Heart },
    { label: 'Playlists', path: '/playlists', icon: ListMusic },
  ];

  return (
    <div
      id="inaya-mobile-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/95 border-t border-neutral-800/80 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-neutral-400 select-none"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path);

        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-medium transition-colors ${
              isActive ? 'text-cyan-400' : 'hover:text-neutral-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
