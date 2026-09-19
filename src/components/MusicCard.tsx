import React, { useState, useRef, useEffect } from 'react';
import { NormalizedSong } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatDuration } from '../utils/formatDuration';
import { Play, Pause, MoreVertical, ListPlus, Heart, Music, Disc3, Radio } from 'lucide-react';

interface MusicCardProps {
  song: NormalizedSong;
  queueContext?: NormalizedSong[];
  onAddToPlaylist?: (song: NormalizedSong) => void;
  onNavigate?: (path: string) => void;
  layout?: 'card' | 'row';
  index?: number;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  song,
  queueContext,
  onAddToPlaylist,
  onNavigate,
  layout = 'card',
  index,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue, playNext, toggleLike } =
    usePlayer();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrent = currentSong?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queueContext);
    }
  };

  if (layout === 'row') {
    return (
      <div
        id={`song-row-${song.id}`}
        onClick={handlePlay}
        className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none ${
          isCurrent
            ? 'bg-cyan-500/10 border border-cyan-500/20'
            : 'hover:bg-neutral-800/60 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {index !== undefined && (
            <span className="w-5 text-center text-xs font-semibold text-neutral-500 group-hover:hidden">
              {isThisPlaying ? (
                <span className="flex items-end justify-center gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-cyan-400 animate-pulse" />
                  <span className="w-0.5 h-2 bg-cyan-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-3 bg-cyan-400 animate-pulse delay-150" />
                </span>
              ) : (
                index + 1
              )}
            </span>
          )}

          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-800 shadow-md">
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div
              className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isThisPlaying ? (
                <Pause className="w-5 h-5 text-white fill-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold truncate ${
                isCurrent ? 'text-cyan-400' : 'text-neutral-100 group-hover:text-white'
              }`}
            >
              {song.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-0.5">
              <span
                onClick={(e) => {
                  if (song.artistId && onNavigate) {
                    e.stopPropagation();
                    onNavigate(`/artist/${song.artistId}`);
                  }
                }}
                className={`truncate ${song.artistId ? 'hover:underline hover:text-neutral-200' : ''}`}
              >
                {song.artist}
              </span>
              {song.album && (
                <>
                  <span>•</span>
                  <span className="truncate hidden sm:inline">{song.album}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(song);
            }}
            className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
            title="Like song"
          >
            <Heart className="w-4 h-4" />
          </button>

          <span className="text-xs text-neutral-400 font-mono w-10 text-right">
            {formatDuration(song.duration)}
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-30 text-xs font-medium text-neutral-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(song);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                >
                  <ListPlus className="w-4 h-4 text-cyan-400" />
                  Add to queue
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNext(song);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                >
                  <Radio className="w-4 h-4 text-indigo-400" />
                  Play next
                </button>
                {onAddToPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToPlaylist(song);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                  >
                    <Music className="w-4 h-4 text-emerald-400" />
                    Add to playlist
                  </button>
                )}
                {song.albumId && onNavigate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(`/album/${song.albumId}`);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2.5 transition-colors border-t border-neutral-800/80"
                  >
                    <Disc3 className="w-4 h-4 text-amber-400" />
                    Go to album
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' layout (for horizontal scroll rows and grids)
  return (
    <div
      id={`song-card-${song.id}`}
      onClick={handlePlay}
      className={`group relative flex-shrink-0 w-44 sm:w-48 p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800/80 border transition-all duration-300 cursor-pointer select-none ${
        isCurrent
          ? 'border-cyan-500/40 shadow-lg shadow-cyan-950/40 bg-neutral-900'
          : 'border-neutral-800/70 hover:border-neutral-700/80 hover:shadow-xl'
      }`}
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-800 mb-3 shadow-md">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Play button overlay */}
        <div
          className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-all ${
            isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-black/60 transform transition-transform group-hover:scale-110 active:scale-95">
            {isThisPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Duration badge */}
        {song.duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 text-[10px] font-mono text-neutral-300 backdrop-blur-sm">
            {formatDuration(song.duration)}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h4
            className={`font-semibold text-sm truncate ${
              isCurrent ? 'text-cyan-400' : 'text-neutral-100 group-hover:text-white'
            }`}
          >
            {song.title}
          </h4>
          <p className="text-xs text-neutral-400 truncate mt-0.5 group-hover:text-neutral-300">
            {song.artist}
          </p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-30 text-xs font-medium text-neutral-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(song);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2"
              >
                <ListPlus className="w-4 h-4 text-cyan-400" />
                Add to queue
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playNext(song);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-indigo-400" />
                Play next
              </button>
              {onAddToPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist(song);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Music className="w-4 h-4 text-emerald-400" />
                  Add to playlist
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(song);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 border-t border-neutral-800/80"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                Like song
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
