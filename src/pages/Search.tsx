import React, { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { musicApi } from '../services/musicApi';
import { SearchResults, NormalizedSong } from '../types';
import { MusicCard } from '../components/MusicCard';
import { ArtistCard } from '../components/ArtistCard';
import { AlbumCard } from '../components/AlbumCard';
import { Search as SearchIcon, AlertCircle, Music, Disc3, Radio } from 'lucide-react';

interface SearchProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
  onAddToPlaylist: (song: NormalizedSong) => void;
}

export const Search: React.FC<SearchProps> = ({
  initialQuery = '',
  onNavigate,
  onAddToPlaylist,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (q: string, filter = activeFilter) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await musicApi.search(q, filter);
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleFilterChange = (filter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists') => {
    setActiveFilter(filter);
    if (query.trim()) {
      executeSearch(query, filter);
    }
  };

  const hasSongs = results && results.songs.length > 0;
  const hasArtists = results && results.artists.length > 0;
  const hasAlbums = results && results.albums.length > 0;
  const hasAnyResults = hasSongs || hasArtists || hasAlbums;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Search Header & Input */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Search Music & Artists
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Find any song, album, or creator across the YouTube Music catalog.
        </p>

        <div className="pt-3">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={(q) => executeSearch(q)}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            autoFocus={!initialQuery}
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 max-w-5xl mx-auto pt-4">
          <div className="h-6 w-36 bg-neutral-900 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-neutral-900/80 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-3 my-8">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="font-semibold text-rose-200">Search Error</h3>
          <p className="text-xs text-neutral-400">{error}</p>
          <button
            onClick={() => executeSearch(query)}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty Search Prompt (Initial state) */}
      {!loading && !results && !error && (
        <div className="max-w-xl mx-auto text-center py-12 space-y-6">
          <div className="space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-cyan-400 shadow-xl">
              <SearchIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-200">
              What do you want to listen to?
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Search any song, artist, or album across YouTube Music, or tap a trending topic below.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Trending Searches
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'Coldplay',
                'Taylor Swift',
                'The Weeknd',
                'Arijit Singh',
                'Ed Sheeran',
                'Dua Lipa',
                'Lo-Fi Chill Beats',
                'Synthwave 80s',
                'Workout Motivation',
                'Piano Relaxing',
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    executeSearch(term);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-900/90 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-neutral-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results Found */}
      {!loading && results && !hasAnyResults && (
        <div className="max-w-md mx-auto text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500 shadow-xl">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">
            No results found for "{results.query}"
          </h3>
          <p className="text-xs text-neutral-500">
            Check the spelling, try searching for a different keyword, or switch filters.
          </p>
        </div>
      )}

      {/* Results Display */}
      {!loading && results && hasAnyResults && (
        <div className="space-y-10 max-w-5xl mx-auto">
          {/* Songs Results */}
          {(activeFilter === 'all' || activeFilter === 'songs') && hasSongs && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-lg text-white">Songs ({results.songs.length})</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.songs.map((song, idx) => (
                  <MusicCard
                    key={`search-song-${song.id}`}
                    song={song}
                    layout="row"
                    index={idx}
                    queueContext={results.songs}
                    onAddToPlaylist={onAddToPlaylist}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists Results */}
          {(activeFilter === 'all' || activeFilter === 'artists') && hasArtists && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-lg text-white">Artists</h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar">
                {results.artists.map((artist) => (
                  <ArtistCard
                    key={`search-artist-${artist.id}`}
                    artist={artist}
                    onClick={() => onNavigate(`/artist/${artist.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums Results */}
          {(activeFilter === 'all' || activeFilter === 'albums') && hasAlbums && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Disc3 className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-lg text-white">Albums</h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar">
                {results.albums.map((album) => (
                  <AlbumCard
                    key={`search-album-${album.id}`}
                    album={album}
                    onClick={() => onNavigate(`/album/${album.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
