package com.vaibify.app.audio;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Capacitor Plugin bridging React Web UI with VaibifyPlaybackService & ExoPlayer.
 */
@CapacitorPlugin(name = "VaibifyAudio")
public class VaibifyAudioPlugin extends Plugin {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private VaibifyPlaybackService.PlaybackEventListener serviceListener;

    @Override
    public void load() {
        super.load();

        serviceListener = new VaibifyPlaybackService.PlaybackEventListener() {
            @Override
            public void onPlaybackStateChanged(boolean isPlaying, boolean isBuffering, long positionMs, long durationMs) {
                JSObject data = new JSObject();
                data.put("isPlaying", isPlaying);
                data.put("isBuffering", isBuffering);
                data.put("position", (double) positionMs / 1000.0);
                data.put("duration", (double) durationMs / 1000.0);
                notifyListeners("onPlaybackStateChanged", data);
            }

            @Override
            public void onTrackChanged(VaibifyPlaybackService.SongData currentSong, int currentIndex) {
                JSObject data = new JSObject();
                data.put("currentIndex", currentIndex);
                if (currentSong != null) {
                    try {
                        data.put("currentSong", new JSObject(currentSong.toJson().toString()));
                    } catch (Exception ignored) {}
                }
                notifyListeners("onTrackChanged", data);
            }

            @Override
            public void onQueueUpdated(List<VaibifyPlaybackService.SongData> queue, int currentIndex) {
                JSObject data = new JSObject();
                data.put("currentIndex", currentIndex);
                JSArray arr = new JSArray();
                for (VaibifyPlaybackService.SongData s : queue) {
                    try {
                        arr.put(new JSObject(s.toJson().toString()));
                    } catch (Exception ignored) {}
                }
                data.put("queue", arr);
                notifyListeners("onQueueUpdated", data);
            }
        };

        VaibifyPlaybackService.addEventListener(serviceListener);
    }

    private void ensureServiceStarted() {
        Context context = getContext();
        if (context != null && VaibifyPlaybackService.instance == null) {
            Intent intent = new Intent(context, VaibifyPlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        ensureServiceStarted();
        JSObject songObj = call.getObject("song");
        if (songObj == null) {
            call.reject("Missing song data");
            return;
        }

        VaibifyPlaybackService.SongData song = VaibifyPlaybackService.SongData.fromJson(songObj);

        List<VaibifyPlaybackService.SongData> queueList = new ArrayList<>();
        JSArray queueArr = call.getArray("queue");
        int startIndex = call.getInt("startIndex", 0);

        if (queueArr != null) {
            for (int i = 0; i < queueArr.length(); i++) {
                try {
                    JSONObject item = queueArr.getJSONObject(i);
                    queueList.add(VaibifyPlaybackService.SongData.fromJson(item));
                } catch (Exception ignored) {}
            }
        }

        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.playSong(song, queueList, startIndex);
                call.resolve();
            } else {
                // Wait briefly for service to bind
                mainHandler.postDelayed(() -> {
                    if (VaibifyPlaybackService.instance != null) {
                        VaibifyPlaybackService.instance.playSong(song, queueList, startIndex);
                    }
                    call.resolve();
                }, 300);
            }
        });
    }

    @PluginMethod
    public void playQueue(PluginCall call) {
        ensureServiceStarted();
        JSArray queueArr = call.getArray("queue");
        int startIndex = call.getInt("startIndex", 0);

        if (queueArr == null || queueArr.length() == 0) {
            call.reject("Queue is empty");
            return;
        }

        List<VaibifyPlaybackService.SongData> queueList = new ArrayList<>();
        for (int i = 0; i < queueArr.length(); i++) {
            try {
                JSONObject item = queueArr.getJSONObject(i);
                queueList.add(VaibifyPlaybackService.SongData.fromJson(item));
            } catch (Exception ignored) {}
        }

        if (queueList.isEmpty()) {
            call.reject("No valid tracks in queue");
            return;
        }

        int targetIdx = Math.max(0, Math.min(startIndex, queueList.size() - 1));
        VaibifyPlaybackService.SongData targetSong = queueList.get(targetIdx);

        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.playSong(targetSong, queueList, targetIdx);
                call.resolve();
            } else {
                mainHandler.postDelayed(() -> {
                    if (VaibifyPlaybackService.instance != null) {
                        VaibifyPlaybackService.instance.playSong(targetSong, queueList, targetIdx);
                    }
                    call.resolve();
                }, 300);
            }
        });
    }

    @PluginMethod
    public void pause(PluginCall call) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.pause();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void resume(PluginCall call) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.play();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Double posSec = call.getDouble("position");
        if (posSec == null) {
            posSec = call.getDouble("positionMs", 0.0) / 1000.0;
        }
        long posMs = (long) (posSec * 1000.0);

        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.seekTo(posMs);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void next(PluginCall call) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.next();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void previous(PluginCall call) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.previous();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double vol = call.getDouble("volume", 1.0);
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setVolume(vol.floatValue());
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setShuffle(PluginCall call) {
        Boolean shuffle = call.getBoolean("shuffle", false);
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setShuffle(shuffle);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setRepeatMode(PluginCall call) {
        String mode = call.getString("repeatMode", "all");
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setRepeatMode(mode);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void getPlaybackState(PluginCall call) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                JSONObject json = VaibifyPlaybackService.instance.getFullPlaybackStateJson();
                try {
                    call.resolve(new JSObject(json.toString()));
                    return;
                } catch (Exception ignored) {}
            }
            JSObject fallback = new JSObject();
            fallback.put("isPlaying", false);
            fallback.put("isBuffering", false);
            fallback.put("position", 0.0);
            fallback.put("duration", 0.0);
            fallback.put("currentIndex", -1);
            fallback.put("repeatMode", "all");
            fallback.put("shuffle", false);
            call.resolve(fallback);
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (serviceListener != null) {
            VaibifyPlaybackService.removeEventListener(serviceListener);
            serviceListener = null;
        }
        super.handleOnDestroy();
    }
}
