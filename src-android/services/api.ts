/**
 * VAIBIFY Android - Render Backend Client
 * Connects to the deployed Render backend service
 */

const DEFAULT_RENDER_BACKEND = 'https://vaibify-backend.onrender.com';

class VaibifyApiClient {
  private baseUrl: string = DEFAULT_RENDER_BACKEND;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: err.message };
    }
  }

  async checkStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/api/music/status`);
      return await res.json();
    } catch (err: any) {
      return { status: 'error', message: err.message };
    }
  }

  async search(query: string, filter = 'all') {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/music/search?q=${encodeURIComponent(query)}&filter=${filter}`
      );
      return await res.json();
    } catch (err: any) {
      return { query, songs: [], artists: [], albums: [], error: err.message };
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/music/suggestions?q=${encodeURIComponent(query)}`
      );
      return await res.json();
    } catch {
      return [];
    }
  }

  async getVibes() {
    try {
      const res = await fetch(`${this.baseUrl}/api/music/vibes`);
      return await res.json();
    } catch (err: any) {
      return { vibes: [] };
    }
  }

  async getVibeMix(vibeId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/music/vibe/${encodeURIComponent(vibeId)}`);
      return await res.json();
    } catch (err: any) {
      return { tracks: [], error: err.message };
    }
  }

  async generateQuickMix(recent: any[], favorites: any[], vibeId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/music/quickmix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recent, favorites, vibeId }),
      });
      return await res.json();
    } catch (err: any) {
      return { tracks: [], error: err.message };
    }
  }

  async getStreamInfo(videoId: string) {
    try {
      const res = await fetch(`${this.baseUrl}/api/music/stream/${encodeURIComponent(videoId)}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const vaibifyApi = new VaibifyApiClient();
