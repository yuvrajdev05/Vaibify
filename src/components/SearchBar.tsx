import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Sparkles } from 'lucide-react';
import { storage } from '../utils/storage';
import { musicApi } from '../services/musicApi';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  activeFilter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists';
  onFilterChange: (filter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists') => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  activeFilter,
  onFilterChange,
  placeholder = 'Search songs, artists, albums, podcasts...',
  autoFocus = false,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(storage.getSearchHistory());
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const list = await musicApi.getSuggestions(query);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectQuery = (q: string) => {
    onQueryChange(q);
    setShowSuggestions(false);
    storage.addSearchHistory(q);
    setHistory(storage.getSearchHistory());
    onSearch(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelectQuery(query.trim());
    }
  };

  const filters: { id: 'all' | 'songs' | 'artists' | 'albums' | 'playlists'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto space-y-3">
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-neutral-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 shadow-xl transition-all"
        />

        {query && (
          <button
            onClick={() => {
              onQueryChange('');
              setSuggestions([]);
            }}
            className="absolute right-3.5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === f.id
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Suggestions and Search History Dropdown */}
      {showSuggestions && (suggestions.length > 0 || (!query && history.length > 0)) && (
        <div className="absolute left-0 right-0 top-12 mt-2 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-40 backdrop-blur-xl text-sm animate-in fade-in">
          {suggestions.length > 0 ? (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Suggestions
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuery(item)}
                  className="w-full px-3 py-2 text-left rounded-xl hover:bg-neutral-800 flex items-center gap-3 text-neutral-200 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          ) : null}

          {!query && history.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  Recent Searches
                </span>
                <button
                  onClick={() => {
                    storage.clearSearchHistory();
                    setHistory([]);
                  }}
                  className="text-[10px] text-neutral-500 hover:text-rose-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2">
                {history.map((hist, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleSelectQuery(hist)}
                    className="px-3 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  >
                    {hist}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
