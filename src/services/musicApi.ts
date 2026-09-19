import {
  ApiStatus,
  NormalizedAlbum,
  NormalizedArtist,
  NormalizedSong,
  Playlist,
  SearchResults,
} from '../types';
import {
  normalizeAlbum,
  normalizeArtist,
  normalizePlaylist,
  normalizeSong,
} from '../utils/normalize';

const API_BASE = '/api/music';

class MusicApiService {
  /**
   * Checks current connection status to the backend and configured YouTube Music API
   */
  async getStatus(): Promise<ApiStatus> {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        configured: false,
        baseUrl: '',
        hasKey: false,
        status: 'error',
        message: err?.message || 'Cannot reach local backend proxy',
      };
    }
  }

  /**
   * Updates and tests the API connection credentials dynamically
   */
  async configure(baseUrl: string, apiKey: string): Promise<ApiStatus> {
    try {
      const res = await fetch(`${API_BASE}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiKey }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return {
        configured: false,
        baseUrl,
        hasKey: Boolean(apiKey),
        status: 'error',
        message: err?.message || 'Failed to update API configuration',
      };
    }
  }

  /**
   * Fetches trending songs and videos
   */
  async getTrending(): Promise<NormalizedSong[]> {
    try {
      const res = await fetch(`${API_BASE}/trending`);
      if (!res.ok) throw new Error(`Failed to fetch trending: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSong) : [];
    } catch (err) {
      console.error('getTrending error:', err);
      return [];
    }
  }

  /**
   * Fetches popular songs / charts
   */
  async getPopularSongs(): Promise<NormalizedSong[]> {
    try {
      const res = await fetch(`${API_BASE}/popular`);
      if (!res.ok) throw new Error(`Failed to fetch popular songs: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSong) : [];
    } catch (err) {
      console.error('getPopularSongs error:', err);
      return [];
    }
  }

  /**
   * Fetches recommended songs
   */
  async getRecommended(): Promise<NormalizedSong[]> {
    try {
      const res = await fetch(`${API_BASE}/recommended`);
      if (!res.ok) throw new Error(`Failed to fetch recommendations: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeSong) : [];
    } catch (err) {
      console.error('getRecommended error:', err);
      return [];
    }
  }

  /**
   * Fetches popular artists
   */
  async getPopularArtists(): Promise<NormalizedArtist[]> {
    try {
      const res = await fetch(`${API_BASE}/artists`);
      if (!res.ok) throw new Error(`Failed to fetch popular artists: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeArtist) : [];
    } catch (err) {
      console.error('getPopularArtists error:', err);
      return [];
    }
  }

  /**
   * Fetches new releases / albums
   */
  async getNewReleases(): Promise<NormalizedAlbum[]> {
    try {
      const res = await fetch(`${API_BASE}/new-releases`);
      if (!res.ok) throw new Error(`Failed to fetch new releases: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeAlbum) : [];
    } catch (err) {
      console.error('getNewReleases error:', err);
      return [];
    }
  }

  /**
   * Fetches genres and categories
   */
  async getGenres(): Promise<{ id: string; name: string; gradient: string; thumbnail?: string }[]> {
    try {
      const res = await fetch(`${API_BASE}/genres`);
      if (!res.ok) throw new Error(`Failed to fetch genres: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('getGenres error:', err);
      return [];
    }
  }

  /**
   * Search songs, artists, albums, playlists
   */
  async search(query: string, filter: 'all' | 'songs' | 'artists' | 'albums' | 'playlists' = 'all'): Promise<SearchResults> {
    if (!query || !query.trim()) {
      return { query: '', songs: [], artists: [], albums: [], playlists: [] };
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        filter,
      });

      const res = await fetch(`${API_BASE}/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Search failed: HTTP ${res.status}`);
      }

      const data = await res.json();

      return {
        query,
        songs: Array.isArray(data.songs) ? data.songs.map(normalizeSong) : [],
        artists: Array.isArray(data.artists) ? data.artists.map(normalizeArtist) : [],
        albums: Array.isArray(data.albums) ? data.albums.map(normalizeAlbum) : [],
        playlists: Array.isArray(data.playlists) ? data.playlists.map(normalizePlaylist) : [],
      };
    } catch (err) {
      console.error('search error:', err);
      throw err;
    }
  }

  /**
   * Search suggestions for autocomplete
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetches full song details
   */
  async getSong(id: string): Promise<NormalizedSong | null> {
    try {
      const res = await fetch(`${API_BASE}/song/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeSong(data);
    } catch (err) {
      console.error('getSong error:', err);
      return null;
    }
  }

  /**
   * Fetches artist details, top songs, and albums
   */
  async getArtist(id: string): Promise<NormalizedArtist | null> {
    try {
      const res = await fetch(`${API_BASE}/artist/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeArtist(data);
    } catch (err) {
      console.error('getArtist error:', err);
      return null;
    }
  }

  /**
   * Fetches album details and track list
   */
  async getAlbum(id: string): Promise<NormalizedAlbum | null> {
    try {
      const res = await fetch(`${API_BASE}/album/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return normalizeAlbum(data);
    } catch (err) {
      console.error('getAlbum error:', err);
      return null;
    }
  }

  /**
   * Fetches playlist details and tracks
   */
  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      const res = await fetch(`${API_BASE}/playlist/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return normalizePlaylist(data);
    } catch (err) {
      console.error('getPlaylist error:', err);
      return null;
    }
  }

  /**
   * Fetches lyrics if available
   */
  async getLyrics(songId: string, title?: string, artist?: string): Promise<{ lyrics: string; synced?: boolean } | null> {
    try {
      const params = new URLSearchParams();
      if (songId) params.append('id', songId);
      if (title) params.append('title', title);
      if (artist) params.append('artist', artist);

      const res = await fetch(`${API_BASE}/lyrics?${params.toString()}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches all curated vibes
   */
  async getVibes() {
    try {
      const res = await fetch(`${API_BASE}/vibes`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.vibes || [];
    } catch {
      return [];
    }
  }

  /**
   * Fetches dynamic track mix for a specific vibe
   */
  async getVibeMix(vibeId: string) {
    try {
      const res = await fetch(`${API_BASE}/vibe/${encodeURIComponent(vibeId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        ...data,
        tracks: Array.isArray(data?.tracks) ? data.tracks.map(normalizeSong) : [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Generates a smart Quick Mix queue combining favorites, recents, and vibe
   */
  async generateQuickMix(recent: NormalizedSong[], favorites: NormalizedSong[], vibeId: string) {
    try {
      const res = await fetch(`${API_BASE}/quickmix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recent, favorites, vibeId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        ...data,
        tracks: Array.isArray(data?.tracks) ? data.tracks.map(normalizeSong) : [],
      };
    } catch {
      return null;
    }
  }
}

export const musicApi = new MusicApiService();
export default musicApi;
