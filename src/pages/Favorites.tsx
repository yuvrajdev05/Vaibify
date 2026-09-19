import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { NormalizedSong } from '../types';
import { MusicCard } from '../components/MusicCard';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { Heart, Play, Shuffle, Search, Music } from 'lucide-react';

interface FavoritesProps {
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onNavigate, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();
  const [favorites, setFavorites] = useState<NormalizedSong[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    setFavorites(storage.getFavorites());
  }, []);

  const totalDuration = favorites.reduce((acc, s) => acc + (s.duration || 0), 0);

  const filtered = favorites.filter(
    (s) =>
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-rose-900/40 shrink-0">
          <Heart className="w-20 h-20 text-white fill-white drop-shadow-md" />
        </div>

        <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Liked Songs</h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Your personal collection of loved tracks on VAIBIFY.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-neutral-400 font-mono pt-1">
            <span>{favorites.length} songs</span>
            <span>•</span>
            <span>{formatDuration(totalDuration)} total time</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {favorites.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => playQueue(favorites, 0)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              Play All
            </button>

            <button
              onClick={() => {
                const shuffled = [...favorites].sort(() => Math.random() - 0.5);
                playQueue(shuffled, 0);
              }}
              className="p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Shuffle Play"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>

          {/* Filter within favorites */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search in liked songs..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Songs List */}
      {favorites.length === 0 ? (
        <div className="text-center py-20 max-w-sm mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-neutral-200">No Liked Songs Yet</h3>
          <p className="text-xs text-neutral-500">
            Songs you like by clicking the heart icon will appear here for easy playback.
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors"
          >
            Discover Music
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-xs">
          No songs matched "{filterQuery}".
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((song, idx) => (
            <MusicCard
              key={`fav-song-${song.id}`}
              song={song}
              layout="row"
              index={idx}
              queueContext={filtered}
              onAddToPlaylist={onAddToPlaylist}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
