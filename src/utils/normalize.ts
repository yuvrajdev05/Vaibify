import { NormalizedAlbum, NormalizedArtist, NormalizedSong, Playlist } from '../types';
import { parseDurationToSeconds } from './formatDuration';

const FALLBACK_THUMBNAIL = '/wallpaper.png';

/**
 * Extracts best thumbnail URL from various API shapes
 */
export function extractThumbnail(item: any): string {
  if (!item) return FALLBACK_THUMBNAIL;

  if (typeof item === 'string' && item.startsWith('http')) {
    return item;
  }

  // Check thumbnails array
  if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
    // Pick the highest resolution or last item
    const sorted = [...item.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0]?.url || sorted[0] || FALLBACK_THUMBNAIL;
  }

  // Check single thumbnail fields
  if (item.thumbnail) {
    if (typeof item.thumbnail === 'string') return item.thumbnail;
    if (item.thumbnail.url) return item.thumbnail.url;
  }

  if (item.image) {
    if (typeof item.image === 'string') return item.image;
    if (item.image.url) return item.image.url;
  }

  if (item.cover) {
    if (typeof item.cover === 'string') return item.cover;
    if (item.cover.url) return item.cover.url;
  }

  if (item.artworkUrl) return item.artworkUrl;
  if (item.albumArt) return item.albumArt;

  // If videoId is present, derive YouTube high-res thumbnail
  const vid = item.videoId || item.id;
  if (vid && typeof vid === 'string' && vid.length === 11) {
    return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  }

  return FALLBACK_THUMBNAIL;
}

/**
 * Extracts artist name and artistId from diverse API responses
 */
export function extractArtist(item: any): { name: string; id?: string } {
  if (!item) return { name: 'Unknown Artist' };

  // If artists array
  if (Array.isArray(item.artists) && item.artists.length > 0) {
    const primary = item.artists[0];
    const name = typeof primary === 'string' ? primary : primary.name || primary.title || 'Unknown Artist';
    const id = typeof primary === 'object' ? primary.id || primary.browseId || primary.channelId : undefined;
    return { name, id };
  }

  // If single artist string or object
  if (item.artist) {
    if (typeof item.artist === 'string') return { name: item.artist };
    if (typeof item.artist === 'object') {
      return {
        name: item.artist.name || item.artist.title || 'Unknown Artist',
        id: item.artist.id || item.artist.browseId,
      };
    }
  }

  if (item.author) {
    if (typeof item.author === 'string') return { name: item.author };
    if (typeof item.author === 'object') {
      return {
        name: item.author.name || 'Unknown Artist',
        id: item.author.id || item.author.channelId,
      };
    }
  }

  if (item.uploaderName) {
    return {
      name: item.uploaderName,
      id: item.uploaderUrl?.replace('/channel/', '') || item.uploaderId,
    };
  }

  if (item.channelTitle) {
    return {
      name: item.channelTitle,
      id: item.channelId,
    };
  }

  return { name: 'Unknown Artist' };
}

/**
 * Normalizes any raw song object from the user's API into the uniform internal format
 */
export function normalizeSong(apiSong: any): NormalizedSong {
  if (!apiSong) {
    return {
      id: `err-${Math.random().toString(36).substr(2, 6)}`,
      title: 'Unknown Track',
      artist: 'Unknown Artist',
      thumbnail: FALLBACK_THUMBNAIL,
      duration: 0,
      type: 'song',
    };
  }

  // Video ID or primary ID
  const videoId =
    apiSong.videoId ||
    (typeof apiSong.id === 'string' && apiSong.id.length === 11 ? apiSong.id : undefined) ||
    apiSong.youtubeId ||
    apiSong.vId;

  const id = String(apiSong.id || videoId || `song-${Math.random().toString(36).substr(2, 8)}`);
  const title = apiSong.title || apiSong.name || apiSong.songTitle || 'Untitled Track';

  const { name: artist, id: artistId } = extractArtist(apiSong);

  // Album info
  let album: string | undefined;
  let albumId: string | undefined;
  if (apiSong.album) {
    if (typeof apiSong.album === 'string') album = apiSong.album;
    else if (typeof apiSong.album === 'object') {
      album = apiSong.album.name || apiSong.album.title;
      albumId = apiSong.album.id || apiSong.album.browseId;
    }
  }

  // Duration
  let duration = 0;
  if (apiSong.duration !== undefined) {
    duration = parseDurationToSeconds(apiSong.duration);
  } else if (apiSong.duration_seconds !== undefined) {
    duration = Number(apiSong.duration_seconds);
  } else if (apiSong.lengthSeconds !== undefined) {
    duration = Number(apiSong.lengthSeconds);
  } else if (apiSong.approxDurationMs !== undefined) {
    duration = Math.floor(Number(apiSong.approxDurationMs) / 1000);
  }

  const thumbnail = extractThumbnail(apiSong);

  // Audio Stream or Direct URL
  const streamUrl =
    apiSong.streamUrl ||
    apiSong.audioUrl ||
    apiSong.downloadUrl ||
    apiSong.url ||
    (apiSong.streams && apiSong.streams[0]?.url) ||
    undefined;

  const type = apiSong.type === 'video' ? 'video' : 'song';

  return {
    id,
    title,
    artist,
    artistId,
    album,
    albumId,
    thumbnail,
    duration,
    streamUrl,
    videoId: videoId || id,
    type,
    year: apiSong.year || apiSong.releaseDate || apiSong.uploadDate?.slice(0, 4),
    views: apiSong.views || apiSong.viewCount,
  };
}

