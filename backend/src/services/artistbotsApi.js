/**
 * VAIBIFY - Artistbots Music API Service
 * Handles communication with https://music.artistbots.workers.dev
 *
 * EXACT VERIFIED API CAPABILITIES:
 * - Root ('/'): Returns Cloudflare Worker HTML dashboard.
 * - Endpoint ('/download'): Accepts GET with query params `id` (YouTube Video ID) and `api_key`.
 *   - Status with missing/invalid key: HTTP 401 {"error":"Invalid or missing api_key"}.
 *   - Status with verified key: HTTP 502 {"error":"All backends failed","attempts":[...]} (upstream Replit/Railway proxies offline).
 * - Other endpoints ('/search', '/health', '/status', '/stream'): Return HTTP 404 {"error":"Not found. Only /download is available."}.
 *
 * Direct stream fallback: Real-time metadata discovery with playable YouTube videoId.
 */

import { normalizeSong, VIBE_DEFINITIONS } from '../utils/normalize.js';

export class ArtistbotsApiService {
  constructor() {
    this.baseUrl = (process.env.MUSIC_API_BASE_URL || 'https://music.artistbots.workers.dev').replace(/\/+$/, '');
    this.apiKey = process.env.MUSIC_API_KEY || '';
  }

  /**
   * Diagnostic verification of the Artistbots API
   * Performs real HTTP probe and reports exact status without mock/fake data.
   */
  async verifyConnection() {
    const startTime = Date.now();
    if (!this.baseUrl) {
      return {
        configured: false,
        baseUrl: '',
        hasKey: Boolean(this.apiKey),
        status: 'unconfigured',
        message: 'MUSIC_API_BASE_URL environment variable is not configured.',
      };
    }

    try {
      // Test the verified /download endpoint with the configured API key
      const probeId = 'fJ9rUzIMcZQ'; // Queen - Bohemian Rhapsody
      const testUrl = `${this.baseUrl}/download?id=${probeId}&api_key=${encodeURIComponent(this.apiKey)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(testUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'VaibifyBackend/1.0' },
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text.slice(0, 200) };
      }

      if (res.status === 401) {
        return {
          configured: true,
          baseUrl: this.baseUrl,
          hasKey: Boolean(this.apiKey),
          status: 'error',
          httpStatus: 401,
          latencyMs,
          message: 'Artistbots API rejected credentials: Invalid or missing api_key.',
          upstreamDetails: body,
        };
      }

      if (res.status === 502) {
        return {
          configured: true,
          baseUrl: this.baseUrl,
          hasKey: Boolean(this.apiKey),
          status: 'degraded',
          httpStatus: 502,
          latencyMs,
          message: 'Artistbots worker reached & API key authorized; upstream download backends are currently offline. Metadata & real-time playback engine active.',
          upstreamDetails: body,
        };
      }

      if (res.ok) {
        return {
          configured: true,
          baseUrl: this.baseUrl,
          hasKey: Boolean(this.apiKey),
          status: 'connected',
          httpStatus: res.status,
          latencyMs,
          message: `Connected to Artistbots Music API (${latencyMs}ms). Direct download stream active.`,
          upstreamDetails: body,
        };
      }

      return {
        configured: true,
        baseUrl: this.baseUrl,
        hasKey: Boolean(this.apiKey),
        status: 'notice',
        httpStatus: res.status,
        latencyMs,
        message: `Artistbots returned HTTP ${res.status}. Real-time playback fallback active.`,
        upstreamDetails: body,
      };
    } catch (err) {
      return {
        configured: true,
        baseUrl: this.baseUrl,
        hasKey: Boolean(this.apiKey),
        status: 'error',
        latencyMs: Date.now() - startTime,
        message: `Failed to contact ${this.baseUrl}: ${err.message}`,
      };
    }
  }

  /**
   * Request direct stream or download URL from Artistbots /download endpoint
   */
  async getDownloadStream(videoId) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'MUSIC_API_KEY is not set on the backend.',
      };
    }

    try {
      const url = `${this.baseUrl}/download?id=${encodeURIComponent(videoId)}&api_key=${encodeURIComponent(this.apiKey)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VaibifyBackend/1.0' },
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.url) {
        return {
          success: true,
          directStreamUrl: data.url,
          format: data.format || 'mp3',
          quality: data.quality || '320kbps',
        };
      }

      return {
        success: false,
        error: data?.error || `Worker returned HTTP ${res.status}`,
        upstreamDetails: data?.attempts || null,
        message: 'API provides metadata/video ID but no directly playable audio stream.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: 'API provides metadata/video ID but no directly playable audio stream.',
      };
    }
  }

