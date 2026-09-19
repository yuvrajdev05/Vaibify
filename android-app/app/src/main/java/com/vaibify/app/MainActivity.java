package com.vaibify.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.vaibify.app.audio.VaibifyAudioPlugin;
import com.vaibify.app.audio.VaibifyNativeBridge;

public class MainActivity extends BridgeActivity {

    private VaibifyNativeBridge nativeBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VaibifyAudioPlugin.class);
        super.onCreate(savedInstanceState);

        // Request notification permission for Android 13+ to ensure media notification is displayed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebSettings settings = this.bridge.getWebView().getSettings();
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setJavaScriptEnabled(true);

                nativeBridge = new VaibifyNativeBridge(this, this.bridge.getWebView());
                this.bridge.getWebView().addJavascriptInterface(nativeBridge, "VaibifyNativeAudio");
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        if (nativeBridge != null) {
            nativeBridge.destroy();
            nativeBridge = null;
        }
        super.onDestroy();
    }
}
