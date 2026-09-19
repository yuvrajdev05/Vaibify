import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { VaibifyAudioModule } = NativeModules;

export interface SongPayload {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
  url?: string;
  duration?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackState?: number;
}

type PlaybackListener = (state: { playbackState: number; isPlaying: boolean }) => void;
type TrackListener = (track: { title: string; artist: string; artworkUri?: string }) => void;

class NativeAudioBridge {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      this.eventEmitter = new NativeEventEmitter(VaibifyAudioModule);
    }
  }

  play(song: SongPayload) {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.play(song);
    }
  }

  pause() {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.pause();
    }
  }

  resume() {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.resume();
    }
  }

  seekTo(positionMs: number) {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.seekTo(positionMs);
    }
  }

  next() {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.next();
    }
  }

  previous() {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.previous();
    }
  }

  setVolume(volume: number) {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      VaibifyAudioModule.setVolume(volume);
    }
  }

  async getPlaybackState(): Promise<PlaybackState> {
    if (Platform.OS === 'android' && VaibifyAudioModule) {
      return await VaibifyAudioModule.getPlaybackState();
    }
    return { isPlaying: false, position: 0, duration: 0 };
  }

  addPlaybackStateListener(callback: PlaybackListener) {
    return this.eventEmitter?.addListener('onPlaybackStateChanged', callback);
  }

  addTrackChangedListener(callback: TrackListener) {
    return this.eventEmitter?.addListener('onTrackChanged', callback);
  }
}

export const nativeAudio = new NativeAudioBridge();
