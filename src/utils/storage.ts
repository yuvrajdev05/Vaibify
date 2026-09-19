import { NormalizedSong, Playlist } from '../types';

const STORAGE_KEYS = {
  FAVORITES: 'vaibify_favorites_v1',
  RECENTLY_PLAYED: 'vaibify_recent_v1',
  PLAYLISTS: 'vaibify_playlists_v1',
  SEARCH_HISTORY: 'vaibify_search_history_v1',
  VOLUME: 'vaibify_volume_v1',
  MUTED: 'vaibify_muted_v1',
  SHUFFLE: 'vaibify_shuffle_v1',
  REPEAT: 'vaibify_repeat_v1',
  ACTIVE_VIBE: 'vaibify_active_vibe_v1',
};

const LEGACY_KEYS: Record<string, string> = {
  'vaibify_favorites_v1': 'inaya_favorites_v1',
  'vaibify_recent_v1': 'inaya_recent_v1',
  'vaibify_playlists_v1': 'inaya_playlists_v1',
  'vaibify_search_history_v1': 'inaya_search_history_v1',
};

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-chill-vibes',
    title: 'Midnight Lo-Fi & Chill',
    description: 'Mellow beats, late-night atmospheric vibes, and acoustic soul.',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 's-chill-1',
        title: 'Sunset Dreaming',
        artist: 'Aura Collective',
        artistId: 'art-aura',
        album: 'Twilight Horizons',
        thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        duration: 215,
        videoId: 'jfKfPfyJRdk', // lofi hip hop radio
        type: 'song',
      },
      {
        id: 's-chill-2',
        title: 'Tokyo Rain',
        artist: 'Kyoto Soundscape',
        artistId: 'art-kyoto',
        album: 'Neon Reflections',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        duration: 184,
        videoId: '5qap5aO4i9A',
        type: 'song',
      },
    ],
  },
  {
    id: 'pl-workout-flow',
    title: 'High Voltage Workout',
    description: 'High BPM, driving basslines, and unstoppable energy for gym sessions.',
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 3,
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    songs: [
      {
        id: 's-work-1',
        title: 'Cybernetic Pulse',
        artist: 'Synthwave Ryders',
        artistId: 'art-synth',
        album: 'Overdrive 2099',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
        duration: 242,
        videoId: '4xDzrJKXOOY',
        type: 'song',
      },
    ],
  },
];

// Helper to safely get from localStorage
function get<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    let item = window.localStorage.getItem(key);
    if (!item && LEGACY_KEYS[key]) {
      item = window.localStorage.getItem(LEGACY_KEYS[key]);
      if (item) {
        // Migrate to new vaibify key
        window.localStorage.setItem(key, item);
      }
    }
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

