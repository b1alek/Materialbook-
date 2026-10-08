# Changelog

All notable changes to this fork (`b1alek/Materialbook-`) will be documented in this file.

## [v1.4.0] - 2026-10-08

### Fixed
- **Mobile Landscape Feed Centering & Header Realignment**:
  - Fixed mobile layout disconnection in landscape mode where headers floated in the center while feed posts remained pinned to `x = 0` (left edge) with a large black void on the right.
  - Removed faulty `max-width: 1000px` media query constraint in `scripts.js` that caused landscape CSS to be ignored on high-density displays (e.g. 1024px+).
  - Applied flexbox centering to `body`, `#root`, and `div[data-type="vscroller"]` under `@media (orientation: landscape)`.
  - Replaced volatile `[data-is-pull-to-refresh-allowed="true"]` scroller selector in `sticky_navbar.js` with persistent `div[data-type="vscroller"]`, ensuring the scroller container continues to be tracked and centered when the user scrolls down into the feed.
  - Aligned header max-width and feed scroller max-width to 600px, expanding media and video containers to fill the centered column.

---

## [v1.3.9] - 2026-10-08

### Fixed
- **Eliminated Intrusive Feed Watchdog Popup**:
  - Removed synthetic JavaScript watchdog and the popup banner (`Feed taking too long to load`) from `scripts.js`.
  - The watchdog relied on checking `[role="article"]`, which mobile Facebook (`m.facebook.com`) does not use for feed posts (mobile uses `data-mcomponent="MContainer"` and `data-tracking-duration-id`). This selector mismatch caused false-positive stalls and intrusive popup overlays during normal operation.
  - Native cache cleanup (`codeCacheDir` + `cacheDir` in `MainActivity.kt`) and `rememberWebViewState` already resolve post-update freezes at the platform level, making the synthetic DOM watchdog redundant.

---

## [v1.3.8] - 2026-10-08

### Fixed
- **Persistent Skeleton Freeze & V8 Bytecode Cache Purge**:
  - Purged `context.codeCacheDir` (`/data/user/0/<pkg>/code_cache/`) alongside `context.cacheDir`. In Android OS "Clear cache", `installd` purges both `FLAG_CLEAR_CACHE_ONLY` and `FLAG_CLEAR_CODE_CACHE_ONLY`. Chromium stores precompiled V8 bytecode in `code_cache/web_view/js/`. Deleting both directories prevents V8 bytecode mismatch errors that halt React client hydration.
  - Replaced `rememberSaveableWebViewState` with clean `rememberWebViewState` in Compose: prevented dead Chromium process bundles from being serialized into Android `savedInstanceState` and restored on cold starts.
  - Exposed `cleanReload()` on `MaterialbookSettings` JavaScript bridge (`SettingsBridge.cleanReload()`).
  - Connected the watchdog auto-recovery and the watchdog [Reload] button to `SettingsBridge.cleanReload()`, wiping `cacheDir` and `codeCacheDir` and loading a fresh URL instead of repeatedly replaying stale bytecode.
  - Added clean cache reload to Settings menu Reload button.

---

## [v1.3.7] - 2026-10-08

### Fixed
- **Post-Update Frozen Mainpage & Skeleton Shimmer Stalls**:
  - Automatically detected application version upgrade using persistent version tracking (`SettingsDataStore` and instant app preferences).
  - Emulated Android OS "Clear cache" on version upgrade by programmatically purging `context.cacheDir` (clears stale HTTP disk cache and precompiled V8 bytecodes).
  - Preserved `CookieManager` and persistent storage databases completely, ensuring users never get logged out.
  - Invalidated stale `savedInstanceState` upon package updates: bypassed deserialization of dead Chromium process bundles in `MainActivity.onCreate` and `rememberSaveableWebViewState`, guaranteeing fresh, clean navigation to the feed or target URL.
  - Added eviction of ServiceWorker `CacheStorage` in `onCreated` upon update to remove outdated offline application shells.
  - Wrapped all raw user scripts in `fetchScripts.kt` inside isolated try-catch IIFE blocks, preventing syntax or runtime errors in individual scripts from breaking the execution bundle.
  - Hardened `hide_stories.js` against unhandled `ReferenceError` when desktop mode detection is evaluated.
  - Implemented an adaptive feed watchdog in `scripts.js` with a 12-second threshold and strict single-shot session circuit-breaker (`sessionStorage`), preventing infinite reload death loops while recovering stuck skeleton views.
  - Enhanced Settings reload action to clear cache and reload cleanly on manual trigger.

