package com.eepiemi.materialbook

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

class MainActivity : ComponentActivity() {
    private var activeUrl by mutableStateOf<String?>("https://facebook.com/")

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        intent?.data?.toString()?.let {
            activeUrl = it
        }

        setContent {
            MaterialbookTheme {
                MaterialbookWebView(
                    url = activeUrl ?: "https://facebook.com/"
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