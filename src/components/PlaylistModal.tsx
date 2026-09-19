import React, { useState } from 'react';
import { NormalizedSong, Playlist } from '../types';
import { storage } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { X, Plus, Music2, Check } from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  songToAdd?: NormalizedSong | null;
  onPlaylistCreated?: (playlist: Playlist) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  songToAdd,
  onPlaylistCreated,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'select' | 'create'>(songToAdd ? 'select' : 'create');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const playlists = storage.getPlaylists();

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a playlist title', 'warning');
      return;
    }

    const created = storage.createPlaylist(newTitle, newDescription);
    if (songToAdd) {
      storage.addSongToPlaylist(created.id, songToAdd);
      showToast(`Created "${created.title}" and added song!`, 'success');
    } else {
      showToast(`Created playlist "${created.title}"`, 'success');
    }

    if (onPlaylistCreated) {
      onPlaylistCreated(created);
    }

    setNewTitle('');
    setNewDescription('');
    onClose();
  };

  const handleAddToPlaylist = (playlist: Playlist) => {
    if (!songToAdd) return;
    const success = storage.addSongToPlaylist(playlist.id, songToAdd);
    if (success) {
      showToast(`Added to "${playlist.title}"`, 'success');
    } else {
      showToast(`Song already in "${playlist.title}"`, 'info');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="text-lg font-bold">
            {songToAdd ? 'Add to Playlist' : 'Create Playlist'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {songToAdd && (
          <div className="flex items-center gap-3 my-4 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <img
              src={songToAdd.thumbnail}
              alt={songToAdd.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{songToAdd.title}</div>
              <div className="text-xs text-neutral-400 truncate">{songToAdd.artist}</div>
            </div>
          </div>
        )}

        {songToAdd && (
          <div className="flex gap-2 p-1 mb-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('select')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'select'
                  ? 'bg-neutral-800 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Choose Playlist
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'create'
                  ? 'bg-neutral-800 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              New Playlist
            </button>
          </div>
        )}

        {activeTab === 'select' && songToAdd ? (
          <div className="max-h-60 overflow-y-auto space-y-2 py-2 pr-1">
            {playlists.length === 0 ? (
              <div className="text-center py-6 text-sm text-neutral-400">
                No playlists yet. Create one!
              </div>
            ) : (
              playlists.map((pl) => {
                const alreadyHas = pl.songs.some((s) => s.id === songToAdd.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden">
                        {pl.thumbnail ? (
                          <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music2 className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-neutral-200 group-hover:text-cyan-400 transition-colors">
                          {pl.title}
                        </div>
                        <div className="text-xs text-neutral-400">{pl.songs.length} songs</div>
                      </div>
                    </div>
                    {alreadyHas ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" /> Added
                      </span>
                    ) : (
                      <Plus className="w-4 h-4 text-neutral-500 group-hover:text-white" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Playlist Name
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Late Night Vibes"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What vibe is this playlist?"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all"
              >
                Create Playlist
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
