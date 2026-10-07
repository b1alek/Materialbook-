<p align="middle">
    <img src='./fastlane/metadata/android/en-US/images/featureGraphic.png' alt="Materialbook banner" width="100%">
</p>

<h1 align="middle">
    📱 Download 
</h1>

<p align="middle">
    <a href='https://github.com/b1alek/Materialbook-/releases/latest'><img alt='Download' height='40' src='./assets/download.svg'/></a>
</p>

### 📥 Install & Auto-Update with Obtainium

You can automatically receive future updates on Android using [Obtainium](https://github.com/ImranR98/Obtainium):

1. **Install Obtainium** on your Android device (if not already installed).
2. Open Obtainium and tap **Add App** (`+`).
3. Paste the App Source URL:
   ```text
   https://github.com/b1alek/Materialbook-
   ```
4. **Recommended Settings**:
   * **Filter APK by regex**: `Materialbook_.*\.apk$`
   * **Include prereleases**: Disabled (unless testing dev builds)
   * **Version Detection**: Use release tag
5. Tap **Add**. Obtainium will now fetch the latest APK and notify you whenever a new build is published!

> [!NOTE]
> **First-time Install Note**: If you previously had official `v1.0.0` from `eepiemi` installed, you must uninstall it first because the signing key is different. Subsequent updates from this fork will update seamlessly without data loss.

<h2 align="middle">
    ✏️ This fork (`b1alek/Materialbook-`):
</h2>

*  **PR #43 Integrated**: Adds option to show the **Messages section in Desktop mode** while keeping the rest of the interface mobile-optimized.
*  **Automated CI/CD**: Builds and signs latest commits via GitHub Actions into direct release APKs.


*  Implements Material You theming for:
    *  The facebook app itself
    *  The app icon
    *  The settings page
    *  The "No internet" screen
*  Fixes AMOLED Black
*  Makes the splash screen and the "No internet" screen AMOLED Black
*  Changes some minor things for aesthetics purposes

<h2 align="middle">
    ⚙️ Features
</h2>

If enabled, the app:
*  Uses Material You colors instead of Facebook's blues
*  Makes Facebook AMOLED Black
*  Blocks sponsored ads
*  Hides distractions like:
    *  Suggested posts
    *  Reels
    *  Stories
    *  Groups
    *  People you may know
*  Keeps the navigation bar at the top
*  Downloads media or copies it to the clipboard
*  And more!

<h2 align="middle">
    🛠️ Setup
</h2>

1.  **Clone the repository**
    * In Android Studio:
      * File > New > Project from Version Control
      * Paste `https://github.com/eepiemi/Materialbook.git` and clone.
    * Or via terminal: 
    ```
    git clone https://github.com/eepiemi/Materialbook.git
    cd Materialbook
    ``` 
2.  **Open in Android Studio.** (only if cloned via terminal)
    * Select Open an Existing Project and choose the cloned folder.
3.  **Sync the project** to download dependencies.
4.  **Run the app** in a device or emulator.

<h2 align="middle">
    💗 Acknowledgement:
</h2>

*  [@KevinnZou/compose-webview-multiplatform](https://github.com/KevinnZou/compose-webview-multiplatform)  
