package com.vaibify.app.audio

import android.content.Intent
import androidx.media3.common.MediaItem
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native NativeModule bridge for VAIBIFY native audio service.
 */
class VaibifyAudioModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "VaibifyAudioModule"
        var currentContext: ReactApplicationContext? = null

        fun emitPlaybackState(playbackState: Int, isPlaying: Boolean) {
            val params = Arguments.createMap().apply {
                putInt("playbackState", playbackState)
                putBoolean("isPlaying", isPlaying)
            }
            emitEvent("onPlaybackStateChanged", params)
        }

        fun emitTrackChanged(mediaItem: MediaItem?) {
            val params = Arguments.createMap().apply {
                putString("title", mediaItem?.mediaMetadata?.title?.toString() ?: "")
                putString("artist", mediaItem?.mediaMetadata?.artist?.toString() ?: "")
                putString("artworkUri", mediaItem?.mediaMetadata?.artworkUri?.toString() ?: "")
            }
            emitEvent("onTrackChanged", params)
        }

        private fun emitEvent(eventName: String, params: WritableMap) {
            try {
                currentContext
                    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, params)
            } catch (ignored: Exception) {}
        }
    }

    init {
        currentContext = reactContext
    }

    override fun getName(): String = MODULE_NAME

    private fun ensureServiceRunning() {
        if (VaibifyPlaybackService.instance == null) {
            val intent = Intent(reactContext, VaibifyPlaybackService::class.java)
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun play(song: ReadableMap) {
        ensureServiceRunning()
        val url = if (song.hasKey("url")) song.getString("url") ?: "" else ""
        val title = if (song.hasKey("title")) song.getString("title") ?: "Unknown Title" else "Unknown Title"
        val artist = if (song.hasKey("artist")) song.getString("artist") ?: "VAIBIFY" else "VAIBIFY"
        val artwork = if (song.hasKey("thumbnail")) song.getString("thumbnail") else null

        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.playSong(url, title, artist, artwork)
        }
    }

    @ReactMethod
    fun pause() {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.pause()
        }
    }

    @ReactMethod
    fun resume() {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.play()
        }
    }

    @ReactMethod
    fun seekTo(positionMs: Double) {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.seekTo(positionMs.toLong())
        }
    }

    @ReactMethod
    fun next() {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.next()
        }
    }

    @ReactMethod
    fun previous() {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.previous()
        }
    }

    @ReactMethod
    fun setVolume(volume: Double) {
        reactContext.runOnUiQueueThread {
            VaibifyPlaybackService.instance?.setVolume(volume.toFloat())
        }
    }

    @ReactMethod
    fun getPlaybackState(promise: Promise) {
        val service = VaibifyPlaybackService.instance
        if (service == null) {
            val map = Arguments.createMap().apply {
                putBoolean("isPlaying", false)
                putInt("position", 0)
                putInt("duration", 0)
            }
            promise.resolve(map)
            return
        }

        val player = service.getPlayer()
        val map = Arguments.createMap().apply {
            putBoolean("isPlaying", player.isPlaying)
            putDouble("position", player.currentPosition.toDouble())
            putDouble("duration", player.duration.toDouble())
            putInt("playbackState", player.playbackState)
        }
        promise.resolve(map)
    }
}
