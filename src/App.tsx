import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { PlayerProvider } from './context/PlayerContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { MusicPlayer } from './components/MusicPlayer';
import { FullPlayer } from './components/FullPlayer';
import { QueueDrawer } from './components/QueueDrawer';
import { PlaylistModal } from './components/PlaylistModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { Toast } from './components/Toast';

import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { Favorites } from './pages/Favorites';
import { Recent } from './pages/Recent';
import { Playlists } from './pages/Playlists';
import { Playlist } from './pages/Playlist';
import { Artist } from './pages/Artist';
import { Album } from './pages/Album';

import { NormalizedSong } from './types';

const MainLayout: React.FC = () => {
  const { currentPath, navigate, queryParams } = useRouter();

  // Modals state
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<NormalizedSong | null>(
    null
  );
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);

  const handleOpenAddToPlaylist = (song: NormalizedSong) => {
    setSelectedSongForPlaylist(song);
    setIsPlaylistModalOpen(true);
  };

  const handleOpenCreatePlaylist = () => {
    setSelectedSongForPlaylist(null);
    setIsPlaylistModalOpen(true);
  };

  // Route Dispatcher
  const renderRoute = () => {
    const path = currentPath.split('?')[0];

    if (path === '/' || path === '') {
      return <Home onNavigate={navigate} onAddToPlaylist={handleOpenAddToPlaylist} />;
    }

    if (path === '/search') {
      return (
        <Search
          initialQuery={queryParams.get('q') || ''}
          onNavigate={navigate}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      );
    }

    if (path === '/library') {
      return (
        <Library
          onNavigate={navigate}
          onAddToPlaylist={handleOpenAddToPlaylist}
          onOpenCreatePlaylist={handleOpenCreatePlaylist}
        />
      );
    }

    if (path === '/favorites') {
      return <Favorites onNavigate={navigate} onAddToPlaylist={handleOpenAddToPlaylist} />;
    }

    if (path === '/recent') {
      return <Recent onNavigate={navigate} onAddToPlaylist={handleOpenAddToPlaylist} />;
    }

    if (path === '/playlists') {
      return (
        <Playlists
          onNavigate={navigate}
          onOpenCreatePlaylist={handleOpenCreatePlaylist}
        />
      );
    }

    if (path.startsWith('/playlist/')) {
      const id = path.replace('/playlist/', '');
      return (
        <Playlist
          id={id}
          onNavigate={navigate}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      );
    }

    if (path.startsWith('/artist/')) {
      const id = path.replace('/artist/', '');
      return (
        <Artist
          id={id}
          onNavigate={navigate}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      );
    }

    if (path.startsWith('/album/')) {
      const id = path.replace('/album/', '');
      return (
        <Album
          id={id}
          onNavigate={navigate}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      );
    }

    // Default fallback
    return <Home onNavigate={navigate} onAddToPlaylist={handleOpenAddToPlaylist} />;
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 antialiased overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenCreatePlaylist={handleOpenCreatePlaylist}
        onOpenApiConfig={() => setIsApiConfigOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenApiConfig={() => setIsApiConfigOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto pb-32 sm:pb-28">
          {renderRoute()}
        </main>
      </div>

      {/* Bottom Persistent Music Player */}
      <MusicPlayer />

      {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
      <MobileNav currentPath={currentPath} onNavigate={navigate} />

      {/* Queue Slide-in Drawer */}
      <QueueDrawer />

      {/* Full-screen Immersive Player */}
      <FullPlayer />

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setSelectedSongForPlaylist(null);
        }}
        songToAdd={selectedSongForPlaylist}
      />

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
      />

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <PlayerProvider>
        <RouterProvider>
          <MainLayout />
        </RouterProvider>
      </PlayerProvider>
    </ToastProvider>
  );
}
