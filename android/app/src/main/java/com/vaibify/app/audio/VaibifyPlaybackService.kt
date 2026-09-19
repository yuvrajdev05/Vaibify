package com.vaibify.app.audio

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import androidx.annotation.OptIn
import androidx.core.app.NotificationCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.vaibify.app.MainActivity

/**
 * VAIBIFY - Foreground Media Playback Service
 * Powered by Android Media3 & ExoPlayer.
 *
 * Provides uninterrupted background playback when:
 * 1. User minimizes VAIBIFY
 * 2. User opens another application
 * 3. User locks the phone
 * 4. Screen turns off
 *
 * Integrates:
 * - MediaSession & Media3 MediaSessionService
 * - Lock screen controls & Notification controls (Prev, Play/Pause, Next)
 * - Audio focus management (phone calls, other media players)
 * - AudioBecomingNoisy receiver (headphone / Bluetooth disconnect auto-pause)
 */
class VaibifyPlaybackService : MediaSessionService() {

    private var mediaSession: MediaSession? = null
    private lateinit var exoPlayer: ExoPlayer
    private var audioNoisyReceiver: AudioNoisyReceiver? = null

    companion object {
        const val CHANNEL_ID = "vaibify_playback_channel"
        const val NOTIFICATION_ID = 101
        var instance: VaibifyPlaybackService? = null
    }

    @OptIn(UnstableApi::class)
    override fun onCreate() {
        super.onCreate()
        instance = this

        // 1. Configure audio attributes for music playback with automatic audio focus handling
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        // 2. Initialize ExoPlayer with handleAudioBecomingNoisy enabled
        exoPlayer = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true) // true enables automatic audio focus handling
            .setWakeMode(C.WAKE_MODE_NETWORK) // Keep CPU & WiFi alive for streaming while screen is off
            .build()

        exoPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                updateNotification()
                VaibifyAudioModule.emitPlaybackState(playbackState, exoPlayer.isPlaying)
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                updateNotification()
                VaibifyAudioModule.emitPlaybackState(exoPlayer.playbackState, isPlaying)
            }

            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                updateNotification()
                VaibifyAudioModule.emitTrackChanged(mediaItem)
            }
        })

        // 3. Build MediaSession for lock screen and Bluetooth controls
        val sessionActivityPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        mediaSession = MediaSession.Builder(this, exoPlayer)
            .setSessionActivity(sessionActivityPendingIntent)
            .build()

        // 4. Create Notification Channel for Android 8+
        createNotificationChannel()

        // 5. Register broadcast receiver for headphone / bluetooth disconnection
        registerNoisyReceiver()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VAIBIFY Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Controls and media info for VAIBIFY playback"
                setShowBadge(false)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun registerNoisyReceiver() {
        audioNoisyReceiver = AudioNoisyReceiver {
            // When Bluetooth or wired headphones are disconnected, immediately pause
            if (exoPlayer.isPlaying) {
                exoPlayer.pause()
            }
        }
        val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
        registerReceiver(audioNoisyReceiver, filter)
    }

    @OptIn(UnstableApi::class)
    fun playSong(uri: String, title: String, artist: String, artworkUri: String?) {
        val metadata = MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .apply {
                artworkUri?.let { setArtworkUri(Uri.parse(it)) }
            }
            .build()

        val mediaItem = MediaItem.Builder()
            .setUri(uri)
            .setMediaMetadata(metadata)
            .build()

        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.prepare()
        exoPlayer.play()
    }

    fun play() = exoPlayer.play()
    fun pause() = exoPlayer.pause()
    fun seekTo(positionMs: Long) = exoPlayer.seekTo(positionMs)
    fun next() = exoPlayer.seekToNextMediaItem()
    fun previous() = exoPlayer.seekToPreviousMediaItem()
    fun setVolume(volume: Float) { exoPlayer.volume = volume }
    fun getPlayer(): ExoPlayer = exoPlayer

    private fun updateNotification() {
        // Android Media3 MediaSessionService handles standard platform notifications automatically
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    override fun onDestroy() {
        try {
            audioNoisyReceiver?.let { unregisterReceiver(it) }
        } catch (ignored: Exception) {}

        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        instance = null
        super.onDestroy()
    }
}
