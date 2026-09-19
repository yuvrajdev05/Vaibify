import React, { useState, useEffect } from 'react';
import { VibeItem, VIBE_DEFINITIONS, NormalizedSong } from '../types';
import { musicApi } from '../services/musicApi';
import { storage } from '../utils/storage';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { Play, Sparkles, Shuffle, Radio, ChevronRight, Loader2 } from 'lucide-react';

interface VibeEngineProps {
  onVibeChange?: (vibe: VibeItem) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const VibeEngine: React.FC<VibeEngineProps> = ({ onVibeChange, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();
  const { showToast } = useToast();
  const [selectedVibe, setSelectedVibe] = useState<VibeItem>(() => {
    const savedId = storage.getActiveVibeId();
    return VIBE_DEFINITIONS.find((v) => v.id === savedId) || VIBE_DEFINITIONS[1]; // default Midnight
  });

  const [vibeMix, setVibeMix] = useState<NormalizedSong[]>([]);
  const [loadingMix, setLoadingMix] = useState(false);
  const [quickMixing, setQuickMixing] = useState(false);

  // Load vibe mix when selected vibe changes
  useEffect(() => {
    storage.setActiveVibeId(selectedVibe.id);
    onVibeChange?.(selectedVibe);

    let isMounted = true;
    setLoadingMix(true);

    musicApi.getVibeMix(selectedVibe.id).then((res) => {
      if (isMounted && res && res.tracks) {
        setVibeMix(res.tracks);
      }
      if (isMounted) setLoadingMix(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedVibe]);

  const handleSelectVibe = (vibe: VibeItem) => {
    setSelectedVibe(vibe);
  };

  const handlePlayVibe = () => {
    if (vibeMix.length > 0) {
      playQueue(vibeMix, 0);
      showToast(`Playing ${selectedVibe.name} Mix 🎶`, 'info');
    }
  };

  const handleQuickMix = async () => {
    try {
      setQuickMixing(true);
      const recents = storage.getRecentlyPlayed();
      const favs = storage.getFavorites();
      const res = await musicApi.generateQuickMix(recents, favs, selectedVibe.id);

      if (res && res.tracks && res.tracks.length > 0) {
        playQueue(res.tracks, 0);
        showToast(`⚡ Quick Mix started (${res.tracks.length} tracks)`, 'success');
      } else if (vibeMix.length > 0) {
        playQueue(vibeMix, 0);
      }
    } catch (err) {
      if (vibeMix.length > 0) playQueue(vibeMix, 0);
    } finally {
      setQuickMixing(false);
    }
  };

  return (
    <section id="vaibify-vibe-engine" className="space-y-6">
      {/* Vibe Engine Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide uppercase mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>VAIBIFY Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What's your vibe?
          </h2>
          <p className="text-sm text-neutral-400">
            Tune the atmosphere with a single tap. Adaptive mixes powered by real-time curation.
          </p>
        </div>

        {/* Quick Mix Action */}
        <button
          onClick={handleQuickMix}
          disabled={quickMixing}
          id="vaibify-quick-mix-btn"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          {quickMixing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-200" />
          )}
          <span>Quick Mix</span>
        </button>
      </div>

      {/* Vibe Selection Cards (9 Curated Vibes) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 sm:gap-3">
        {VIBE_DEFINITIONS.map((vibe) => {
          const isSelected = selectedVibe.id === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => handleSelectVibe(vibe)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900/90 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-[1.03]'
                  : 'bg-neutral-900/40 hover:bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-neutral-950" />
              )}
              <span className="text-2xl sm:text-3xl mb-1.5 transform group-hover:scale-110 transition-transform">
                {vibe.emoji}
              </span>
              <span
                className={`text-xs font-bold truncate max-w-full ${
                  isSelected ? 'text-cyan-400 font-extrabold' : 'text-neutral-300 group-hover:text-white'
                }`}
              >
                {vibe.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Vibe Spotlight Card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-neutral-800/80 bg-gradient-to-r ${selectedVibe.ambientClass} transition-colors duration-500 shadow-xl`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{selectedVibe.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                Active Vibe
              </span>
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              {selectedVibe.name} Mix
            </h3>
            <p className="text-sm sm:text-base text-neutral-300">
              {selectedVibe.tagline}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayVibe}
              disabled={loadingMix || vibeMix.length === 0}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-neutral-200 active:scale-95 text-neutral-950 font-bold text-sm shadow-xl shadow-white/10 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loadingMix ? 'Tuning...' : 'Play Vibe Mix'}</span>
            </button>
          </div>
        </div>

        {/* Live track preview pills */}
        {vibeMix.length > 0 && (
          <div className="relative z-10 mt-6 pt-5 border-t border-neutral-800/60 flex flex-wrap gap-2">
            {vibeMix.slice(0, 5).map((song, i) => (
              <button
                key={song.id || i}
                onClick={() => playQueue(vibeMix, i)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs transition-colors cursor-pointer group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                  {song.title}
                </span>
                <span className="text-neutral-400 text-[11px] truncate max-w-[100px]">
                  • {song.artist}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
