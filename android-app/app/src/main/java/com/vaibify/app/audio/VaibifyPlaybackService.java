package com.vaibify.app.audio;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.DefaultMediaNotificationProvider;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.target.CustomTarget;
import com.bumptech.glide.request.transition.Transition;
import com.vaibify.app.MainActivity;
import com.vaibify.app.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * VAIBIFY - Native Android Media3 MediaSessionService
 *
 * Implements continuous foreground background playback:
 * - Stays active when Activity is destroyed, minimized, or screen locked.
 * - Handles Android Audio Focus automatically (phone calls, navigation, other media).
 * - Exposes MediaSession for Android 13/14+ System UI, Lock Screen, and Bluetooth controls.
 * - Automatically advances through queue on track completion.
 * - Pauses on headphone / Bluetooth disconnection.
 */
public class VaibifyPlaybackService extends MediaSessionService {

    private static final String TAG = "VaibifyPlaybackService";
    public static final String CHANNEL_ID = "vaibify_playback_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static volatile VaibifyPlaybackService instance = null;

    public interface PlaybackEventListener {
        void onPlaybackStateChanged(boolean isPlaying, boolean isBuffering, long positionMs, long durationMs);
        void onTrackChanged(SongData currentSong, int currentIndex);
        void onQueueUpdated(List<SongData> queue, int currentIndex);
    }

    private static final List<PlaybackEventListener> listeners = Collections.synchronizedList(new ArrayList<>());

    public static void addEventListener(PlaybackEventListener listener) {
        if (listener != null && !listeners.contains(listener)) {
            listeners.add(listener);
        }
    }

    public static void removeEventListener(PlaybackEventListener listener) {
        if (listener != null) {
            listeners.remove(listener);
        }
    }

    public static class SongData {
        public String id = "";
        public String title = "Unknown Title";
        public String artist = "VAIBIFY";
        public String album = "VAIBIFY";
        public String thumbnail = "";
        public String streamUrl = "";
        public long duration = 0;

        public JSONObject toJson() {
            JSONObject obj = new JSONObject();
            try {
                obj.put("id", id);
                obj.put("title", title);
                obj.put("artist", artist);
                obj.put("album", album);
                obj.put("thumbnail", thumbnail);
                obj.put("streamUrl", streamUrl);
                obj.put("duration", duration);
            } catch (Exception ignored) {}
            return obj;
        }

        public static SongData fromJson(JSONObject json) {
            SongData s = new SongData();
            if (json == null) return s;
            s.id = json.optString("id", "");
            s.title = json.optString("title", "Unknown Track");
            s.artist = json.optString("artist", "VAIBIFY");
            s.album = json.optString("album", "VAIBIFY");
            s.thumbnail = json.optString("thumbnail", "");
            if (s.thumbnail.isEmpty()) s.thumbnail = json.optString("artwork", "");
            s.streamUrl = json.optString("streamUrl", "");
            if (s.streamUrl.isEmpty()) s.streamUrl = json.optString("url", "");
            s.duration = json.optLong("duration", 0);
            return s;
        }
    }

    private MediaSession mediaSession;
    private ExoPlayer exoPlayer;
    private AudioNoisyReceiver audioNoisyReceiver;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private final List<SongData> queue = new ArrayList<>();
    private int currentIndex = -1;
    private String repeatMode = "all"; // "off", "all", "one"
    private boolean shuffleMode = false;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        Log.i(TAG, "VaibifyPlaybackService onCreate()");

        // 1. Create dedicated Notification Channel for music playback
        createNotificationChannel();

        // 2. Configure AudioAttributes for music playback with automatic Audio Focus
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                .setUsage(C.USAGE_MEDIA)
                .build();

        // 3. Initialize single ExoPlayer instance
        exoPlayer = new ExoPlayer.Builder(this)
                .setAudioAttributes(audioAttributes, true) // true enables automatic Android audio focus management
                .setHandleAudioBecomingNoisy(true) // pauses playback when headphones/bluetooth disconnect
                .setWakeMode(C.WAKE_MODE_NETWORK) // keeps CPU and Wi-Fi active for playback while screen is off
                .build();

