package com.eepiemi.materialbook.utils.jsBridge

import android.webkit.JavascriptInterface

class MaterialbookSettings (
    private val toggleSettings: () -> Unit,
    private val cleanReloadAction: (() -> Unit)? = null
) {
    @JavascriptInterface
    @Suppress("unused")
    fun onSettingsToggle() = toggleSettings()

    @JavascriptInterface
    @Suppress("unused")
    fun cleanReload() = cleanReloadAction?.invoke()
}