package com.vaibify.app.audio

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager

/**
 * Handles disconnection of wired headphones or Bluetooth audio devices.
 * Pauses playback automatically per Android audio guidelines.
 */
class AudioNoisyReceiver(private val onNoisy: () -> Unit) : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
            onNoisy()
        }
    }
}