        exoPlayer.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                notifyPlaybackState();
                if (playbackState == Player.STATE_ENDED) {
                    handleTrackEnded();
                }
            }

            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                notifyPlaybackState();
            }

            @Override
            public void onMediaItemTransition(@Nullable MediaItem mediaItem, int reason) {
                int currentMediaItemIndex = exoPlayer.getCurrentMediaItemIndex();
                if (currentMediaItemIndex >= 0 && currentMediaItemIndex < queue.size()) {
                    currentIndex = currentMediaItemIndex;
                    notifyTrackTransition(queue.get(currentIndex), currentIndex);
                }
            }

            @Override
            public void onPlayerError(@NonNull PlaybackException error) {
                Log.e(TAG, "ExoPlayer error occurred: " + error.getMessage(), error);
                // Attempt next track on unrecoverable stream errors
                if (queue.size() > 1 && currentIndex < queue.size() - 1) {
                    mainHandler.postDelayed(() -> next(), 1000);
                }
            }
        });

        // 4. Build MediaSession attached to MainActivity
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent sessionActivityPendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, exoPlayer)
                .setSessionActivity(sessionActivityPendingIntent)
                .build();

        // 5. Configure DefaultMediaNotificationProvider
        try {
            DefaultMediaNotificationProvider notificationProvider = new DefaultMediaNotificationProvider.Builder(this)
                    .setChannelId(CHANNEL_ID)
                    .build();
            setMediaNotificationProvider(notificationProvider);
        } catch (Exception e) {
            Log.w(TAG, "Failed to set custom notification provider: " + e.getMessage());
        }

        // 6. Register AudioBecomingNoisy receiver as secondary safeguard
        registerNoisyReceiver();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.vaibify_music_channel),
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Media controls and playback information for VAIBIFY");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void registerNoisyReceiver() {
        audioNoisyReceiver = new AudioNoisyReceiver(() -> {
            if (exoPlayer != null && exoPlayer.isPlaying()) {
                exoPlayer.pause();
            }
        });
        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        registerReceiver(audioNoisyReceiver, filter);
    }

    // ==========================================
    // Playback Controls
    // ==========================================

    public synchronized void playSong(SongData song, List<SongData> newQueue, int startIndex) {
        if (song == null) {
            Log.w(TAG, "playSong called with null song");
            return;
        }

        if (song.streamUrl == null || song.streamUrl.trim().isEmpty()) {
            String vid = (song.id != null && !song.id.isEmpty()) ? song.id : "fJ9rUzIMcZQ";
            song.streamUrl = "https://music.artistbots.workers.dev/download?id=" + vid + "&api_key=ArtistbotsNGDYfcU";
        }

        if (newQueue != null && !newQueue.isEmpty()) {
            for (SongData item : newQueue) {
                if (item != null && (item.streamUrl == null || item.streamUrl.trim().isEmpty())) {
                    String vid = (item.id != null && !item.id.isEmpty()) ? item.id : "fJ9rUzIMcZQ";
                    item.streamUrl = "https://music.artistbots.workers.dev/download?id=" + vid + "&api_key=ArtistbotsNGDYfcU";
                }
            }
            queue.clear();
            queue.addAll(newQueue);
            currentIndex = startIndex >= 0 && startIndex < queue.size() ? startIndex : 0;
        } else if (queue.isEmpty() || currentIndex < 0 || !queue.get(currentIndex).id.equals(song.id)) {
            queue.clear();
            queue.add(song);
            currentIndex = 0;
        }

        buildExoPlaylistFromQueue(currentIndex);
        notifyQueueUpdated();
    }

    private void buildExoPlaylistFromQueue(int initialIndex) {
        if (queue.isEmpty() || initialIndex < 0 || initialIndex >= queue.size()) return;

        List<MediaItem> mediaItems = new ArrayList<>();
        for (SongData item : queue) {
            MediaMetadata.Builder metaBuilder = new MediaMetadata.Builder()
                    .setTitle(item.title)
                    .setArtist(item.artist)
                    .setAlbumTitle(item.album != null ? item.album : "VAIBIFY");

            if (item.thumbnail != null && !item.thumbnail.trim().isEmpty()) {
                metaBuilder.setArtworkUri(Uri.parse(item.thumbnail));
            }

            MediaItem mi = new MediaItem.Builder()
                    .setMediaId(item.id)
                    .setUri(item.streamUrl)
                    .setMediaMetadata(metaBuilder.build())
                    .build();
            mediaItems.add(mi);
        }

        exoPlayer.setMediaItems(mediaItems, initialIndex, 0);
        exoPlayer.prepare();
        exoPlayer.play();

        // Also async load artwork bitmap for lock screen / older Android notification compatibility
        loadArtworkBitmapForCurrentTrack(queue.get(initialIndex));
    }

    private void loadArtworkBitmapForCurrentTrack(SongData song) {
        if (song.thumbnail == null || song.thumbnail.trim().isEmpty()) return;
        try {
            Glide.with(this)
                    .asBitmap()
                    .load(song.thumbnail)
                    .into(new CustomTarget<Bitmap>() {
                        @Override
                        public void onResourceReady(@NonNull Bitmap resource, @Nullable Transition<? super Bitmap> transition) {
                            try {
                                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                                resource.compress(Bitmap.CompressFormat.PNG, 90, stream);
                                byte[] byteArray = stream.toByteArray();

                                MediaMetadata currentMeta = exoPlayer.getMediaMetadata();
                                MediaMetadata updatedMeta = currentMeta.buildUpon()
                                        .setArtworkData(byteArray, MediaMetadata.PICTURE_TYPE_FRONT_COVER)
                                        .build();

                                // Update current item metadata with artwork byte array
                                int curIdx = exoPlayer.getCurrentMediaItemIndex();
                                if (curIdx >= 0 && curIdx < queue.size()) {
                                    MediaItem curItem = exoPlayer.getCurrentMediaItem();
                                    if (curItem != null) {
                                        MediaItem updatedItem = curItem.buildUpon()
                                                .setMediaMetadata(updatedMeta)
                                                .build();
                                        exoPlayer.replaceMediaItem(curIdx, updatedItem);
                                    }
                                }
                            } catch (Exception ignored) {}
                        }

                        @Override
                        public void onLoadCleared(@Nullable Drawable placeholder) {}
                    });
        } catch (Exception ignored) {}
    }

    private void handleTrackEnded() {
        if ("one".equalsIgnoreCase(repeatMode)) {
            exoPlayer.seekTo(0);
            exoPlayer.play();
        } else if (currentIndex < queue.size() - 1) {
            next();
        } else if ("all".equalsIgnoreCase(repeatMode) && !queue.isEmpty()) {
            currentIndex = 0;
            exoPlayer.seekToDefaultPosition(0);
            exoPlayer.play();
        }
    }

    public void play() {
        if (exoPlayer != null) {
            exoPlayer.play();
        }
    }

    public void pause() {
        if (exoPlayer != null) {
            exoPlayer.pause();
        }
    }

    public void seekTo(long positionMs) {
        if (exoPlayer != null) {
            exoPlayer.seekTo(positionMs);
        }
    }

    public void next() {
        if (exoPlayer != null && exoPlayer.hasNextMediaItem()) {
            exoPlayer.seekToNextMediaItem();
            exoPlayer.play();
        } else if ("all".equalsIgnoreCase(repeatMode) && !queue.isEmpty()) {
            currentIndex = 0;
            exoPlayer.seekToDefaultPosition(0);
            exoPlayer.play();
        }
    }

    public void previous() {
        if (exoPlayer != null) {
            if (exoPlayer.getCurrentPosition() > 3000) {
                exoPlayer.seekTo(0);
            } else if (exoPlayer.hasPreviousMediaItem()) {
                exoPlayer.seekToPreviousMediaItem();
                exoPlayer.play();
            } else {
                exoPlayer.seekTo(0);
            }
        }
    }

    public void setVolume(float volume) {
        if (exoPlayer != null) {
            exoPlayer.setVolume(Math.max(0.0f, Math.min(1.0f, volume)));
        }
    }

    public void setShuffle(boolean shuffle) {
        this.shuffleMode = shuffle;
        if (exoPlayer != null) {
            exoPlayer.setShuffleModeEnabled(shuffle);
        }
        notifyPlaybackState();
    }

    public void setRepeatMode(String mode) {
        this.repeatMode = mode;
        if (exoPlayer != null) {
            if ("one".equalsIgnoreCase(mode)) {
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_ONE);
            } else if ("all".equalsIgnoreCase(mode)) {
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_ALL);
            } else {
                exoPlayer.setRepeatMode(Player.REPEAT_MODE_OFF);
            }
        }
        notifyPlaybackState();
    }

    public boolean isPlaying() {
        return exoPlayer != null && exoPlayer.isPlaying();
    }

    public long getPositionMs() {
        return exoPlayer != null ? exoPlayer.getCurrentPosition() : 0;
    }

    public long getDurationMs() {
        return exoPlayer != null ? exoPlayer.getDuration() : 0;
    }

    public SongData getCurrentSong() {
        if (currentIndex >= 0 && currentIndex < queue.size()) {
            return queue.get(currentIndex);
        }
        return null;
    }

    public List<SongData> getQueue() {
        return new ArrayList<>(queue);
    }

    public int getCurrentIndex() {
        return currentIndex;
    }

    public String getRepeatMode() {
        return repeatMode;
    }

    public boolean isShuffle() {
        return shuffleMode;
    }

    public JSONObject getFullPlaybackStateJson() {
        JSONObject state = new JSONObject();
        try {
            boolean isPlaying = isPlaying();
            boolean isBuffering = exoPlayer != null && exoPlayer.getPlaybackState() == Player.STATE_BUFFERING;
            long pos = getPositionMs();
            long dur = getDurationMs();
            if (dur < 0) dur = 0;

            state.put("isPlaying", isPlaying);
            state.put("isBuffering", isBuffering);
            state.put("position", (double) pos / 1000.0);
            state.put("duration", (double) dur / 1000.0);
            state.put("currentIndex", currentIndex);
            state.put("repeatMode", repeatMode);
            state.put("shuffle", shuffleMode);
            state.put("volume", exoPlayer != null ? exoPlayer.getVolume() : 1.0);

            SongData cur = getCurrentSong();
            if (cur != null) {
                state.put("currentSong", cur.toJson());
            } else {
                state.put("currentSong", JSONObject.NULL);
            }

            JSONArray queueArray = new JSONArray();
            for (SongData s : queue) {
                queueArray.put(s.toJson());
            }
            state.put("queue", queueArray);
        } catch (Exception ignored) {}
        return state;
    }

    // ==========================================
    // Event Notification Callbacks
    // ==========================================

    private void notifyPlaybackState() {
        boolean isPlaying = isPlaying();
        boolean isBuffering = exoPlayer != null && exoPlayer.getPlaybackState() == Player.STATE_BUFFERING;
        long pos = getPositionMs();
        long dur = getDurationMs();

        for (PlaybackEventListener l : listeners) {
            try {
                l.onPlaybackStateChanged(isPlaying, isBuffering, pos, dur);
            } catch (Exception ignored) {}
        }
    }

    private void notifyTrackTransition(SongData song, int index) {
        for (PlaybackEventListener l : listeners) {
            try {
                l.onTrackChanged(song, index);
            } catch (Exception ignored) {}
        }
    }

    private void notifyQueueUpdated() {
        for (PlaybackEventListener l : listeners) {
            try {
                l.onQueueUpdated(new ArrayList<>(queue), currentIndex);
            } catch (Exception ignored) {}
        }
    }

    // ==========================================
    // Service Lifecycle
    // ==========================================

    @Nullable
    @Override
    public MediaSession onGetSession(@NonNull MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // When user swipes the app out of recents:
        // If music IS playing, keep service running as foreground service!
        // If music is paused, stop the service.
        if (exoPlayer != null && !exoPlayer.getPlayWhenReady()) {
            stopSelf();
        }
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "VaibifyPlaybackService onDestroy()");
        if (audioNoisyReceiver != null) {
            try {
                unregisterReceiver(audioNoisyReceiver);
            } catch (Exception ignored) {}
            audioNoisyReceiver = null;
        }

        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }

        if (exoPlayer != null) {
            exoPlayer.release();
            exoPlayer = null;
        }

        instance = null;
        super.onDestroy();
    }
}
