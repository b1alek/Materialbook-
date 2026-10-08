# Android Studio Emulator, Local Push & Visual Testing Setup Guide

This guide describes how to run an Android Emulator, build and push local versions of **Materialbook**, and perform automated UI/visual verification.

---

## Architecture Overview

```
+--------------------------------------------------------------+
| Host OS (Windows 11) or WSL2 Linux Environment               |
|                                                              |
|  +---------------------+        +-------------------------+  |
|  | Android Studio /    |  adb   | Android Virtual Device  |  |
|  | cmdline-tools SDK   |<------>| (AVD / Emulator)        |  |
|  +----------+----------+        +------------+------------+  |
|             ^                                ^               |
|             | ./gradlew installDebug         | screencap     |
|             v                                v               |
|  +----------+----------+        +------------+------------+  |
|  | Materialbook Source |        | UI Verification Script  |  |
|  | (/root/fb/...)      |        | (uiautomator / diff)    |  |
|  +---------------------+        +-------------------------+  |
+--------------------------------------------------------------+
```

---

## 1. Prerequisites Installation

You can run the emulator natively on **Windows** (simplest with GUI GPU acceleration) or inside **WSL2** (using KVM `/dev/kvm` and WSLg).

### Option A: Windows Native (Recommended)
1. Download and install **[Android Studio](https://developer.android.com/studio)**.
2. In Android Studio, open **Tools > SDK Manager**:
   - SDK Platforms: Check **Android 14 (API 34)** or **Android 15 (API 35)**.
   - SDK Tools: Check **Android SDK Build-Tools**, **Android SDK Command-line Tools**, **Android Emulator**, **Android SDK Platform-Tools** (`adb`).
3. Add the following to your Windows PATH:
   - `%LOCALAPPDATA%\Android\Sdk\platform-tools` (for `adb`)
   - `%LOCALAPPDATA%\Android\Sdk\emulator` (for `emulator`)

### Option B: Linux / WSL2 Headless / GUI
Inside this environment (`/dev/kvm` is active):
```bash
# 1. Install Java 17
dnf install -y java-17-openjdk-devel wget unzip

# 2. Setup Android Commandline Tools
mkdir -p /root/android-sdk/cmdline-tools
cd /root/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*_latest.zip
mv cmdline-tools latest

# 3. Export environment variables
export ANDROID_HOME=/root/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# 4. Accept licenses and install platform & system image
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "emulator" "system-images;android-34;google_apis;x86_64"
```

---

## 2. Creating and Starting the Emulator (AVD)

### Create an AVD via Command Line
```bash
avdmanager create avd \
  --name "Materialbook_Test_Device" \
  --package "system-images;android-34;google_apis;x86_64" \
  --device "pixel_7"
```

### Start the Emulator
```bash
# With GUI display (WSLg or Native Windows):
emulator -avd Materialbook_Test_Device -gpu host -no-snapshot-load

# Headless / CI mode (no window):
emulator -avd Materialbook_Test_Device -no-window -no-audio -gpu swiftshader_indirect
```

Verify the device is connected:
```bash
adb devices
# Output should show:
# List of devices attached
# emulator-5554   device
```

---

## 3. Building and Pushing Local Version

From the Materialbook root repository (`/root/fb/Materialbook`):

```bash
# 1. Ensure local.properties points to your SDK (if building locally)
echo "sdk.dir=/root/android-sdk" > local.properties

# 2. Build Debug APK
./gradlew assembleDebug

# 3. Push and install to the running emulator
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 4. Launch Materialbook on the emulator
adb shell am start -n com.b1alek.materialbook.test/com.eepiemi.materialbook.MainActivity
```

---

## 4. UI & Visual Testing Automation Workflow

We integrate the `android_ui_verification` methodology to test layouts, "See more" expansion, and orientation changes.

### Step 1: Device Calibration
```bash
adb shell wm size
# Example: Physical size: 1080x2400
```

### Step 2: Test Landscape Orientation Adaptation
```bash
# Rotate device to Landscape (orientation 1)
adb shell settings put system user_rotation 1
adb shell settings put system accelerometer_rotation 0

# Wait for layout stabilization
sleep 2

# Take screenshot
adb shell screencap -p /sdcard/landscape_test.png
adb pull /sdcard/landscape_test.png ./artifacts/landscape_test.png
```

### Step 3: Inspect DOM & UI Nodes
```bash
# Dump accessibility and UI bounds
adb shell uiautomator dump /sdcard/view.xml
adb pull /sdcard/view.xml ./artifacts/view.xml

# Inspect bounds for "See more" or post cards:
grep -i "Zobacz więcej" ./artifacts/view.xml || grep -i "See more" ./artifacts/view.xml
```

### Step 4: Simulate Tap on "See more" & Verify Post Expansion
```bash
# Tap coordinates [x, y] extracted from view.xml bounds
adb shell input tap 540 850

# Wait 1s and take screenshot to verify post expanded
sleep 1
adb shell screencap -p /sdcard/after_tap.png
adb pull /sdcard/after_tap.png ./artifacts/after_tap.png
```

### Step 5: Test Text Selection & Copy Menu
```bash
# Long-press on post body (swipe with 0 distance, 1500ms duration)
adb shell input swipe 450 600 450 600 1500

# Verify context menu appears (Copy / Share / Select all)
adb shell uiautomator dump /sdcard/menu_view.xml
adb pull /sdcard/menu_view.xml ./artifacts/menu_view.xml
grep -i "Copy" ./artifacts/menu_view.xml || grep -i "Kopiuj" ./artifacts/menu_view.xml
```

---

## 5. Summary Verification Checklist

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Emulator Boot** | `adb wait-for-device` | Status `device` ready |
| **2. Local Push** | `adb install -r ...app-debug.apk` | `Success` response |
| **3. Landscape Check** | Rotate to landscape + screenshot | Feed centered at 560px, no right clipping |
| **4. "See more" Check**| Tap "See more" / "Zobacz więcej" | Post body expands immediately |
| **5. Copy Menu Check** | Long-press post text | Selection handles & native Copy action bar appear |
