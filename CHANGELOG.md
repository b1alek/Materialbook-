# Changelog

All notable changes to this fork (`b1alek/Materialbook-`) will be documented in this file.

## [v1.3.2] - 2026-10-08

### Fixed
- **Landscape Post Detail Clipping & Shift**: Fixed bug where viewing post permalinks, single post detail views, and comments in landscape orientation shifted content to the right and clipped it off-screen.
  - Eliminated blanket `left: 50%; transform: translateX(-50%)` CSS rules on general `MContainer` elements that caused cascading offset multiplication.
  - Centered mobile layout using safe root and scroller constraints (`max-width: 560px; margin: 0 auto; width: 100%;`).
  - Isolated header centering strictly to fixed top navbar containers.
- **Universal Text Selection & Copy Context Menu**:
  - Restored ability to select and copy text on posts, captions, articles, and comments across Facebook mobile.
  - Injected universal `-webkit-user-select: text !important; user-select: text !important; -webkit-touch-callout: default !important;` styling across post text, captions, and comments.
  - Prevented card button click handlers from aborting text selection and opening post details while the user is actively selecting or highlighting text.

---

## [v1.3.1] - 2026-10-08

### Fixed
- **Landscape Layout Centering**: Fixed bug where rotating the device into landscape caused the Facebook mobile feed and navigation to remain stuck in a narrow ~450px column on the left with an empty black void on the right.
- **Responsive Mobile Landscape Styles**:
  - Injected declarative responsive CSS (`@media (orientation: landscape)`) to center mobile feed scroller (`max-width: 540px; margin: 0 auto;`).
  - Centered sticky header banner and tablist horizontally over the feed in landscape mode.
  - Added resize and orientation listeners to dynamically adjust header geometry without requiring page reloads.
- **Tablet Auto-Desktop Boundary**: Restricted `rememberAutoDesktop()` strictly to physical tablets (`smallestScreenWidthDp >= 600`), preventing phones from triggering unwanted desktop mode switching or layout distortions.

---

## [v1.3.0] - 2026-10-08

### Added
- **Feed Position & Scroll Retention**: Added automatic reading position preservation when switching apps or rotating the device screen.
- **Feed Anchor Userscript (`preserve_scroll.js`)**:
  - Dynamically tracks topmost visible post elements (`role="article"`, `[data-ft]`) and stores anchor data in `sessionStorage`.
  - Re-anchors viewport via `element.scrollIntoView()` on viewport resize and app resume.
  - Intercepts Facebook's automated `scrollTo(0, 0)` calls for 1500ms following resume or rotation.
  - Implements user touch escape hatch (`touchstart`, `pointerdown`) to preserve deliberate manual scroll-to-top actions (e.g. tapping the Home tab or pulling down to refresh).
- **Settings Toggle**: Added "Preserve feed position" toggle switch in Settings UI with DataStore persistence (default: enabled).

### Fixed
- **Background Media Silence**: Automatically pauses active `<video>` and `<audio>` elements when the app moves to background (`visibilitychange` / `pagehide`).
- **Android Lifecycle Resource Drain**: Bound WebView lifecycle to Activity lifecycle (`WebView.onPause()` / `onResume()`), halting background JavaScript execution and saving battery.
- **Duplicate Activity Spawning**: Configured `android:launchMode="singleTask"` and implemented `onNewIntent()` in `MainActivity.kt` to handle external links and app switching cleanly without creating redundant instances.

---

## [v1.2.1] - 2026-10-07

### Fixed
- **WhatsApp Share URL Encoding ([#28](https://github.com/eepiemi/Materialbook/issues/28))**: Fixed bug where sharing Facebook Reels or posts to WhatsApp double-encoded URLs (`https%3A%2F%2F...` instead of `https://...`).
- **Facebook Redirect Sanitizer**:
  - Removed redundant `URLEncoder.encode` on query parameter values in `fbRedirectSanitizer.kt`.
  - Added unwrapping support for mobile Facebook redirects (`lm.facebook.com/l.php?u=...`).
  - Handled valueless query parameters gracefully without throwing `IndexOutOfBoundsException`.
- **External Intent Resolution**: Added safe parsing for `intent:` URI schemes using `Intent.parseUri` with `CATEGORY_BROWSABLE` in `MaterialbookWV.kt`.
- **Unit Tests**: Added automated unit test suite in `FbRedirectSanitizerTest.kt` covering WhatsApp sharing, redirect unwrapping, and parameter sanitization.

---

## [v1.2.0] - 2026-10-07

### Added
- **Polish (pl) Localization**: Complete translation of application strings and settings into Polish (`values-pl/strings.xml`).
- **Enhanced Adblock**: Added support for detecting and hiding sponsored content in Polish ("Sponsorowane") alongside English ("Sponsored").

### Fixed
- **Desktop Messenger Dark Mode**: Injected AMOLED Black / dark styling into the desktop Messenger view to prevent bright white backgrounds when Desktop Messages mode is enabled.
- **Local-Only Script Loading**: Refactored `fetchScripts.kt` to load JavaScript directly from local application assets (`raw/`) instead of making unauthenticated remote GitHub requests.

---

## [v1.1.1] - 2026-10-07

### Changed
- **Package ID Decoupling**: Updated `applicationId` to `com.b1alek.materialbook` to eliminate Obtainium duplicate app warnings and allow co-installation alongside the upstream app.
- **CI/CD Signing Keystore**: Integrated persistent release keystore in GitHub Actions to ensure unbroken signature continuity across automated updates.

---

## [v1.1.0] - 2026-10-07

### Added
- **Desktop Messages Integration ([PR #43](https://github.com/eepiemi/Materialbook/pull/43))**: Support for viewing Messenger in desktop mode while retaining mobile layout for the feed.
- **Obtainium Support**: Added one-click "Add to Obtainium" badges and setup instructions in `README.md`.
- **Automated CI/CD**: Configured GitHub Actions workflow (`create-release.yml`) for automated building and tagging of APK releases.
