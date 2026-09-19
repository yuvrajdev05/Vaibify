import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { NormalizedSong } from '../types';
import { MusicCard } from '../components/MusicCard';
import { usePlayer } from '../context/PlayerContext';
import { Clock, Play, Trash2, Music } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface RecentProps {
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Recent: React.FC<RecentProps> = ({ onNavigate, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();
  const { showToast } = useToast();
  const [recentSongs, setRecentSongs] = useState<NormalizedSong[]>([]);

  useEffect(() => {
    setRecentSongs(storage.getRecentlyPlayed());
  }, []);

  const handleClear = () => {
    storage.clearRecentlyPlayed();
    setRecentSongs([]);
    showToast('Recently played history cleared', 'info');
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-950/40 shrink-0">
            <Clock className="w-14 h-14 text-white" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              History
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Recently Played</h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              {recentSongs.length} {recentSongs.length === 1 ? 'track' : 'tracks'} listened to
              recently
            </p>
          </div>
        </div>

        {recentSongs.length > 0 && (
          <div className="flex items-center gap-3 self-center sm:self-end">
            <button
              onClick={() => playQueue(recentSongs, 0)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Play All
            </button>

            <button
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Song List */}
      {recentSongs.length === 0 ? (
        <div className="text-center py-20 max-w-sm mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 shadow-xl">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-neutral-200">No Listening History Yet</h3>
          <p className="text-xs text-neutral-500">
            Songs you play will automatically appear here so you can easily jump back in.
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Start Listening
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {recentSongs.map((song, idx) => (
            <MusicCard
              key={`recent-${song.id}-${idx}`}
              song={song}
              layout="row"
              index={idx}
              queueContext={recentSongs}
              onAddToPlaylist={onAddToPlaylist}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