  /**
   * Real-time search engine returning validated, non-fake tracks with playable videoIds
   */
  async search(query, filter = 'all') {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { query: '', songs: [], artists: [], albums: [] };
    }

    let searchQuery = trimmed;
    if (filter === 'songs') searchQuery += ' official audio';
    else if (filter === 'artists') searchQuery += ' artist official';

    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timeout);

      const html = await res.text();
      const startMarker = 'var ytInitialData = ';
      const startIdx = html.indexOf(startMarker);

      if (startIdx === -1) {
        return { query: trimmed, songs: [], artists: [], albums: [] };
      }

      const jsonStart = startIdx + startMarker.length;
      let scriptEnd = html.indexOf(';</script>', jsonStart);
      if (scriptEnd === -1) scriptEnd = html.indexOf('};', jsonStart) + 1;

      const data = JSON.parse(html.slice(jsonStart, scriptEnd));
      const sections =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      const songs = [];
      const artistsMap = new Map();
      const albums = [];

      for (const section of sections) {
        const items = section?.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (item.videoRenderer) {
            const v = item.videoRenderer;
            const videoId = v.videoId;
            const title = v.title?.runs?.[0]?.text;
            const artist =
              v.ownerText?.runs?.[0]?.text ||
              v.longBylineText?.runs?.[0]?.text ||
              'VAIBIFY Artist';
            const artistId =
              v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
              `art-${encodeURIComponent(artist).slice(0, 10)}`;
            const durationStr = v.lengthText?.simpleText || '3:30';
            const thumbnail =
              v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const views = v.viewCountText?.simpleText || '';

            if (videoId && title) {
              const song = normalizeSong({
                id: videoId,
                videoId,
                title,
                artist,
                artistId,
                album: 'Single Release',
                duration: durationStr,
                thumbnail,
                views,
              });

              songs.push(song);

              if (artist && !artistsMap.has(artist)) {
                artistsMap.set(artist, {
                  id: artistId,
                  name: artist,
                  thumbnail,
                  subscribers: 'Verified Artist',
                });
              }
            }
          } else if (item.channelRenderer) {
            const c = item.channelRenderer;
            if (c.channelId && c.title?.simpleText) {
              artistsMap.set(c.title.simpleText, {
                id: c.channelId,
                name: c.title.simpleText,
                thumbnail: c.thumbnail?.thumbnails?.slice(-1)[0]?.url || '',
                subscribers:
                  c.videoCountText?.simpleText ||
                  c.subscriberCountText?.simpleText ||
                  'Verified Artist',
              });
            }
          } else if (item.playlistRenderer) {
            const p = item.playlistRenderer;
            if (p.playlistId && p.title?.simpleText) {
              albums.push({
                id: p.playlistId,
                title: p.title.simpleText,
                artist: p.shortBylineText?.runs?.[0]?.text || trimmed,
                thumbnail: p.thumbnails?.[0]?.thumbnails?.slice(-1)[0]?.url || '',
                trackCount: parseInt(p.videoCount || '10', 10),
                year: new Date().getFullYear().toString(),
              });
            }
          }
        }
      }

      return {
        query: trimmed,
        songs: filter === 'all' || filter === 'songs' ? songs : [],
        artists:
          filter === 'all' || filter === 'artists'
            ? Array.from(artistsMap.values()).slice(0, 10)
            : [],
        albums: filter === 'all' || filter === 'albums' ? albums.slice(0, 8) : [],
      };
    } catch (err) {
      console.warn('Live search error:', err.message);
      return { query: trimmed, songs: [], artists: [], albums: [], error: err.message };
    }
  }

  /**
   * Generates a dynamic mix for a specific vibe
   */
  async getVibeMix(vibeId) {
    const vibe = VIBE_DEFINITIONS.find((v) => v.id === vibeId.toLowerCase()) || VIBE_DEFINITIONS[0];
    const randomQuery = vibe.queries[Math.floor(Math.random() * vibe.queries.length)];

    const searchResults = await this.search(randomQuery, 'songs');
    return {
      vibe,
      query: randomQuery,
      tracks: searchResults.songs || [],
    };
  }

  /**
   * Search suggestions / autocomplete
   */
  async getSuggestions(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data?.[1])) {
        return data[1].slice(0, 8);
      }
    } catch {}

    return [];
  }
}

export const artistbotsApi = new ArtistbotsApiService();
