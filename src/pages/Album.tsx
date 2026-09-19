import React, { useState, useEffect } from 'react';
import { musicApi } from '../services/musicApi';
import { NormalizedAlbum, NormalizedSong } from '../types';
import { MusicCard } from '../components/MusicCard';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { Play, Shuffle, Disc3, Clock } from 'lucide-react';

interface AlbumProps {
  id: string;
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Album: React.FC<AlbumProps> = ({ id, onNavigate, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();

  const [album, setAlbum] = useState<NormalizedAlbum | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlbum() {
      try {
        setLoading(true);
        const data = await musicApi.getAlbum(id);
        if (data) {
          setAlbum(data);
        }
      } catch (err) {
        console.error('Failed to load album:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlbum();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-3xl bg-neutral-900" />
        <div className="h-8 w-40 bg-neutral-900 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-900" />
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-24 space-y-3">
        <h2 className="text-xl font-bold text-white">Album not found</h2>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 rounded-xl bg-neutral-800 text-xs text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  const tracks = album.tracks || [];
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Album Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-950/30 via-neutral-900 to-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl bg-neutral-800 shrink-0 ring-1 ring-white/10">
          <img
            src={album.thumbnail}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
            Album
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white truncate">
            {album.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-neutral-300">
            <span
              onClick={() => {
                if (album.artistId) onNavigate(`/artist/${album.artistId}`);
              }}
              className={`font-semibold ${album.artistId ? 'hover:underline hover:text-white cursor-pointer' : ''}`}
            >
              {album.artist}
            </span>
            {album.year && (
              <>
                <span>•</span>
                <span>{album.year}</span>
              </>
            )}
            <span>•</span>
            <span className="text-neutral-400 text-xs">
              {tracks.length} songs, {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Play Controls */}
      {tracks.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => playQueue(tracks, 0)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            Play Album
          </button>

          <button
            onClick={() => {
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playQueue(shuffled, 0);
            }}
            className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer"
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tracks */}
      <section className="space-y-1">
        {tracks.map((song, idx) => (
          <MusicCard
            key={`album-track-${song.id}`}
            song={song}
            layout="row"
            index={idx}
            queueContext={tracks}
            onAddToPlaylist={onAddToPlaylist}
            onNavigate={onNavigate}
          />
        ))}
      </section>
    </div>
  );
};
