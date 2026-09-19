package com.vaibify.app.audio;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;

/**
 * BroadcastReceiver listening for AUDIO_BECOMING_NOISY.
 * Automatically pauses playback when Bluetooth or wired headphones are disconnected.
 */
public class AudioNoisyReceiver extends BroadcastReceiver {

    public interface NoisyListener {
        void onAudioBecomingNoisy();
    }

    private final NoisyListener listener;

    public AudioNoisyReceiver() {
        this.listener = null;
    }

    public AudioNoisyReceiver(NoisyListener listener) {
        this.listener = listener;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
            if (listener != null) {
                listener.onAudioBecomingNoisy();
            } else if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.pause();
            }
        }
    }
}
