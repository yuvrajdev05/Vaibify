# VAIBIFY Backend (Render Ready)

> "Find Your Vibe."

Production-ready Node.js + Express backend service for **VAIBIFY**, handling real-time music discovery, vibe mixes, queue orchestration, and secure communication with the Artistbots Music API.

---

## 🚀 One-Click Render Deployment

1. Create a new Web Service on [Render](https://dashboard.render.com).
2. Connect your Git repository (or set the root directory to `backend`).
3. Configure the service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables** in the Render Dashboard:
   - `MUSIC_API_BASE_URL`: `https://music.artistbots.workers.dev`
   - `MUSIC_API_KEY`: `[YOUR_ARTISTBOTS_API_KEY]`
5. Click **Create Web Service**. Your service URL will be:
   `https://vaibify-backend.onrender.com`

---

## 🔒 Security Architecture
- The `MUSIC_API_KEY` is **strictly kept on the server** and never sent to or visible in client apps (web or Android).
- Android app and Web clients talk only to the VAIBIFY backend over HTTPS.

---

## 📡 API Endpoints

### 1. Health Check
`GET /api/health`
Returns backend health status:
```json
{
  "status": "ok",
  "service": "vaibify-backend",
  "timestamp": "2026-09-19T13:00:00.000Z"
}
```

### 2. API Diagnostics & Verification
`GET /api/music/status`
Performs an active probe to the Artistbots API and returns true diagnostic status.

### 3. Search Tracks, Artists & Albums
`GET /api/music/search?q={query}&filter={all|songs|artists|albums}`
Returns real-time non-mock search results with video IDs, durations, artists, and artwork.

### 4. Search Autocomplete
`GET /api/music/suggestions?q={query}`
Returns live search completion terms.

### 5. Vibe Definitions
`GET /api/music/vibes`
Returns the 9 curated vibes (🔥 Energy, 🌙 Midnight, 💙 Chill, 🧠 Focus, 🚗 Drive, 🎉 Party, 🌧️ Rain, ❤️ Love, ⚡ Workout).

### 6. Dynamic Vibe Mix
`GET /api/music/vibe/:vibeId`
Generates an active, real-time mix matching the requested vibe.

### 7. Stream Resolution
`GET /api/music/stream/:id`
Queries Artistbots `/download` endpoint for direct audio stream URLs. If the upstream provider is offline, reports accurate diagnostic status without falsifying audio stream URLs.

### 8. Quick Mix (Smart Queue)
`POST /api/music/quickmix`
Combines favorites, recent history, and selected vibe into a unique, de-duplicated queue.
