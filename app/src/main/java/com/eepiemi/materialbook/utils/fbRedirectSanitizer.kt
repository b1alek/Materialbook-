package com.eepiemi.materialbook.utils

import java.net.URL
import java.net.URLDecoder

fun fbRedirectSanitizer(link: String): String {
    try {
        var url = URL(link)

        // Unwrap Facebook tracking redirect (l.facebook.com or lm.facebook.com)
        if ((url.host == "l.facebook.com" || url.host == "lm.facebook.com") && url.path == "/l.php") {
            val query = url.query
            if (query != null) {
                var target: String? = null
                for (param in query.split("&")) {
                    val parts = param.split("=", limit = 2)
                    if (parts[0] == "u" && parts.size == 2) {
                        target = URLDecoder.decode(parts[1], "UTF-8")
                        break
                    }
                }
                if (target != null) {
                    url = URL(target)
                } else {
                    return link
                }
            }
        }

        // Clean query: strip fbclid without re-encoding existing query parameters
        val cleanQuery = url.query?.split("&")
            ?.filterNot { it.startsWith("fbclid=") || it == "fbclid" }
            ?.joinToString("&")
            ?.takeIf { it.isNotEmpty() }

        return buildString {
            append("${url.protocol}://${url.host}")
            if (url.port != -1 && url.port != url.defaultPort) append(":${url.port}")
            append(url.path)
            if (cleanQuery != null) append("?").append(cleanQuery)
            if (url.ref != null) append("#").append(url.ref)
        }
    } catch (_: Exception) {
        return link
    }
}