# 🎵 VAIBIFY — Find Your Vibe.

> **Stream any track, tune into dynamic vibe mixes, and curate your personalized music library.**

VAIBIFY is an all-in-one music discovery and streaming platform designed for effortless vibe tuning, intelligent queueing, and responsive playback across web and mobile.

---

## ✨ Features

- 🎧 **Dynamic Vibe Engine**: Instantly switch modes with curated vibe mixes:
  - 🔥 **Energy** — High-tempo, motivating anthems
  - 🌙 **Midnight** — Late-night moody and atmospheric sounds
  - 💙 **Chill** — Laid-back, lo-fi and acoustic rhythms
  - 🧠 **Focus** — Instrumental and study flow tracks
  - 🚗 **Drive** — Road trip synthwave and driving beats
  - 🎉 **Party** — Dancefloor club hits and crowd pleasers
  - 🌧️ **Rain** — Cozy, melancholic, reflective moods
  - ❤️ **Love** — Romantic ballads and heartfelt melodies
  - ⚡ **Workout** — Bass-heavy workout tracks
- 🔍 **Live Music Discovery & Search**: Fast search across songs, artists, and albums with real-time autocompletion.
- 🎛️ **Full-Featured Audio Player**:
  - Persistent mini player & immersive full-screen player mode
  - Synchronized lyrics display
  - Queue drawer with reordering and de-duplication
  - Volume control, repeat, and shuffle modes
- 📚 **Personal Library**:
  - Custom user playlists (create, rename, edit, add/remove songs)
  - Favorite tracks with 1-click toggling
  - Recently played history with persistent storage
  - Smart Mix / Quick Mix generator
- 🌐 **Modern Full-Stack Architecture**:
  - **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Vite 6
  - **Server / Backend**: Express.js with Vite middleware in dev and optimized static serving in production
  - **Cloud Ready**: Standalone Render-ready backend configuration in `/backend`
  - **Mobile Ready**: Native Android & React Native setup in `/android` and `/src-android`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yuvrajdev05/Vaibify.git
   cd Vaibify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Artistbots Music API Key if connecting to an external music endpoint.

4. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Production

To build the client bundle and compile the backend server for production:

```bash
npm run build
npm start
```

Other available scripts:
- `npm run lint`: Run TypeScript type-checking (`tsc --noEmit`)
- `npm run preview`: Preview the built production client

---

## 📂 Project Structure

```
vaibify/
├── src/                    # React 19 Frontend Application
│   ├── components/         # UI Components (Player, Cards, Modals, Vibe Engine)
│   ├── context/            # Global State (PlayerContext, ToastContext, RouterContext)
│   ├── pages/              # Views (Home, Search, Library, Playlists, Artist, Album)
│   ├── services/           # Frontend API and stream resolvers
│   ├── types.ts            # TypeScript interfaces and vibe definitions
│   └── App.tsx             # Root layout and routing dispatcher
├── server/                 # Express backend endpoints & services
│   ├── routes/             # Music API routes (/api/music/*)
│   └── services/           # Backend catalog fallback & external API proxy
├── backend/                # Standalone Render deployment package
├── android/                # Android native project files
├── src-android/            # React Native Android bridge code
├── server.ts               # Root Express + Vite development server
└── package.json            # Project dependencies & scripts
```

---

## ☁️ Deployment

### Render Deployment (Backend Service)

1. Connect this repository on [Render](https://render.com).
2. Set root directory to `backend`.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure environment variables:
   - `MUSIC_API_BASE_URL`: `https://music.artistbots.workers.dev`
   - `MUSIC_API_KEY`: *(Your API Key)*

---

## 📄 License

This project is licensed under the MIT License.
