package com.eepiemi.materialbook

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.view.WindowCompat
import com.eepiemi.materialbook.ui.screens.MaterialbookWebView
import com.eepiemi.materialbook.ui.theme.MaterialbookTheme
import java.io.File

class MainActivity : ComponentActivity() {
    private var activeUrl by mutableStateOf<String?>("https://facebook.com/")

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()

        val prefs = getSharedPreferences("materialbook_version", Context.MODE_PRIVATE)
        val lastVersionCode = prefs.getInt("last_version_code", 0)
        val currentVersionCode = runCatching {
            val pInfo = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(packageName, android.content.pm.PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(packageName, 0)
            }
            androidx.core.content.pm.PackageInfoCompat.getLongVersionCode(pInfo).toInt()
        }.getOrElse { BuildConfig.VERSION_CODE }
        val hasPreviousInstall = File(filesDir.parentFile, "app_webview").exists()
        val isUpgrade = (lastVersionCode != 0 && currentVersionCode > lastVersionCode) ||
                (lastVersionCode == 0 && hasPreviousInstall)

        if (isUpgrade) {
            // Emulate OS "Clear cache": purge HTTP disk cache AND precompiled V8 code cache
            runCatching { cacheDir.deleteRecursively() }
            runCatching { codeCacheDir.deleteRecursively() }
        }

        // Discard stale Chromium process and session state bundles on app upgrade
        val stateToRestore = if (isUpgrade) null else savedInstanceState
        super.onCreate(stateToRestore)

        if (isUpgrade || lastVersionCode == 0) {
            prefs.edit().putInt("last_version_code", currentVersionCode).apply()
        }

        intent?.data?.toString()?.let {
            activeUrl = it
        }

        setContent {
            MaterialbookTheme {
                MaterialbookWebView(
                    url = activeUrl ?: "https://facebook.com/",
                    isUpgrade = isUpgrade
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.toString()?.let { newUrl ->
            activeUrl = newUrl
        }
    }
}