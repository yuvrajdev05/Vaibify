import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Playlist, NormalizedSong } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { Plus, Play, Music2, ListMusic } from 'lucide-react';

interface PlaylistsProps {
  onNavigate: (path: string) => void;
  onOpenCreatePlaylist: () => void;
}

export const Playlists: React.FC<PlaylistsProps> = ({
  onNavigate,
  onOpenCreatePlaylist,
}) => {
  const { playQueue } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    setPlaylists(storage.getPlaylists());
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Playlists</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Personalized collections created and stored in your browser.
          </p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all self-start cursor-pointer hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Playlist
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Create Card */}
        <div
          onClick={onOpenCreatePlaylist}
          className="group p-4 rounded-2xl border border-dashed border-neutral-800 hover:border-cyan-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 group-hover:bg-cyan-500/20 text-neutral-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors mb-3 shadow-lg">
            <Plus className="w-7 h-7" />
          </div>
          <h4 className="font-semibold text-sm text-neutral-200 group-hover:text-cyan-400 transition-colors">
            New Playlist
          </h4>
          <p className="text-xs text-neutral-500 mt-1">Curate your own tracks</p>
        </div>

        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => onNavigate(`/playlist/${pl.id}`)}
            className="group relative p-3.5 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/80 border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer select-none"
          >
            <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
              {pl.thumbnail ? (
                <img
                  src={pl.thumbnail}
                  alt={pl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                  <Music2 className="w-12 h-12" />
                </div>
              )}

              {pl.songs.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playQueue(pl.songs, 0);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                  title="Play Playlist"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </button>
              )}
            </div>

            <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-400 truncate transition-colors">
              {pl.title}
            </h4>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              {pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
