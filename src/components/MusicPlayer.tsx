import React, { useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Maximize2,
  Sparkles,
} from 'lucide-react';

export const MusicPlayer: React.FC = () => {
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
    isQueueOpen,
    isCurrentLiked,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleQueue,
    toggleFullPlayer,
    toggleLike,
    queue,
  } = usePlayer();

  const [isHoveredScrubber, setIsHoveredScrubber] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);

  if (!currentSong) {
    return null;
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  return (
    <div
      id="inaya-bottom-player"
      className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-neutral-800/80 backdrop-blur-xl shadow-2xl text-neutral-100 transition-all select-none"
    >
      {/* Top Scrubber Bar (Interactive full width) */}
      <div
        ref={scrubberRef}
        onClick={handleScrubberClick}
        onMouseEnter={() => setIsHoveredScrubber(true)}
        onMouseLeave={() => setIsHoveredScrubber(false)}
        className="group relative w-full h-1.5 bg-neutral-800/80 cursor-pointer overflow-hidden transition-all hover:h-2.5"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Thumb marker */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-opacity ${
              isHoveredScrubber ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Track Details */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 w-1/4 sm:w-1/3">
          <div
            onClick={() => toggleFullPlayer(true)}
            className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-neutral-800 shrink-0 cursor-pointer shadow-md group ring-1 ring-white/5"
            title="Expand Full Player"
          >
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleFullPlayer(true)}>
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-xs sm:text-sm text-neutral-100 hover:text-cyan-400 truncate transition-colors">
                {currentSong.title}
              </h4>
              {currentSong.type === 'video' && (
                <span className="hidden md:inline px-1.5 py-0.2 rounded bg-neutral-800 text-[9px] font-mono text-cyan-400 shrink-0">
                  HD
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5 hover:text-neutral-200">
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLike()}
            className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors shrink-0"
            title="Favorite song"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                isCurrentLiked ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Main Playback Controls & Scrubber */}
        <div className="flex flex-col items-center justify-center min-w-0 flex-1 max-w-lg">
          <div className="flex items-center gap-2 sm:gap-5">
            <button
              onClick={toggleShuffle}
              className={`hidden sm:block p-1.5 transition-colors ${
                shuffle ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prev}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors active:scale-90"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isBuffering}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 transform transition-transform hover:scale-105 active:scale-95 shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors active:scale-90"
              title="Next"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`hidden sm:block p-1.5 transition-colors ${
                repeatMode !== 'off' ? 'text-cyan-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time indicator underneath controls on desktop */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-1">
            <span>{formatDuration(progress)}</span>
            <span>/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Extra Utilities */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/4 sm:w-1/3">
          {/* Queue Button */}
          <button
            onClick={() => toggleQueue()}
            className={`relative p-2 rounded-xl border transition-all ${
              isQueueOpen
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'text-neutral-400 hover:text-white bg-neutral-900/60 border-neutral-800'
            }`}
            title="Playback Queue"
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black font-bold text-[9px] flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>

          {/* Fullscreen Player toggle */}
          <button
            onClick={() => toggleFullPlayer(true)}
            className="hidden md:flex p-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-800 transition-colors"
            title="Expand Player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 px-2.5 py-1.5 rounded-xl">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
