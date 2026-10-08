package com.eepiemi.materialbook.utils

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration

@Composable
fun rememberAutoDesktop(): Boolean {
    val configuration = LocalConfiguration.current
    return remember(configuration.smallestScreenWidthDp) {
        configuration.smallestScreenWidthDp >= 600
    }
}