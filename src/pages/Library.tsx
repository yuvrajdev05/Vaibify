import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { NormalizedSong, Playlist } from '../types';
import { MusicCard } from '../components/MusicCard';
import { Heart, ListMusic, Clock, Plus, Music2, ArrowRight } from 'lucide-react';

interface LibraryProps {
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
  onOpenCreatePlaylist: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  onNavigate,
  onAddToPlaylist,
  onOpenCreatePlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'favorites' | 'recents'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<NormalizedSong[]>([]);
  const [recents, setRecents] = useState<NormalizedSong[]>([]);

  useEffect(() => {
    setPlaylists(storage.getPlaylists());
    setFavorites(storage.getFavorites());
    setRecents(storage.getRecentlyPlayed());
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Music Library</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage your created playlists, favorite tracks, and listening history.
          </p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4 text-cyan-400" />
          Playlists ({playlists.length})
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          Favorites ({favorites.length})
        </button>

        <button
          onClick={() => setActiveTab('recents')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'recents'
              ? 'bg-neutral-800 text-white shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-indigo-400" />
          Recent ({recents.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Create Playlist Tile */}
            <div
              onClick={onOpenCreatePlaylist}
              className="group p-4 rounded-2xl border border-dashed border-neutral-800 hover:border-cyan-500/50 bg-neutral-900/30 hover:bg-neutral-900/60 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 group-hover:bg-cyan-500/20 text-neutral-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-sm text-neutral-200 group-hover:text-cyan-400 transition-colors">
                Create Playlist
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">Add tracks and customize vibe</p>
            </div>

            {/* Existing Playlists */}
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onNavigate(`/playlist/${pl.id}`)}
                className="group p-3 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800/80 transition-all cursor-pointer select-none"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
                  {pl.thumbnail ? (
                    <img
                      src={pl.thumbnail}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                      <Music2 className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-400 truncate transition-colors">
                  {pl.title}
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="text-center py-16 max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-neutral-200">No favorite songs yet</h3>
              <p className="text-xs text-neutral-500">
                Click the heart icon on any song to save your personal favorites here.
              </p>
              <button
                onClick={() => onNavigate('/')}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
              >
                Explore Music
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {favorites.map((song, idx) => (
                <MusicCard
                  key={`fav-${song.id}`}
                  song={song}
                  layout="row"
                  index={idx}
                  queueContext={favorites}
                  onAddToPlaylist={onAddToPlaylist}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recents' && (
        <div className="space-y-4">
          {recents.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 text-sm">
              No recent listening history yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recents.map((song, idx) => (
                <MusicCard
                  key={`recent-${song.id}`}
                  song={song}
                  layout="row"
                  index={idx}
                  queueContext={recents}
                  onAddToPlaylist={onAddToPlaylist}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
