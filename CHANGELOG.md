# Changelog

All notable changes to this fork (`b1alek/Materialbook-`) will be documented in this file.

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
