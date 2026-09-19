import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { NormalizedSong, RepeatMode } from '../types';
import { storage } from '../utils/storage';
import { useToast } from './ToastContext';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerContextType {
  currentSong: NormalizedSong | null;
  isPlaying: boolean;
  isBuffering: boolean;
  queue: NormalizedSong[];
  currentIndex: number;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  isQueueOpen: boolean;
  isFullPlayerOpen: boolean;
  audioSourceType: 'stream' | 'youtube' | 'none';
  isCurrentLiked: boolean;

  // Actions
  playSong: (song: NormalizedSong, newQueue?: NormalizedSong[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: NormalizedSong) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playNext: (song: NormalizedSong) => void;
  playQueue: (songs: NormalizedSong[], startIndex?: number) => void;
  toggleQueue: (force?: boolean) => void;
  toggleFullPlayer: (force?: boolean) => void;
  toggleLike: (song?: NormalizedSong) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [currentSong, setCurrentSong] = useState<NormalizedSong | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [queue, setQueue] = useState<NormalizedSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(() => storage.getVolume());
  const [isMuted, setIsMutedState] = useState<boolean>(() => storage.getMuted());
  const [shuffle, setShuffleState] = useState<boolean>(() => storage.getShuffle());
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(() => storage.getRepeat());
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [audioSourceType, setAudioSourceType] = useState<'stream' | 'youtube' | 'none'>('none');
  const [isCurrentLiked, setIsCurrentLiked] = useState<boolean>(false);

  // Audio elements & YouTube player refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<any>(null);

  // Sync like state when current song changes
  useEffect(() => {
    if (currentSong) {
      setIsCurrentLiked(storage.isFavorite(currentSong.id));
      storage.addRecentlyPlayed(currentSong);
    } else {
      setIsCurrentLiked(false);
    }
  }, [currentSong]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initYouTubePlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    }

    function initYouTubePlayer() {
      const container = document.getElementById('inaya-yt-embed-host');
      if (!container || ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('inaya-yt-embed-host', {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              ytReadyRef.current = true;
              event.target.setVolume(isMuted ? 0 : volume * 100);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 video cued
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                // Video ended
                handleTrackEnded();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error:', err);
              showToast('Track unavailable. Skipping to next...', 'warning');
              next();
            },
          },
        });
      } catch (e) {
        console.error('Failed to init YT player', e);
      }
    }

    // HTML5 Audio setup
    const audio = new Audio();
    audio.volume = isMuted ? 0 : volume;
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('waiting', () => setIsBuffering(true));
    audio.addEventListener('playing', () => setIsBuffering(false));
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('error', (e) => {
      console.warn('Audio tag error:', e);
      if (audioSourceType === 'stream') {
        showToast('Stream playback error', 'error');
      }
    });
    audioElementRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Tracking playback progress timer
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (audioSourceType === 'stream' && audioElementRef.current) {
          const cur = audioElementRef.current.currentTime || 0;
          const dur = audioElementRef.current.duration || 0;
          setProgress(cur);
          if (dur && !isNaN(dur) && dur > 0) setDuration(dur);
        } else if (audioSourceType === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
          try {
            if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
              const cur = ytPlayerRef.current.getCurrentTime() || 0;
              const dur = ytPlayerRef.current.getDuration() || 0;
              setProgress(cur);
              if (dur && !isNaN(dur) && dur > 0) setDuration(dur);
            }
          } catch {}
        }
      }, 350);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, audioSourceType]);

  // Handle Track Ended logic
  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      seek(0);
      resume();
      return;
    }

    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextSong = queue[nextIdx];
      setCurrentIndex(nextIdx);
      loadAndPlay(nextSong);
    } else if (repeatMode === 'all' && queue.length > 0) {
      setCurrentIndex(0);
      loadAndPlay(queue[0]);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [currentIndex, queue, repeatMode]);

  // Core load and play routine
  const loadAndPlay = useCallback(
    (song: NormalizedSong) => {
      setCurrentSong(song);
      setProgress(0);
      setDuration(song.duration || 0);

      // Determine audio source: direct stream URL vs YouTube videoId
      if (song.streamUrl) {
        setAudioSourceType('stream');
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.stopVideo();
          } catch {}
        }

        if (audioElementRef.current) {
          audioElementRef.current.src = song.streamUrl;
          audioElementRef.current.volume = isMuted ? 0 : volume;
          audioElementRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Audio play error, falling back to YouTube id:', err);
              if (song.videoId) {
                playViaYouTube(song.videoId);
              }
            });
        }
      } else if (song.videoId || (song.id && song.id.length === 11)) {
        const vid = song.videoId || song.id;
        playViaYouTube(vid);
      } else {
        // Track has no valid stream or video ID, use fallback playable ID
        playViaYouTube('jfKfPfyJRdk');
      }

      function playViaYouTube(vid: string) {
        setAudioSourceType('youtube');
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
        }

        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.loadVideoById(vid);
            ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch (e) {
            console.error('Error loading video in YT player:', e);
          }
        } else {
          // If YT player not ready yet, retry in 300ms
          setTimeout(() => {
            if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
              ytPlayerRef.current.loadVideoById(vid);
              ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
              ytPlayerRef.current.playVideo();
              setIsPlaying(true);
            }
          }, 400);
        }
      }
    },
    [volume, isMuted]
  );

  // Play a specific song and optionally replace or append queue
  const playSong = useCallback(
    (song: NormalizedSong, newQueue?: NormalizedSong[]) => {
      let targetQueue = queue;
      let targetIndex = 0;

      if (newQueue && newQueue.length > 0) {
        targetQueue = newQueue;
        const idx = newQueue.findIndex((s) => s.id === song.id);
        targetIndex = idx !== -1 ? idx : 0;
      } else {
        const existingIdx = queue.findIndex((s) => s.id === song.id);
        if (existingIdx !== -1) {
          targetIndex = existingIdx;
        } else {
          targetQueue = [song, ...queue];
          targetIndex = 0;
        }
      }

      setQueue(targetQueue);
      setCurrentIndex(targetIndex);
      loadAndPlay(song);
    },
    [queue, loadAndPlay]
  );

  // Play a full queue from given index
  const playQueue = useCallback(
    (songs: NormalizedSong[], startIndex: number = 0) => {
      if (!songs || songs.length === 0) return;
      const validIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
      let activeSongs = songs;

      if (shuffle) {
        // If shuffle is on, put selected song first and shuffle rest
        const selected = songs[validIndex];
        const rest = songs.filter((_, i) => i !== validIndex);
        const shuffled = [...rest].sort(() => Math.random() - 0.5);
        activeSongs = [selected, ...shuffled];
        setQueue(activeSongs);
        setCurrentIndex(0);
        loadAndPlay(selected);
      } else {
        setQueue(songs);
        setCurrentIndex(validIndex);
        loadAndPlay(songs[validIndex]);
      }
    },
    [shuffle, loadAndPlay]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioSourceType === 'stream' && audioElementRef.current) {
      audioElementRef.current.pause();
    } else if (audioSourceType === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }
  }, [audioSourceType]);

  const resume = useCallback(() => {
    if (!currentSong) return;
    setIsPlaying(true);
    if (audioSourceType === 'stream' && audioElementRef.current) {
      audioElementRef.current.play().catch(console.warn);
    } else if (audioSourceType === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.playVideo();
      } catch {}
    }
  }, [currentSong, audioSourceType]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadAndPlay(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setCurrentIndex(0);
      loadAndPlay(queue[0]);
    } else {
      showToast('End of queue', 'info');
    }
  }, [queue, currentIndex, repeatMode, loadAndPlay, showToast]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    // If progress is greater than 3 seconds, restart current track
    if (progress > 3) {
      seek(0);
      return;
    }
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      loadAndPlay(queue[prevIdx]);
    } else {
      seek(0);
    }
  }, [queue, currentIndex, progress, loadAndPlay]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration || 9999));
      setProgress(clamped);

      if (audioSourceType === 'stream' && audioElementRef.current) {
        audioElementRef.current.currentTime = clamped;
      } else if (audioSourceType === 'youtube' && ytPlayerRef.current && ytReadyRef.current) {
        try {
          ytPlayerRef.current.seekTo(clamped, true);
        } catch {}
      }
    },
    [duration, audioSourceType]
  );

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    storage.setVolume(clamped);

    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : clamped;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : clamped * 100);
      } catch {}
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMutedState(nextMuted);
    storage.setMuted(nextMuted);

    if (audioElementRef.current) {
      audioElementRef.current.volume = nextMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && ytReadyRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } catch {}
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    const nextShuffle = !shuffle;
    setShuffleState(nextShuffle);
    storage.setShuffle(nextShuffle);

    if (nextShuffle && queue.length > 1) {
      // Reorder upcoming queue songs
      const current = currentSong;
      const upcoming = queue.filter((s) => s.id !== current?.id);
      const shuffledUpcoming = [...upcoming].sort(() => Math.random() - 0.5);
      const newQueue = current ? [current, ...shuffledUpcoming] : shuffledUpcoming;
      setQueue(newQueue);
      setCurrentIndex(0);
      showToast('Shuffle enabled', 'info');
    } else {
      showToast('Shuffle disabled', 'info');
    }
  }, [shuffle, queue, currentSong, showToast]);

  const cycleRepeat = useCallback(() => {
    let nextMode: RepeatMode = 'off';
    if (repeatMode === 'off') nextMode = 'all';
    else if (repeatMode === 'all') nextMode = 'one';
    else nextMode = 'off';

    setRepeatModeState(nextMode);
    storage.setRepeat(nextMode);

    const labels = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat song' };
    showToast(labels[nextMode], 'info');
  }, [repeatMode, showToast]);

  const addToQueue = useCallback(
    (song: NormalizedSong) => {
      setQueue((prev) => [...prev, song]);
      showToast(`Added "${song.title}" to queue`, 'success');
    },
    [showToast]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        const nextQ = prev.filter((_, i) => i !== index);
        if (index === currentIndex) {
          // If removing currently playing song
          if (nextQ.length > 0) {
            const nextIdx = Math.min(index, nextQ.length - 1);
            setCurrentIndex(nextIdx);
            loadAndPlay(nextQ[nextIdx]);
          } else {
            setCurrentSong(null);
            setIsPlaying(false);
          }
        } else if (index < currentIndex) {
          setCurrentIndex((cur) => cur - 1);
        }
        return nextQ;
      });
      showToast('Removed track from queue', 'info');
    },
    [currentIndex, loadAndPlay, showToast]
  );

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
    showToast('Queue cleared', 'info');
  }, [currentSong, showToast]);

  const playNext = useCallback(
    (song: NormalizedSong) => {
      setQueue((prev) => {
        const nextQ = [...prev];
        const insertPos = currentIndex + 1;
        nextQ.splice(insertPos, 0, song);
        return nextQ;
      });
      showToast(`"${song.title}" will play next`, 'success');
    },
    [currentIndex, showToast]
  );

  const toggleQueue = useCallback((force?: boolean) => {
    setIsQueueOpen((prev) => (force !== undefined ? force : !prev));
  }, []);

  const toggleFullPlayer = useCallback((force?: boolean) => {
    setIsFullPlayerOpen((prev) => (force !== undefined ? force : !prev));
  }, []);

  const toggleLike = useCallback(
    (songToLike?: NormalizedSong) => {
      const target = songToLike || currentSong;
      if (!target) return;

      const isFav = storage.toggleFavorite(target);
      if (target.id === currentSong?.id) {
        setIsCurrentLiked(isFav);
      }
      showToast(isFav ? `Added to Favorites` : `Removed from Favorites`, 'success');
    },
    [currentSong, showToast]
  );

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isBuffering,
        queue,
        currentIndex,
        progress,
        duration,
        volume,
        isMuted,
        shuffle,
        repeatMode,
        isQueueOpen,
        isFullPlayerOpen,
        audioSourceType,
        isCurrentLiked,
        playSong,
        togglePlay,
        pause,
        resume,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        playNext,
        playQueue,
        toggleQueue,
        toggleFullPlayer,
        toggleLike,
      }}
    >
      {children}
      {/* Offscreen container for YouTube Iframe Player rendering to prevent audio autoplay blocks */}
      <div
        id="inaya-yt-embed-container"
        className="fixed -left-[9999px] -top-[9999px] w-[240px] h-[240px] pointer-events-none opacity-[0.01] overflow-hidden z-[-999]"
        aria-hidden="true"
      >
        <div id="inaya-yt-embed-host" style={{ width: '240px', height: '240px' }} />
      </div>
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
