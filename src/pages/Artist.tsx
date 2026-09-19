import React, { useState, useEffect } from 'react';
import { musicApi } from '../services/musicApi';
import { NormalizedArtist, NormalizedSong, NormalizedAlbum } from '../types';
import { MusicCard } from '../components/MusicCard';
import { AlbumCard } from '../components/AlbumCard';
import { ArtistCard } from '../components/ArtistCard';
import { usePlayer } from '../context/PlayerContext';
import { Play, Shuffle, UserCheck, Disc3, Radio, Sparkles } from 'lucide-react';

interface ArtistProps {
  id: string;
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Artist: React.FC<ArtistProps> = ({ id, onNavigate, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();

  const [artist, setArtist] = useState<NormalizedArtist | null>(null);
  const [topSongs, setTopSongs] = useState<NormalizedSong[]>([]);
  const [albums, setAlbums] = useState<NormalizedAlbum[]>([]);
  const [related, setRelated] = useState<NormalizedArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtist() {
      try {
        setLoading(true);
        const data = await musicApi.getArtist(id);
        if (data) {
          setArtist(data);
          setTopSongs(data.topSongs || []);
          setAlbums(data.albums || []);
          setRelated(data.relatedArtists || []);
        }
      } catch (err) {
        console.error('Failed to load artist:', err);
      } finally {
        setLoading(false);
      }
    }
    loadArtist();
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

  if (!artist) {
    return (
      <div className="text-center py-24 space-y-3">
        <h2 className="text-xl font-bold text-white">Artist not found</h2>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 rounded-xl bg-neutral-800 text-xs text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-in fade-in">
      {/* Artist Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl min-h-[260px] sm:min-h-[320px] flex items-end p-6 sm:p-10">
        {/* Background artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-50 scale-105"
          style={{ backgroundImage: `url(${artist.thumbnail})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-cyan-500/40 shadow-2xl bg-neutral-800 shrink-0">
            <img
              src={artist.thumbnail}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Artist
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {artist.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 flex items-center justify-center sm:justify-start gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              {artist.subscribers || 'YouTube Creator'}
            </p>
          </div>
        </div>
      </div>

      {/* Play Actions */}
      {topSongs.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => playQueue(topSongs, 0)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            Play Top Tracks
          </button>

          <button
            onClick={() => {
              const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
              playQueue(shuffled, 0);
            }}
            className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer"
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Songs */}
      {topSongs.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-bold text-lg text-white">Popular Tracks</h3>
          <div className="space-y-1">
            {topSongs.map((song, idx) => (
              <MusicCard
                key={`artist-song-${song.id}`}
                song={song}
                layout="row"
                index={idx}
                queueContext={topSongs}
                onAddToPlaylist={onAddToPlaylist}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-lg text-white">Discography & Albums</h3>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
            {albums.map((alb) => (
              <AlbumCard
                key={`artist-alb-${alb.id}`}
                album={alb}
                onClick={() => onNavigate(`/album/${alb.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Artists */}
      {related.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-white">Fans Also Like</h3>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
            {related.map((rel) => (
              <ArtistCard
                key={`rel-${rel.id}`}
                artist={rel}
                onClick={() => onNavigate(`/artist/${rel.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
