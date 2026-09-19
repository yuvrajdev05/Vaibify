/**
 * VAIBIFY - Normalization utilities
 * Standardizes metadata from external sources and Artistbots API
 */

export function parseDurationToSeconds(durationStr) {
  if (typeof durationStr === 'number') return durationStr;
  if (!durationStr || typeof durationStr !== 'string') return 210;

  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

export function normalizeSong(raw) {
  if (!raw) return null;

  const id = raw.id || raw.videoId || (raw.url ? raw.url.split('v=')[1] : `song-${Date.now()}`);
  const title = raw.title || raw.name || 'Untitled Track';
  const artist = raw.artist || raw.author || raw.channelTitle || raw.owner || 'VAIBIFY Artist';
  const album = raw.album || 'VAIBIFY Singles';
  const duration = parseDurationToSeconds(raw.duration || raw.lengthText || raw.duration_seconds || 210);
  const thumbnail =
    raw.thumbnail ||
    raw.image ||
    raw.cover ||
    (raw.videoId || raw.id
      ? `https://i.ytimg.com/vi/${raw.videoId || raw.id}/hqdefault.jpg`
      : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');

  return {
    id: String(id),
    videoId: raw.videoId || (id.length === 11 ? id : null),
    title: String(title),
    artist: String(artist),
    artistId: raw.artistId || `art-${encodeURIComponent(artist).slice(0, 15)}`,
    album: String(album),
    duration,
    thumbnail,
    type: 'song',
    year: raw.year ? String(raw.year) : new Date().getFullYear().toString(),
    views: raw.views || '',
  };
}

export const VIBE_DEFINITIONS = [
  {
    id: 'energy',
    name: 'Energy',
    emoji: '🔥',
    tagline: 'High octane beats & pure adrenaline',
    color: 'from-amber-500 via-orange-600 to-rose-600',
    accentColor: '#f59e0b',
    queries: ['energetic workout music', 'EDM high energy hits', 'epic electronic workout beats'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    tagline: 'Late night cruising & moody vibes',
    color: 'from-indigo-900 via-purple-900 to-slate-950',
    accentColor: '#818cf8',
    queries: ['midnight drive songs', 'late night chill vibes', 'synthwave night cruising'],
  },
  {
    id: 'chill',
    name: 'Chill',
    emoji: '💙',
    tagline: 'Soft acoustic & relaxed downtempo',
    color: 'from-cyan-900 via-sky-800 to-blue-950',
    accentColor: '#38bdf8',
    queries: ['chill acoustic relaxed songs', 'mellow lo-fi beats to relax', 'indie chill afternoon'],
  },
  {
    id: 'focus',
    name: 'Focus',
    emoji: '🧠',
    tagline: 'Instrumental flow & deep concentration',
    color: 'from-emerald-950 via-teal-900 to-cyan-950',
    accentColor: '#34d399',
    queries: ['ambient instrumental study focus', 'deep focus lo-fi beats', 'calm piano concentration'],
  },
  {
    id: 'drive',
    name: 'Drive',
    emoji: '🚗',
    tagline: 'Open highways & neon synthwave',
    color: 'from-violet-950 via-fuchsia-900 to-rose-950',
    accentColor: '#c084fc',
    queries: ['road trip anthems rock', 'synthwave highway drive', 'night drive upbeat hits'],
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🎉',
    tagline: 'Dance anthems & non-stop celebration',
    color: 'from-pink-600 via-rose-500 to-purple-600',
    accentColor: '#f43f5e',
    queries: ['party club dance hits', 'celebration dance pop songs', 'festival bangers edm'],
  },
  {
    id: 'rain',
    name: 'Rain',
    emoji: '🌧️',
    tagline: 'Rainy window lo-fi & gentle reflection',
    color: 'from-slate-800 via-cyan-950 to-slate-950',
    accentColor: '#94a3b8',
    queries: ['rainy day lofi chill', 'acoustic piano rain mood', 'cozy rainy afternoon jazz'],
  },
  {
    id: 'love',
    name: 'Love',
    emoji: '❤️',
    tagline: 'Romantic acoustic & soulful R&B',
    color: 'from-rose-950 via-pink-900 to-red-950',
    accentColor: '#fb7185',
    queries: ['romantic love songs acoustic', 'heartfelt r&b soul love', 'warm acoustic love ballads'],
  },
  {
    id: 'workout',
    name: 'Workout',
    emoji: '⚡',
    tagline: 'Beast mode intensity & heavy drops',
    color: 'from-yellow-500 via-amber-600 to-red-600',
    accentColor: '#fbbf24',
    queries: ['gym workout phonk beast mode', 'heavy bass workout anthems', 'intense gym motivation beats'],
  },
];
