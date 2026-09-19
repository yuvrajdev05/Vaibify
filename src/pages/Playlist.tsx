import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { Playlist as PlaylistType, NormalizedSong } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { MusicCard } from '../components/MusicCard';
import { useToast } from '../context/ToastContext';
import {
  Play,
  Shuffle,
  Trash2,
  Edit2,
  Check,
  X,
  Music2,
  Clock,
  Share2,
} from 'lucide-react';

interface PlaylistProps {
  id: string;
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
  id,
  onNavigate,
  onAddToPlaylist,
}) => {
  const { playQueue } = usePlayer();
  const { showToast } = useToast();

  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    const pl = storage.getPlaylistById(id);
    if (pl) {
      setPlaylist(pl);
      setEditTitle(pl.title);
      setEditDesc(pl.description || '');
    } else {
      setPlaylist(null);
    }
  }, [id]);

  if (!playlist) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto animate-in fade-in">
        <Music2 className="w-12 h-12 text-neutral-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Playlist Not Found</h2>
        <p className="text-xs text-neutral-400">
          This playlist may have been deleted or the link is invalid.
        </p>
        <button
          onClick={() => onNavigate('/playlists')}
          className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
        >
          View All Playlists
        </button>
      </div>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const updated = storage.updatePlaylist(playlist.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });

    if (updated) {
      setPlaylist(updated);
      setIsEditing(false);
      showToast('Playlist updated', 'success');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      storage.deletePlaylist(playlist.id);
      showToast(`Deleted playlist "${playlist.title}"`, 'info');
      onNavigate('/playlists');
    }
  };

  const handleRemoveSong = (songId: string) => {
    storage.removeSongFromPlaylist(playlist.id, songId);
    const updated = storage.getPlaylistById(playlist.id);
    if (updated) setPlaylist(updated);
    showToast('Removed track from playlist', 'info');
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-neutral-900 to-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl bg-neutral-800 flex items-center justify-center overflow-hidden shadow-2xl shrink-0 ring-1 ring-white/10">
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music2 className="w-16 h-16 text-neutral-600" />
          )}
        </div>

        <div className="space-y-3 text-center sm:text-left min-w-0 flex-1 w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Public Playlist
          </span>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-cyan-500 text-lg font-bold text-white focus:outline-none"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-neutral-300 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-semibold text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white truncate">
                  {playlist.title}
                </h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Rename Playlist"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {playlist.description && (
                <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
                  {playlist.description}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-neutral-400 font-mono">
                <span>{playlist.songs.length} songs</span>
                <span>•</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {playlist.songs.length > 0 && (
            <>
              <button
                onClick={() => playQueue(playlist.songs, 0)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                Play All
              </button>

              <button
                onClick={() => {
                  const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
                  playQueue(shuffled, 0);
                }}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="p-2.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Delete playlist"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Delete Playlist</span>
        </button>
      </div>

      {/* Song Tracks */}
      {playlist.songs.length === 0 ? (
        <div className="text-center py-20 max-w-sm mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <Music2 className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-neutral-200">Playlist is empty</h3>
          <p className="text-xs text-neutral-500">
            Search or browse songs, click the three dots on any track, and choose "Add to playlist".
          </p>
          <button
            onClick={() => onNavigate('/search')}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
          >
            Find Songs
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.songs.map((song, idx) => (
            <div key={`${song.id}-${idx}`} className="relative group">
              <MusicCard
                song={song}
                layout="row"
                index={idx}
                queueContext={playlist.songs}
                onAddToPlaylist={onAddToPlaylist}
                onNavigate={onNavigate}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSong(song.id);
                }}
                className="absolute right-20 sm:right-24 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from playlist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
