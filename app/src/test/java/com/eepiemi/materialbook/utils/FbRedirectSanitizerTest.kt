package com.eepiemi.materialbook.utils

import org.junit.Assert.assertEquals
import org.junit.Test

class FbRedirectSanitizerTest {

    @Test
    fun whatsappShareUrlIsNotDoubleEncoded() {
        // Issue #28: Facebook Reel share URL to WhatsApp must not be double-encoded
        val input = "https://api.whatsapp.com/send?text=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fr%2F1GM1KzVaBR%2F"
        val expected = "https://api.whatsapp.com/send?text=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fr%2F1GM1KzVaBR%2F"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun unwrapLFacebookRedirectAndStripFbclid() {
        val input = "https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Fpost%3Fid%3D42%26fbclid%3D12345&h=AT123"
        val expected = "https://example.com/post?id=42"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun unwrapLmFacebookRedirectAndStripFbclid() {
        val input = "https://lm.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Fnews%3Ffbclid%3Dabc123xyz&h=mobile"
        val expected = "https://example.com/news"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun stripFbclidFromDirectUrl() {
        val input = "https://example.com/watch?v=abcd&fbclid=tracking_code&t=10s"
        val expected = "https://example.com/watch?v=abcd&t=10s"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun stripStandaloneFbclidRemovesQuestionMark() {
        val input = "https://example.com/landing?fbclid=only_tracking"
        val expected = "https://example.com/landing"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun handleValuelessQueryParametersGracefully() {
        val input = "https://example.com/article?preview&theme=dark&fbclid=removeme"
        val expected = "https://example.com/article?preview&theme=dark"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun preservePortAndAnchorFragment() {
        val input = "https://example.com:8080/docs/page?fbclid=123#section-2"
        val expected = "https://example.com:8080/docs/page#section-2"
        assertEquals(expected, fbRedirectSanitizer(input))
    }

    @Test
    fun nonHttpCustomSchemesArePreserved() {
        val whatsappCustom = "whatsapp://send?text=https%3A%2F%2Fwww.facebook.com%2Fshare%2Fr%2F1GM1KzVaBR%2F"
        assertEquals(whatsappCustom, fbRedirectSanitizer(whatsappCustom))

        val intentScheme = "intent://send?text=test#Intent;scheme=whatsapp;package=com.whatsapp;end"
        assertEquals(intentScheme, fbRedirectSanitizer(intentScheme))
    }
}