// Helper to safely set in localStorage
function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error setting localStorage key "${key}":`, err);
  }
}

export const storage = {
  // Favorites
  getFavorites(): NormalizedSong[] {
    return get<NormalizedSong[]>(STORAGE_KEYS.FAVORITES, []);
  },

  isFavorite(songId: string): boolean {
    const favs = this.getFavorites();
    return favs.some((s) => s.id === songId);
  },

  toggleFavorite(song: NormalizedSong): boolean {
    const favs = this.getFavorites();
    const exists = favs.some((s) => s.id === song.id);
    let updated: NormalizedSong[];

    if (exists) {
      updated = favs.filter((s) => s.id !== song.id);
    } else {
      updated = [song, ...favs];
    }

    set(STORAGE_KEYS.FAVORITES, updated);
    return !exists;
  },

  // Recently Played
  getRecentlyPlayed(): NormalizedSong[] {
    return get<NormalizedSong[]>(STORAGE_KEYS.RECENTLY_PLAYED, []);
  },

  addRecentlyPlayed(song: NormalizedSong): void {
    const recents = this.getRecentlyPlayed();
    // Filter out previous occurrence if any
    const filtered = recents.filter((s) => s.id !== song.id);
    // Keep max 50 recent items
    const updated = [song, ...filtered].slice(0, 50);
    set(STORAGE_KEYS.RECENTLY_PLAYED, updated);
  },

  clearRecentlyPlayed(): void {
    set(STORAGE_KEYS.RECENTLY_PLAYED, []);
  },

  // Playlists
  getPlaylists(): Playlist[] {
    return get<Playlist[]>(STORAGE_KEYS.PLAYLISTS, DEFAULT_PLAYLISTS);
  },

  savePlaylists(playlists: Playlist[]): void {
    set(STORAGE_KEYS.PLAYLISTS, playlists);
  },

  getPlaylistById(id: string): Playlist | undefined {
    return this.getPlaylists().find((p) => p.id === id);
  },

  createPlaylist(title: string, description = ''): Playlist {
    const playlists = this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim() || 'Untitled Playlist',
      description: description.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      songs: [],
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    };

    const updated = [newPlaylist, ...playlists];
    this.savePlaylists(updated);
    return newPlaylist;
  },

  updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = playlists[index];
    const updatedPlaylist: Playlist = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };

    playlists[index] = updatedPlaylist;
    this.savePlaylists(playlists);
    return updatedPlaylist;
  },

  deletePlaylist(id: string): boolean {
    const playlists = this.getPlaylists();
    const filtered = playlists.filter((p) => p.id !== id);
    this.savePlaylists(filtered);
    return true;
  },

  addSongToPlaylist(playlistId: string, song: NormalizedSong): boolean {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    // Avoid duplicate additions if already in playlist
    if (playlist.songs.some((s) => s.id === song.id)) {
      return false;
    }

    playlist.songs.push(song);
    playlist.updatedAt = Date.now();
    if (!playlist.thumbnail || playlist.songs.length === 1) {
      playlist.thumbnail = song.thumbnail;
    }

    this.savePlaylists(playlists);
    return true;
  },

  removeSongFromPlaylist(playlistId: string, songId: string): boolean {
    const playlists = this.getPlaylists();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return false;

    playlist.songs = playlist.songs.filter((s) => s.id !== songId);
    playlist.updatedAt = Date.now();
    this.savePlaylists(playlists);
    return true;
  },

  // Search History
  getSearchHistory(): string[] {
    return get<string[]>(STORAGE_KEYS.SEARCH_HISTORY, [
      'The Weeknd',
      'Lo-Fi Beats',
      'Dua Lipa',
      'Synthwave',
      'Taylor Swift',
      'Coldplay',
    ]);
  },

  addSearchHistory(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;
    const history = this.getSearchHistory();
    const filtered = history.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 15);
    set(STORAGE_KEYS.SEARCH_HISTORY, updated);
  },

  clearSearchHistory(): void {
    set(STORAGE_KEYS.SEARCH_HISTORY, []);
  },

  // Settings
  getVolume(): number {
    return get<number>(STORAGE_KEYS.VOLUME, 0.8);
  },
  setVolume(vol: number): void {
    set(STORAGE_KEYS.VOLUME, vol);
  },

  getMuted(): boolean {
    return get<boolean>(STORAGE_KEYS.MUTED, false);
  },
  setMuted(muted: boolean): void {
    set(STORAGE_KEYS.MUTED, muted);
  },

  getShuffle(): boolean {
    return get<boolean>(STORAGE_KEYS.SHUFFLE, false);
  },
  setShuffle(shuffle: boolean): void {
    set(STORAGE_KEYS.SHUFFLE, shuffle);
  },

  getRepeat(): 'off' | 'all' | 'one' {
    return get<'off' | 'all' | 'one'>(STORAGE_KEYS.REPEAT, 'off');
  },
  setRepeat(mode: 'off' | 'all' | 'one'): void {
    set(STORAGE_KEYS.REPEAT, mode);
  },

  getActiveVibeId(): string {
    return get<string>(STORAGE_KEYS.ACTIVE_VIBE, 'midnight');
  },
  setActiveVibeId(vibeId: string): void {
    set(STORAGE_KEYS.ACTIVE_VIBE, vibeId);
  },
};
