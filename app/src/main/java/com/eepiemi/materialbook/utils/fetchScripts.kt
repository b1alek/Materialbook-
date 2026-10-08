package com.eepiemi.materialbook.utils

import androidx.annotation.RawRes

data class Script(
    val isEnabled: Boolean,
    @param:RawRes val resourceId: Int,
    val scriptTitle: String
)

/**
 * Loads enabled JavaScript user scripts directly from local bundled resources (res/raw).
 * Remote execution is intentionally disabled to guarantee security, fast offline-first
 * startup, and complete independence from upstream repository changes.
 */
suspend fun fetchScripts(
    scripts: List<Script>,
    fallbackContent: (Int) -> String
): String {
    return buildString {
        scripts.filter { it.isEnabled }.forEach { script ->
            val content = fallbackContent(script.resourceId)
            append("/* Script: ${script.scriptTitle} */\n")
            append("try {\n")
            append("  (function() {\n")
            append(content)
            append("\n  })();\n")
            append("} catch (err) {\n")
            append("  console.error('Error executing script: ${script.scriptTitle}', err);\n")
            append("};\n\n")
        }
    }
}