---

## [v1.3.6] - 2026-10-08

### Fixed
- **Reels & Video Playback Responsiveness**:
  - Restored click-to-play and toggle playback on Facebook Reels and video posts.
  - Implemented dedicated `isMediaElement` detector recognizing `<video>`, `<audio>`, Facebook video sigils (`data-sigil*="video"`, `data-sigil*="play"`), `data-mcomponent="VideoArea"`, and media ARIA labels.
  - Added immediate media bypass in capture-phase click handler: clicks on video elements and overlays are never suppressed by text selection guards.
  - Enforced `user-select: none !important; touch-action: manipulation !important` on video elements and playback overlays, preventing Blink from prioritizing text selection gestures over video taps.
  - Cleared lingering text selections automatically when tapping video surfaces.

---

## [v1.3.5] - 2026-10-08

### Fixed
- **Post Options (...) Button Responsiveness**:
  - Restored the three-dots options button (`aria-haspopup="menu"`, `aria-label*="opcj"`, `data-sigil*="popover"`) used for saving posts, hiding content, and managing posts.
  - Removed `[data-ft]` from container exclusions in `scripts.js`: Facebook mobile attaches tracking attribute `data-ft` to leaf buttons as well as cards, which previously caused the options button to be misclassified as a card container.
- **Native Android ActionMode Text Selection Activation**:
  - Extended CSS text selection rules to cover Facebook mobile post body containers (`.story_body_container`, `div._5rgt`, `span._5rgu`), overcoming inherited `user-select: none`.
  - Added synthetic word selection on long-press (`caretRangeFromPoint`), notifying Android WebView's `SelectionPopupController` to display the native floating action bar (Kopiuj / Udostępnij / Zaznacz wszystko).

---

## [v1.3.4] - 2026-10-08

### Fixed
- **Native Long-Press Text Selection & Android ActionMode**:
  - Neutralized Facebook's global `contextmenu` cancellation on post text and comments. In Android WebView, Chromium cancels `GestureLongPress` and suppresses the native `ActionMode` (Copy / Share / Select all) when a script calls `event.preventDefault()`. By intercepting `contextmenu` in the capture phase on text elements and halting propagation, Facebook is prevented from aborting native text selection.
  - Enabled `isLongClickable = true` and `isHapticFeedbackEnabled = true` on the native WebView instance in `MaterialbookWV.kt`.
- **"See more" ("Zobacz więcej") Semantic Matcher**:
  - Replaced rigid tag-based role checks with structural and multilingual pattern recognition (`see more`, `zobacz więcej`, `pokaż więcej`, `data-sigil*="more"`, `data-action-id`).
  - Addressed Facebook's DOM reality where "See more" is rendered as an unadorned inline `<span>` rather than an explicit `button` or `[role="button"]`.
  - Guaranteed immediate post expansion upon tap, clearing lingering text selections without navigating away.

---

## [v1.3.3] - 2026-10-08

### Fixed
- **"See more" ("Zobacz więcej") & Interactive Buttons Responsiveness**:
  - Restored clickability and immediate expansion of truncated posts, comments, reactions, and reply toggles.
  - Eliminated Blink touch-selection hijacking on buttons by applying `touch-action: manipulation !important` and `user-select: none !important` specifically to interactive controls nested within text (`[dir="auto"] [role="button"]`, `button`).
  - Allowed post text (`[dir="auto"]`) and embedded hyperlinks (`a`) to remain fully selectable for copying.
  - Replaced indiscriminate capture-phase click interception with a leaf interactive resolver (`getLeafInteractive`), ensuring buttons execute immediately even if a text selection exists.

---

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
