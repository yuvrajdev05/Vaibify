/**
 * VAIBIFY - Music API Routes
 * Endpoints for search, vibes, smart mixes, and Artistbots stream resolution
 */

import { Router } from 'express';
import { artistbotsApi } from '../services/artistbotsApi.js';
import { VIBE_DEFINITIONS } from '../utils/normalize.js';

export const musicRouter = Router();

// 1. Diagnostics & API verification
musicRouter.get('/status', async (req, res) => {
  try {
    const status = await artistbotsApi.verifyConnection();
    res.json(status);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. Search songs, artists, and albums
musicRouter.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = req.query.filter || 'all';
    const results = await artistbotsApi.search(q, filter);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Search autocomplete suggestions
musicRouter.get('/suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';
    const suggestions = await artistbotsApi.getSuggestions(q);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. List all available Vibe definitions
musicRouter.get('/vibes', (req, res) => {
  res.json({ vibes: VIBE_DEFINITIONS });
});

// 5. Generate dynamic Vibe Mix
musicRouter.get('/vibe/:vibeId', async (req, res) => {
  try {
    const { vibeId } = req.params;
    const mix = await artistbotsApi.getVibeMix(vibeId);
    res.json(mix);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Request direct stream/download from Artistbots /download
musicRouter.get('/stream/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stream = await artistbotsApi.getDownloadStream(id);
    res.json(stream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Quick Mix / Smart Mix generator
// Combines recent tracks, favorites, and selected vibe into a de-duplicated queue
musicRouter.post('/quickmix', async (req, res) => {
  try {
    const { recent = [], favorites = [], vibeId = 'energy' } = req.body || {};

    const vibe = VIBE_DEFINITIONS.find((v) => v.id === vibeId.toLowerCase()) || VIBE_DEFINITIONS[0];
    const vibeMix = await artistbotsApi.getVibeMix(vibe.id);

    const pool = [...favorites, ...recent, ...(vibeMix.tracks || [])];
    const seen = new Set();
    const deDuplicated = [];

    for (const song of pool) {
      if (song && song.id && !seen.has(song.id)) {
        seen.add(song.id);
        deDuplicated.push(song);
      }
    }

    // Shuffle slightly for freshness
    const smartQueue = deDuplicated.sort(() => Math.random() - 0.5).slice(0, 30);

    res.json({
      title: `Quick Mix • ${vibe.emoji} ${vibe.name}`,
      vibe,
      tracks: smartQueue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
