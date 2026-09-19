import { Router } from 'express';
import { musicBackend } from '../services/musicBackend';

const router = Router();

// Connection status & health
router.get('/status', async (req, res) => {
  try {
    const status = await musicBackend.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check status' });
  }
});

// Update API configuration dynamically
router.post('/configure', async (req, res) => {
  try {
    const { baseUrl, apiKey } = req.body || {};
    if (typeof baseUrl === 'string') {
      process.env.MUSIC_API_BASE_URL = baseUrl.trim();
    }
    if (typeof apiKey === 'string') {
      process.env.MUSIC_API_KEY = apiKey.trim();
    }
    const status = await musicBackend.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update config' });
  }
});

// Trending tracks
router.get('/trending', async (req, res) => {
  try {
    const data = await musicBackend.getTrending();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch trending' });
  }
});

// Popular songs
router.get('/popular', async (req, res) => {
  try {
    const data = await musicBackend.getPopular();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch popular' });
  }
});

// Recommended songs
router.get('/recommended', async (req, res) => {
  try {
    const data = await musicBackend.getRecommended();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch recommended' });
  }
});

// Popular artists
router.get('/artists', async (req, res) => {
  try {
    const data = await musicBackend.getArtists();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch artists' });
  }
});

// New releases
router.get('/new-releases', async (req, res) => {
  try {
    const data = await musicBackend.getNewReleases();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch new releases' });
  }
});

// Genres
router.get('/genres', async (req, res) => {
  try {
    const data = await musicBackend.getGenres();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch genres' });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const query = String(req.query.q || '');
    const filter = String(req.query.filter || 'all');
    const data = await musicBackend.search(query, filter);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to search' });
  }
});

// Suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const query = String(req.query.q || '');
    const data = await musicBackend.getSuggestions(query);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch suggestions' });
  }
});

// Song details
router.get('/song/:id', async (req, res) => {
  try {
    const data = await musicBackend.getSong(req.params.id);
    if (!data) return res.status(404).json({ error: 'Song not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch song' });
  }
});

// Artist details
router.get('/artist/:id', async (req, res) => {
  try {
    const data = await musicBackend.getArtist(req.params.id);
    if (!data) return res.status(404).json({ error: 'Artist not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch artist' });
  }
});

// Album details
router.get('/album/:id', async (req, res) => {
  try {
    const data = await musicBackend.getAlbum(req.params.id);
    if (!data) return res.status(404).json({ error: 'Album not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch album' });
  }
});

// Playlist details
router.get('/playlist/:id', async (req, res) => {
  try {
    const data = await musicBackend.getPlaylist(req.params.id);
    if (!data) return res.status(404).json({ error: 'Playlist not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch playlist' });
  }
});

// Lyrics
router.get('/lyrics', async (req, res) => {
  try {
    const { id, title, artist } = req.query;
    const data = await musicBackend.getLyrics(String(id || ''), String(title || ''), String(artist || ''));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lyrics' });
  }
});

// Vibe Engine: List all vibes
router.get('/vibes', async (req, res) => {
  try {
    const vibes = await musicBackend.getVibes();
    res.json({ vibes });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get vibes' });
  }
});

// Vibe Engine: Get mix for vibe
router.get('/vibe/:vibeId', async (req, res) => {
  try {
    const data = await musicBackend.getVibeMix(req.params.vibeId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get vibe mix' });
  }
});

// Smart Mix: Quick mix combining history, favorites, and vibe
router.post('/quickmix', async (req, res) => {
  try {
    const { recent, favorites, vibeId } = req.body || {};
    const data = await musicBackend.generateQuickMix(recent, favorites, vibeId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate quick mix' });
  }
});

export default router;
