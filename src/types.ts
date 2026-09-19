export type SongType = 'song' | 'video';

export interface NormalizedSong {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  thumbnail: string;
  duration: number; // in seconds
  streamUrl?: string;
  videoId?: string;
  type: SongType;
  year?: string | number;
  views?: string;
}

export interface NormalizedArtist {
  id: string;
  name: string;
  thumbnail?: string;
  subscribers?: string;
  description?: string;
  topSongs?: NormalizedSong[];
  albums?: NormalizedAlbum[];
  relatedArtists?: {
    id: string;
    name: string;
    thumbnail?: string;
  }[];
}

export interface NormalizedAlbum {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnail: string;
  year?: string;
  trackCount?: number;
  tracks?: NormalizedSong[];
  duration?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  songs: NormalizedSong[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface SearchResults {
  query: string;
  songs: NormalizedSong[];
  artists: NormalizedArtist[];
  albums: NormalizedAlbum[];
  playlists: Playlist[];
}

export interface ApiStatus {
  configured: boolean;
  baseUrl: string;
  hasKey: boolean;
  status: 'connected' | 'unconfigured' | 'error';
  message?: string;
  latencyMs?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export interface VibeItem {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  accentColor: string;
  ambientClass: string;
  queries: string[];
}

export const VIBE_DEFINITIONS: VibeItem[] = [
  {
    id: 'energy',
    name: 'Energy',
    emoji: '🔥',
    tagline: 'High octane beats & pure adrenaline',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    accentColor: '#f59e0b',
    ambientClass: 'from-amber-950/30 via-orange-950/20 to-neutral-950',
    queries: ['energetic workout music', 'EDM high energy hits', 'epic electronic workout beats'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    tagline: 'Late night cruising & moody vibes',
    gradient: 'from-indigo-600 via-purple-700 to-slate-900',
    accentColor: '#818cf8',
    ambientClass: 'from-indigo-950/40 via-purple-950/25 to-neutral-950',
    queries: ['midnight drive songs', 'late night chill vibes', 'synthwave night cruising'],
  },
  {
    id: 'chill',
    name: 'Chill',
    emoji: '💙',
    tagline: 'Soft acoustic & relaxed downtempo',
    gradient: 'from-cyan-600 via-sky-600 to-blue-800',
    accentColor: '#38bdf8',
    ambientClass: 'from-cyan-950/30 via-sky-950/20 to-neutral-950',
    queries: ['chill acoustic relaxed songs', 'mellow lo-fi beats to relax', 'indie chill afternoon'],
  },
  {
    id: 'focus',
    name: 'Focus',
    emoji: '🧠',
    tagline: 'Instrumental flow & concentration',
    gradient: 'from-emerald-600 via-teal-700 to-cyan-900',
    accentColor: '#34d399',
    ambientClass: 'from-emerald-950/30 via-teal-950/20 to-neutral-950',
    queries: ['ambient instrumental study focus', 'deep focus lo-fi beats', 'calm piano concentration'],
  },
  {
    id: 'drive',
    name: 'Drive',
    emoji: '🚗',
    tagline: 'Open highways & neon synthwave',
    gradient: 'from-violet-600 via-fuchsia-700 to-rose-900',
    accentColor: '#c084fc',
    ambientClass: 'from-violet-950/35 via-fuchsia-950/20 to-neutral-950',
    queries: ['road trip anthems rock', 'synthwave highway drive', 'night drive upbeat hits'],
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🎉',
    tagline: 'Dance anthems & non-stop celebration',
    gradient: 'from-pink-500 via-rose-600 to-purple-700',
    accentColor: '#f43f5e',
    ambientClass: 'from-pink-950/35 via-rose-950/20 to-neutral-950',
    queries: ['party club dance hits', 'celebration dance pop songs', 'festival bangers edm'],
  },
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    tagline: 'Rainy window lo-fi & gentle reflection',
    gradient: 'from-slate-600 via-cyan-800 to-slate-900',
    accentColor: '#94a3b8',
    ambientClass: 'from-slate-950/40 via-cyan-950/20 to-neutral-950',
    queries: ['rainy day lofi chill', 'acoustic piano rain mood', 'cozy rainy afternoon jazz'],
  },
  {
    id: 'love',
    name: 'Love',
    emoji: '❤️',
    tagline: 'Romantic ballads & warm soul',
    gradient: 'from-rose-500 via-pink-600 to-red-700',
    accentColor: '#fb7185',
    ambientClass: 'from-rose-950/35 via-pink-950/20 to-neutral-950',
    queries: ['romantic love songs acoustic', 'heartfelt r&b soul love', 'warm acoustic love ballads'],
  },
  {
    id: 'workout',
    name: 'Workout',
    emoji: '⚡',
    tagline: 'Beast mode intensity & heavy bass',
    gradient: 'from-yellow-500 via-amber-600 to-red-700',
    accentColor: '#fbbf24',
    ambientClass: 'from-yellow-950/35 via-amber-950/20 to-neutral-950',
    queries: ['gym workout phonk beast mode', 'heavy bass workout anthems', 'intense gym motivation beats'],
  },
];

