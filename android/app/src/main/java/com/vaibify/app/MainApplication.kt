package com.vaibify.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.vaibify.app.audio.VaibifyPackage

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages.toMutableList()
            // Add custom native audio package with Media3 & ExoPlayer
            packages.add(VaibifyPackage())
            return packages
        }

        override fun getJSMainModuleName(): String = "index"
        override val isNewArchEnabled: Boolean = false
        override val isHermesEnabled: Boolean = true
    }

    override val reactNativeHost: ReactNativeHost
        get() = mReactNativeHost

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