/**
 * Normalizes artist data
 */
export function normalizeArtist(apiArtist: any): NormalizedArtist {
  if (!apiArtist) {
    return {
      id: 'unknown-artist',
      name: 'Unknown Artist',
      thumbnail: FALLBACK_THUMBNAIL,
    };
  }

  const id = String(apiArtist.id || apiArtist.browseId || apiArtist.channelId || `art-${Date.now()}`);
  const name = apiArtist.name || apiArtist.title || apiArtist.artist || 'Unknown Artist';
  const thumbnail = extractThumbnail(apiArtist);

  const topSongs = Array.isArray(apiArtist.topSongs || apiArtist.songs || apiArtist.tracks)
    ? (apiArtist.topSongs || apiArtist.songs || apiArtist.tracks).map(normalizeSong)
    : [];

  const albums = Array.isArray(apiArtist.albums || apiArtist.discography)
    ? (apiArtist.albums || apiArtist.discography).map(normalizeAlbum)
    : [];

  const relatedArtists = Array.isArray(apiArtist.relatedArtists || apiArtist.similarArtists)
    ? (apiArtist.relatedArtists || apiArtist.similarArtists).map((ra: any) => ({
        id: String(ra.id || ra.browseId || ra.channelId || ''),
        name: ra.name || ra.title || 'Related Artist',
        thumbnail: extractThumbnail(ra),
      }))
    : [];

  return {
    id,
    name,
    thumbnail,
    subscribers: apiArtist.subscribers || apiArtist.subscriberCount || apiArtist.followers,
    description: apiArtist.description || apiArtist.bio,
    topSongs,
    albums,
    relatedArtists,
  };
}

/**
 * Normalizes album data
 */
export function normalizeAlbum(apiAlbum: any): NormalizedAlbum {
  if (!apiAlbum) {
    return {
      id: 'unknown-album',
      title: 'Unknown Album',
      artist: 'Unknown Artist',
      thumbnail: FALLBACK_THUMBNAIL,
    };
  }

  const id = String(apiAlbum.id || apiAlbum.browseId || apiAlbum.playlistId || `alb-${Date.now()}`);
  const title = apiAlbum.title || apiAlbum.name || 'Untitled Album';
  const { name: artist, id: artistId } = extractArtist(apiAlbum);
  const thumbnail = extractThumbnail(apiAlbum);

  const tracks = Array.isArray(apiAlbum.tracks || apiAlbum.songs)
    ? (apiAlbum.tracks || apiAlbum.songs).map(normalizeSong)
    : [];

  const totalDuration = tracks.reduce((acc: number, t: NormalizedSong) => acc + (t.duration || 0), 0);

  return {
    id,
    title,
    artist,
    artistId,
    thumbnail,
    year: String(apiAlbum.year || apiAlbum.releaseDate || ''),
    trackCount: tracks.length || apiAlbum.trackCount || apiAlbum.songCount,
    tracks,
    duration: totalDuration || apiAlbum.duration,
  };
}

/**
 * Normalizes playlist data
 */
export function normalizePlaylist(apiPlaylist: any): Playlist {
  if (!apiPlaylist) {
    return {
      id: `pl-${Date.now()}`,
      title: 'Untitled Playlist',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      songs: [],
    };
  }

  const id = String(apiPlaylist.id || apiPlaylist.browseId || `pl-${Date.now()}`);
  const title = apiPlaylist.title || apiPlaylist.name || 'Untitled Playlist';
  const description = apiPlaylist.description || '';
  const thumbnail = extractThumbnail(apiPlaylist);

  const songs = Array.isArray(apiPlaylist.tracks || apiPlaylist.songs || apiPlaylist.content)
    ? (apiPlaylist.tracks || apiPlaylist.songs || apiPlaylist.content).map(normalizeSong)
    : [];

  return {
    id,
    title,
    description,
    thumbnail: thumbnail || (songs[0] ? songs[0].thumbnail : undefined),
    createdAt: apiPlaylist.createdAt || Date.now(),
    updatedAt: apiPlaylist.updatedAt || Date.now(),
    songs,
  };
}
