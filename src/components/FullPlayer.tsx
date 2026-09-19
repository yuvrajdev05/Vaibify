import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { musicApi } from '../services/musicApi';
import { useToast } from '../context/ToastContext';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  ListMusic,
  FileText,
  Disc3,
  Sparkles,
} from 'lucide-react';

export const FullPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isBuffering,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    isFullPlayerOpen,
    isCurrentLiked,
    toggleFullPlayer,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    queue,
    currentIndex,
    playQueue,
  } = usePlayer();

  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'artwork' | 'lyrics' | 'queue'>('artwork');
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState<boolean>(false);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!currentSong) return;

    let isMounted = true;
    setLoadingLyrics(true);
    musicApi
      .getLyrics(currentSong.id, currentSong.title, currentSong.artist)
      .then((res) => {
        if (isMounted) {
          setLyrics(res?.lyrics || null);
          setLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLyrics(null);
          setLoadingLyrics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentSong]);

  if (!isFullPlayerOpen || !currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleShare = async () => {
    const shareText = `Listening to "${currentSong.title}" by ${currentSong.artist} on VAIBIFY! Find Your Vibe. 🎶`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentSong.title} - VAIBIFY`,
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(shareText);
      showToast('Song info copied to clipboard!', 'success');
    }
  };

  return (
    <div
      id="inaya-full-player"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Dynamic ambient backdrop */}
      <div
        className="absolute inset-0 opacity-25 filter blur-3xl scale-125 pointer-events-none transition-all duration-1000"
        style={{
          backgroundImage: `url(${currentSong.thumbnail})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-neutral-950/80 to-neutral-950 pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => toggleFullPlayer(false)}
          className="p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6 text-neutral-300" />
        </button>

        <div className="text-center min-w-0 px-4">
          <div className="text-[11px] font-bold tracking-widest uppercase text-cyan-400">
            Playing From
          </div>
          <div className="text-xs sm:text-sm font-semibold text-neutral-300 truncate max-w-xs sm:max-w-md mx-auto">
            {currentSong.album || 'YouTube Music'}
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('artwork')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'artwork'
                ? 'bg-cyan-500 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Track
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'lyrics'
                ? 'bg-cyan-500 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'queue'
                ? 'bg-cyan-500 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Queue
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full overflow-hidden">
        {activeTab === 'artwork' && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-200">
            {/* Vinyl record with album artwork */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-4 flex items-center justify-center">
              {/* Outer vinyl glow & rim */}
              <div
                className={`absolute inset-0 rounded-full bg-neutral-900 border-4 border-neutral-800/80 shadow-2xl transition-transform duration-700 ${
                  isPlaying ? 'rotate-[360deg]' : ''
                }`}
              />

              {/* Artwork */}
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating audio badge */}
              <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/80 backdrop-blur-md text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {currentSong.type === 'video' ? 'YouTube HD Audio' : 'Original Master'}
              </div>
            </div>

            {/* Song Meta info */}
            <div className="w-full mt-6 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {currentSong.title}
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 truncate mt-1">
                  {currentSong.artist}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleLike()}
                  className="p-2.5 rounded-full bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 transition-colors"
                  title="Favorite"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      isCurrentLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-400'
                    }`}
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="w-full h-full max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-4 rounded-3xl bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-xl animate-in fade-in">
            <div className="text-center pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-base text-cyan-400">Lyrics</h3>
              <p className="text-xs text-neutral-400">
                {currentSong.title} • {currentSong.artist}
              </p>
            </div>

            {loadingLyrics ? (
              <div className="flex items-center justify-center py-20 text-neutral-400 text-sm animate-pulse">
                Fetching lyrics...
              </div>
            ) : lyrics ? (
              <div className="whitespace-pre-line text-center py-6 text-sm sm:text-base font-medium leading-relaxed text-neutral-200">
                {lyrics}
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500 text-sm">
                No lyrics available for this track.
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full h-full max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-4 rounded-3xl bg-neutral-900/50 border border-neutral-800/80 backdrop-blur-xl space-y-2 animate-in fade-in">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2 pb-1">
              Up Next ({queue.length - currentIndex - 1})
            </div>
            {queue.map((song, idx) => {
              const isPlayingThis = idx === currentIndex;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playQueue(queue, idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isPlayingThis
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-white'
                      : 'hover:bg-neutral-800/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs truncate">{song.title}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{song.artist}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-neutral-500">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Playback Scrubber */}
        <div className="w-full mt-6 space-y-1.5">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition-all focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="w-full mt-4 flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              shuffle ? 'text-cyan-400' : 'text-neutral-500 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prev}
            className="p-3 text-neutral-300 hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-xl shadow-cyan-500/20 transform transition-transform hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-white" />
            ) : (
              <Play className="w-8 h-8 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={next}
            className="p-3 text-neutral-300 hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 transition-colors ${
              repeatMode !== 'off' ? 'text-cyan-400' : 'text-neutral-500 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume controls */}
        <div className="w-full mt-6 flex items-center justify-center gap-3 max-w-xs text-neutral-400">
          <button onClick={toggleMute} className="hover:text-white">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </main>
    </div>
  );
};
