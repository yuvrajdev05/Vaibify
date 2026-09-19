package com.vaibify.app.audio;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Direct JavaScript Interface attached to WebView as window.VaibifyNativeAudio.
 * Provides fallback high-performance bridge when running inside the Capacitor WebView.
 */
public class VaibifyNativeBridge {

    private final Context context;
    private final WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private VaibifyPlaybackService.PlaybackEventListener listener;

    public VaibifyNativeBridge(Context context, WebView webView) {
        this.context = context;
        this.webView = webView;
        setupEventListener();
    }

    private void ensureServiceStarted() {
        if (context != null && VaibifyPlaybackService.instance == null) {
            Intent intent = new Intent(context, VaibifyPlaybackService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        }
    }

    private void setupEventListener() {
        listener = new VaibifyPlaybackService.PlaybackEventListener() {
            @Override
            public void onPlaybackStateChanged(boolean isPlaying, boolean isBuffering, long positionMs, long durationMs) {
                postToJs("if (window.__vaibifyOnPlaybackStateChanged) { window.__vaibifyOnPlaybackStateChanged("
                        + isPlaying + ", " + isBuffering + ", " + ((double) positionMs / 1000.0) + ", " + ((double) durationMs / 1000.0) + "); }");
            }

            @Override
            public void onTrackChanged(VaibifyPlaybackService.SongData currentSong, int currentIndex) {
                String songJson = currentSong != null ? currentSong.toJson().toString() : "null";
                postToJs("if (window.__vaibifyOnTrackChanged) { window.__vaibifyOnTrackChanged(" + songJson + ", " + currentIndex + "); }");
            }

            @Override
            public void onQueueUpdated(List<VaibifyPlaybackService.SongData> queue, int currentIndex) {
                JSONArray arr = new JSONArray();
                for (VaibifyPlaybackService.SongData s : queue) {
                    arr.put(s.toJson());
                }
                postToJs("if (window.__vaibifyOnQueueUpdated) { window.__vaibifyOnQueueUpdated(" + arr.toString() + ", " + currentIndex + "); }");
            }
        };

        VaibifyPlaybackService.addEventListener(listener);
    }

    private void postToJs(String script) {
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript(script, null);
            }
        });
    }

    @JavascriptInterface
    public boolean isNative() {
        return true;
    }

    @JavascriptInterface
    public void play(String songJsonStr, String queueJsonStr, int startIndex) {
        ensureServiceStarted();
        mainHandler.post(() -> {
            try {
                JSONObject songObj = new JSONObject(songJsonStr);
                VaibifyPlaybackService.SongData song = VaibifyPlaybackService.SongData.fromJson(songObj);

                List<VaibifyPlaybackService.SongData> queueList = new ArrayList<>();
                if (queueJsonStr != null && !queueJsonStr.trim().isEmpty()) {
                    JSONArray qArr = new JSONArray(queueJsonStr);
                    for (int i = 0; i < qArr.length(); i++) {
                        queueList.add(VaibifyPlaybackService.SongData.fromJson(qArr.getJSONObject(i)));
                    }
                }

                if (VaibifyPlaybackService.instance != null) {
                    VaibifyPlaybackService.instance.playSong(song, queueList, startIndex);
                } else {
                    mainHandler.postDelayed(() -> {
                        if (VaibifyPlaybackService.instance != null) {
                            VaibifyPlaybackService.instance.playSong(song, queueList, startIndex);
                        }
                    }, 300);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @JavascriptInterface
    public void pause() {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.pause();
            }
        });
    }

    @JavascriptInterface
    public void resume() {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.play();
            }
        });
    }

    @JavascriptInterface
    public void seekTo(double positionSec) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.seekTo((long) (positionSec * 1000.0));
            }
        });
    }

    @JavascriptInterface
    public void next() {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.next();
            }
        });
    }

    @JavascriptInterface
    public void previous() {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.previous();
            }
        });
    }

    @JavascriptInterface
    public void setVolume(double volume) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setVolume((float) volume);
            }
        });
    }

    @JavascriptInterface
    public void setShuffle(boolean shuffle) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setShuffle(shuffle);
            }
        });
    }

    @JavascriptInterface
    public void setRepeatMode(String repeatMode) {
        mainHandler.post(() -> {
            if (VaibifyPlaybackService.instance != null) {
                VaibifyPlaybackService.instance.setRepeatMode(repeatMode);
            }
        });
    }

    @JavascriptInterface
    public String getPlaybackState() {
        if (VaibifyPlaybackService.instance != null) {
            return VaibifyPlaybackService.instance.getFullPlaybackStateJson().toString();
        }
        return "{\"isPlaying\":false,\"isBuffering\":false,\"position\":0,\"duration\":0,\"currentIndex\":-1}";
    }

    public void destroy() {
        if (listener != null) {
            VaibifyPlaybackService.removeEventListener(listener);
            listener = null;
        }
    }
}
