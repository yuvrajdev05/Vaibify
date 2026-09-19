import React, { useState, useEffect } from 'react';
import { musicApi } from '../services/musicApi';
import { NormalizedAlbum, NormalizedArtist, NormalizedSong, VibeItem } from '../types';
import { MusicCard } from '../components/MusicCard';
import { ArtistCard } from '../components/ArtistCard';
import { AlbumCard } from '../components/AlbumCard';
import { VibeEngine } from '../components/VibeEngine';
import { storage } from '../utils/storage';
import { usePlayer } from '../context/PlayerContext';
import {
  TrendingUp,
  Sparkles,
  Flame,
  Radio,
  Compass,
  Play,
  Clock,
  ArrowRight,
  Disc3,
  Search,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onAddToPlaylist }) => {
  const { playQueue } = usePlayer();

  const [activeVibe, setActiveVibe] = useState<VibeItem | null>(null);
  const [trending, setTrending] = useState<NormalizedSong[]>([]);
  const [popular, setPopular] = useState<NormalizedSong[]>([]);
  const [recommended, setRecommended] = useState<NormalizedSong[]>([]);
  const [artists, setArtists] = useState<NormalizedArtist[]>([]);
  const [newReleases, setNewReleases] = useState<NormalizedAlbum[]>([]);
  const [genres, setGenres] = useState<{ id: string; name: string; gradient: string; thumbnail?: string }[]>([]);
  const [recents, setRecents] = useState<NormalizedSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    setRecents(storage.getRecentlyPlayed().slice(0, 6));

    async function loadHomeContent() {
      try {
        setLoading(true);
        const [trendData, popData, recData, artData, relData, genData] = await Promise.all([
          musicApi.getTrending(),
          musicApi.getPopularSongs(),
          musicApi.getRecommended(),
          musicApi.getPopularArtists(),
          musicApi.getNewReleases(),
          musicApi.getGenres(),
        ]);

        setTrending(trendData);
        setPopular(popData);
        setRecommended(recData);
        setArtists(artData);
        setNewReleases(relData);
        setGenres(genData);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeContent();
  }, []);

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-neutral-900 border border-neutral-800/80 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VAIBIFY Music Stream Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {getGreeting()} <span className="text-cyan-400">• Find Your Vibe</span>
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Stream any track, tune into mood-driven vibe mixes, and discover new sounds with
            instant recommendations and real-time playback.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {trending.length > 0 && (
              <button
                onClick={() => playQueue(trending, 0)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Trending
              </button>
            )}

            <button
              onClick={() => onNavigate('/search')}
              className="px-5 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              Quick Search
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative blur */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
      </div>

      {/* VAIBIFY Vibe Engine */}
      <VibeEngine onVibeChange={setActiveVibe} onAddToPlaylist={onAddToPlaylist} />

      {/* Quick Access / Recently Played (if any) */}
      {recents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Recently Played</h2>
            </div>
            <button
              onClick={() => onNavigate('/recent')}
              className="text-xs font-semibold text-neutral-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recents.map((song) => (
              <MusicCard
                key={`recent-${song.id}`}
                song={song}
                layout="row"
                queueContext={recents}
                onAddToPlaylist={onAddToPlaylist}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Music (Horizontal Scroll) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Trending on YouTube Music</h2>
          </div>
          {trending.length > 0 && (
            <button
              onClick={() => playQueue(trending, 0)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Play All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-44 h-56 rounded-2xl bg-neutral-900 animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
            {trending.map((song) => (
              <MusicCard
                key={`trending-${song.id}`}
                song={song}
                queueContext={trending}
                onAddToPlaylist={onAddToPlaylist}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular Songs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Popular Songs & Charts</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {popular.slice(0, 8).map((song, idx) => (
            <MusicCard
              key={`popular-${song.id}`}
              song={song}
              layout="row"
              index={idx}
              queueContext={popular}
              onAddToPlaylist={onAddToPlaylist}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Recommended For You</h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {recommended.map((song) => (
            <MusicCard
              key={`rec-${song.id}`}
              song={song}
              queueContext={recommended}
              onAddToPlaylist={onAddToPlaylist}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Popular Artists</h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {artists.map((artist) => (
            <ArtistCard
              key={`art-${artist.id}`}
              artist={artist}
              onClick={() => onNavigate(`/artist/${artist.id}`)}
            />
          ))}
        </div>
      </section>

      {/* New Releases / Albums */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">New Releases & Albums</h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {newReleases.map((album) => (
            <AlbumCard
              key={`album-${album.id}`}
              album={album}
              onClick={() => onNavigate(`/album/${album.id}`)}
              onPlay={() => {
                if (album.tracks && album.tracks.length > 0) {
                  playQueue(album.tracks, 0);
                } else {
                  onNavigate(`/album/${album.id}`);
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* Genres & Mood Categories */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Explore Genres & Vibes</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {genres.map((genre) => (
            <div
              key={genre.id}
              onClick={() => onNavigate(`/search?q=${encodeURIComponent(genre.name)}`)}
              className={`group relative overflow-hidden h-28 rounded-2xl bg-gradient-to-br ${genre.gradient} p-4 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all select-none`}
            >
              <span className="font-bold text-sm text-white drop-shadow-md">
                {genre.name}
              </span>
              <div className="flex justify-end">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
