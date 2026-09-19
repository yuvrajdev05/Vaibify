/**
 * VAIBIFY - Native Audio Bridge
 * Communicates with Android Media3 ExoPlayer & VaibifyPlaybackService
 */

import { NormalizedSong, RepeatMode } from '../types';

declare global {
  interface Window {
    VaibifyNativeAudio?: {
      isNative: () => boolean;
      play: (songJson: string, queueJson: string, startIndex: number) => void;
      pause: () => void;
      resume: () => void;
      seekTo: (seconds: number) => void;
      next: () => void;
      previous: () => void;
      setVolume: (volume: number) => void;
      setShuffle: (shuffle: boolean) => void;
      setRepeatMode: (repeatMode: string) => void;
      getPlaybackState: () => string;
    };
    Capacitor?: any;
    __vaibifyOnPlaybackStateChanged?: (isPlaying: boolean, isBuffering: boolean, position: number, duration: number) => void;
    __vaibifyOnTrackChanged?: (currentSong: any, currentIndex: number) => void;
    __vaibifyOnQueueUpdated?: (queue: any[], currentIndex: number) => void;
  }
}

export interface NativePlaybackState {
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  currentIndex: number;
  currentSong?: NormalizedSong | null;
  queue?: NormalizedSong[];
  repeatMode?: RepeatMode;
  shuffle?: boolean;
  volume?: number;
}

type StateListener = (isPlaying: boolean, isBuffering: boolean, position: number, duration: number) => void;
type TrackListener = (currentSong: any, currentIndex: number) => void;
type QueueListener = (queue: any[], currentIndex: number) => void;

class NativeAudioBridge {
  private stateListeners: Set<StateListener> = new Set();
  private trackListeners: Set<TrackListener> = new Set();
  private queueListeners: Set<QueueListener> = new Set();
  private listenersInitialized = false;

  constructor() {
    this.initGlobalListeners();
  }

  private initGlobalListeners() {
    if (typeof window === 'undefined' || this.listenersInitialized) return;
    this.listenersInitialized = true;

    // Handle callbacks from WebView JavaScriptInterface
    window.__vaibifyOnPlaybackStateChanged = (isPlaying, isBuffering, position, duration) => {
      this.stateListeners.forEach((fn) => fn(isPlaying, isBuffering, position, duration));
    };

    window.__vaibifyOnTrackChanged = (currentSong, currentIndex) => {
      this.trackListeners.forEach((fn) => fn(currentSong, currentIndex));
    };

    window.__vaibifyOnQueueUpdated = (queue, currentIndex) => {
      this.queueListeners.forEach((fn) => fn(queue, currentIndex));
    };

    // Also register with Capacitor Plugin if available
    const plugin = this.getCapacitorPlugin();
    if (plugin && typeof plugin.addListener === 'function') {
      try {
        plugin.addListener('onPlaybackStateChanged', (data: any) => {
          this.stateListeners.forEach((fn) =>
            fn(Boolean(data.isPlaying), Boolean(data.isBuffering), Number(data.position || 0), Number(data.duration || 0))
          );
        });

        plugin.addListener('onTrackChanged', (data: any) => {
          this.trackListeners.forEach((fn) => fn(data.currentSong, Number(data.currentIndex || 0)));
        });

        plugin.addListener('onQueueUpdated', (data: any) => {
          this.queueListeners.forEach((fn) => fn(data.queue || [], Number(data.currentIndex || 0)));
        });
      } catch (err) {
        console.warn('Failed to attach Capacitor plugin listeners:', err);
      }
    }
  }

  private getCapacitorPlugin(): any {
    if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.VaibifyAudio) {
      return window.Capacitor.Plugins.VaibifyAudio;
    }
    return null;
  }

  isNativeAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.VaibifyNativeAudio ||
      window.Capacitor?.isNativePlatform?.() ||
      window.Capacitor?.Plugins?.VaibifyAudio
    );
  }

  play(song: NormalizedSong, queue: NormalizedSong[] = [], startIndex: number = 0) {
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || 'VAIBIFY',
      thumbnail: song.thumbnail || '',
      streamUrl: song.streamUrl || '',
      duration: song.duration || 0,
    };

    const queuePayload = queue.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album || 'VAIBIFY',
      thumbnail: s.thumbnail || '',
      streamUrl: s.streamUrl || '',
      duration: s.duration || 0,
    }));

    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.play(JSON.stringify(payload), JSON.stringify(queuePayload), startIndex);
      return;
    }

    const plugin = this.getCapacitorPlugin();
    if (plugin) {
      plugin.play({ song: payload, queue: queuePayload, startIndex });
    }
  }

  playQueue(queue: NormalizedSong[], startIndex: number = 0) {
    const queuePayload = queue.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album || 'VAIBIFY',
      thumbnail: s.thumbnail || '',
      streamUrl: s.streamUrl || '',
      duration: s.duration || 0,
    }));

    if (window.VaibifyNativeAudio && queuePayload.length > 0) {
      const startSong = queuePayload[startIndex] || queuePayload[0];
      window.VaibifyNativeAudio.play(JSON.stringify(startSong), JSON.stringify(queuePayload), startIndex);
      return;
    }

    const plugin = this.getCapacitorPlugin();
    if (plugin) {
      plugin.playQueue({ queue: queuePayload, startIndex });
    }
  }

  pause() {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.pause();
    } else {
      this.getCapacitorPlugin()?.pause();
    }
  }

  resume() {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.resume();
    } else {
      this.getCapacitorPlugin()?.resume();
    }
  }

  seekTo(seconds: number) {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.seekTo(seconds);
    } else {
      this.getCapacitorPlugin()?.seekTo({ position: seconds });
    }
  }

  next() {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.next();
    } else {
      this.getCapacitorPlugin()?.next();
    }
  }

  previous() {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.previous();
    } else {
      this.getCapacitorPlugin()?.previous();
    }
  }

  setVolume(volume: number) {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.setVolume(volume);
    } else {
      this.getCapacitorPlugin()?.setVolume({ volume });
    }
  }

  setShuffle(shuffle: boolean) {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.setShuffle(shuffle);
    } else {
      this.getCapacitorPlugin()?.setShuffle({ shuffle });
    }
  }

  setRepeatMode(repeatMode: RepeatMode) {
    if (window.VaibifyNativeAudio) {
      window.VaibifyNativeAudio.setRepeatMode(repeatMode);
    } else {
      this.getCapacitorPlugin()?.setRepeatMode({ repeatMode });
    }
  }

  async getPlaybackState(): Promise<NativePlaybackState> {
    if (window.VaibifyNativeAudio) {
      try {
        const raw = window.VaibifyNativeAudio.getPlaybackState();
        return JSON.parse(raw);
      } catch {
        return { isPlaying: false, isBuffering: false, position: 0, duration: 0, currentIndex: -1 };
      }
    }

    const plugin = this.getCapacitorPlugin();
    if (plugin && typeof plugin.getPlaybackState === 'function') {
      try {
        return await plugin.getPlaybackState();
      } catch {
        return { isPlaying: false, isBuffering: false, position: 0, duration: 0, currentIndex: -1 };
      }
    }

    return { isPlaying: false, isBuffering: false, position: 0, duration: 0, currentIndex: -1 };
  }

  onPlaybackStateChanged(listener: StateListener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onTrackChanged(listener: TrackListener) {
    this.trackListeners.add(listener);
    return () => this.trackListeners.delete(listener);
  }

  onQueueUpdated(listener: QueueListener) {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  }
}

export const nativeAudioBridge = new NativeAudioBridge();
