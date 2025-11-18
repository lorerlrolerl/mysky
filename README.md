# MySky Weather App

A privacy-first weather application for Android built with React Native and TypeScript.

## Features

- Real-time weather forecasts with hourly and daily predictions
- European Air Quality Index (AQI) monitoring
- Interactive charts for temperature, precipitation, wind, and air quality
- Location-based weather data
- Privacy-focused (no analytics, no tracking)
- Powered by Open-Meteo API

## Setup Guide

### Prerequisites

#### 1. Install Node.js (>= 18)
```bash
# On Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2. Install Java JDK 17
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# Verify installation
java -version
```

#### 3. Install Android Studio

1. Download Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Install Android Studio:
   ```bash
   # Extract and run the installer
   cd ~/Downloads
   unzip android-studio-*.zip
   cd android-studio/bin
   ./studio.sh
   ```
3. During setup, install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
   - SDK Build Tools

#### 4. Configure Android Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

Verify:
```bash
echo $ANDROID_HOME
adb version
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mysky
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Android device/emulator:**

   **Option A: Physical Device**
   - Enable Developer Options on your Android phone
   - Enable USB Debugging
   - Connect via USB
   - Verify connection: `adb devices`

   **Option B: Android Emulator**
   - Open Android Studio
   - Tools → Device Manager → Create Device
   - Choose a device (e.g., Pixel 5)
   - Download and select a system image (API 33+ recommended)
   - Start the emulator

4. **Start Metro bundler:**
   ```bash
   npm start
   ```
   Keep this terminal open.

5. **Run on Android (in a new terminal):**
   ```bash
   npm run android
   ```

## Building APK

### Quick Build (Release)

The default build creates optimized per-ABI release APKs:
```bash
npm run build:apk          # same as npm run build:apk:release
```
This command cleans previous builds and runs `./gradlew assembleRelease`.
Outputs are stored in `android/app/build/outputs/apk/release/` as:
- `app-armeabi-v7a-release.apk`
- `app-arm64-v8a-release.apk`
- `app-x86-release.apk`
- `app-x86_64-release.apk`

Install the APK that matches your device architecture, e.g.:
```bash
adb install -r android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

### Debug Build

Debug builds remain available (with Metro/dev tooling) for testing:
```bash
npm run build:apk:debug
```
Outputs live in `android/app/build/outputs/apk/debug/` as `app-<abi>-debug.apk`.

### Manual Build

1. **Bundle JavaScript and assets (release mode):**
   ```bash
   npx react-native bundle \
     --platform android \
     --dev false \
     --entry-file index.js \
     --bundle-output android/app/src/main/assets/index.android.bundle \
     --assets-dest android/app/src/main/res
   ```

2. **Assemble release APKs:**
   ```bash
   cd android
   ./gradlew assembleRelease
   cd ..
   ```

3. **Install the appropriate APK:**
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
   ```
## Installing APK on Your Phone

### Step 1: Install ADB (Android Debug Bridge)

ADB is a command-line tool that lets you communicate with your Android device.

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

**Verify installation:**
```bash
adb version
```

### Step 2: Enable USB Debugging on Your Phone

1. **Enable Developer Options:**

   The build number location varies by phone brand:

   **Most Android phones (Samsung, Google Pixel, OnePlus, etc.):**
   - Go to **Settings** → **About phone** (or **About device**)
   - Scroll down to find **Build number**
   - Tap **Build number** 7 times
   - You'll see a message like "You are now a developer!"

   **Xiaomi/MIUI phones:**
   - Go to **Settings** → **About phone**
   - Find **MIUI version** (instead of Build number)
   - Tap **MIUI version** 7 times

   **Huawei phones:**
   - Go to **Settings** → **About phone**
   - Find **Build number** and tap it 7 times

   **If you can't find "About phone":**
   - Look for **System** → **About phone**
   - Or **General** → **About phone**
   - Or search in Settings for "build" or "version"

   **Still can't find it?**
   - Try: Settings → System → About phone
   - Or: Settings → Phone info → Software info
   - The build number is usually at the very bottom of the About screen

2. **Enable USB Debugging:**
   - Go back to **Settings**
   - Find **Developer options** (usually under System, Additional settings, or Advanced)
   - Turn on **Developer options** toggle at the top
   - Scroll down and enable **USB debugging**
   - (Optional) Enable **Install via USB** if available

### Step 3: Connect Your Phone

1. **Connect via USB:**
   - Use a USB cable to connect your phone to your computer
   - On your phone, you'll see a notification about USB connection
   - **Important:** Tap the notification and select **"File transfer"** or **"Android Auto"** (NOT "Charging only")
   - This allows your computer to communicate with your phone

2. **Allow USB Debugging:**
   - After selecting file transfer mode, you should see a popup asking "Allow USB debugging?"
   - Check **"Always allow from this computer"**
   - Tap **Allow**

   **If you don't see the USB debugging popup:**
   - Make sure USB debugging is enabled in Developer options
   - Try unplugging and replugging the USB cable
   - Try changing the USB connection mode again

3. **Verify Connection:**
   ```bash
   adb devices
   ```

   You should see something like:
   ```
   List of devices attached
   ABC123XYZ    device
   ```

   If you see "unauthorized", check your phone for the USB debugging permission popup.

   If you see "no devices", make sure you selected "File transfer" mode (not "Charging only")

### Step 4: Install the APK

**Option A: Install from the build output**
```bash
# If you just built the APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B: Install from the apk folder (after using build script)**
```bash
# Find the latest APK
ls -t android/apk/*.apk | head -1

# Install it (replace with actual filename)
adb install -r android/apk/MySky-debug-20241215_143022.apk
```

**Option C: Install by dragging and dropping**
1. Copy the APK file to your phone (via USB file transfer or cloud storage)
2. On your phone, open the file manager
3. Navigate to where you saved the APK
4. Tap the APK file
5. Tap **Install** (you may need to allow "Install from unknown sources" first)

### Troubleshooting

**"adb: command not found"**
- Make sure you installed `android-tools-adb`
- Try: `sudo apt install android-tools-adb`

**"no devices/emulators found"**
- Make sure USB debugging is enabled on your phone
- Try unplugging and replugging the USB cable
- Check if your phone shows the USB debugging authorization popup
- Try: `adb kill-server && adb start-server`

**"device unauthorized"**
- Check your phone for the USB debugging permission popup
- Tap "Allow" and check "Always allow from this computer"

**"INSTALL_FAILED_INSUFFICIENT_STORAGE"**
- Free up space on your phone

**"INSTALL_FAILED_UPDATE_INCOMPATIBLE"**
- Uninstall any existing version of MySky first:
  ```bash
  adb uninstall com.mysky
  ```
  Then try installing again.

**App icon not showing after installation**
- The icons are included in the APK, but your phone might be caching
- Try these steps:
  1. Uninstall the app completely: `adb uninstall com.mysky`
  2. Clear your phone's launcher cache (varies by phone - try restarting)
  3. Rebuild with clean: `npm run clean && npm run build:apk`
  4. Reinstall: `adb install -r android/apk/MySky-debug-*.apk`
  5. If still not showing, regenerate icons:
     ```bash
     # Install a tool to convert SVG to PNG
     sudo apt install librsvg2-bin
     # Regenerate icons
     bash scripts/regenerate-icons.sh
     # Then rebuild
     npm run build:apk
     ```

### Building Release APK

For a release build, you'll need to set up a signing key. See [React Native documentation](https://reactnative.dev/docs/signed-apk-android) for details.

**Note:** When building release APK, you may see warnings like "Unable to strip the following libraries...". This is normal and harmless - the build will still succeed. The APK will work fine, it just might be slightly larger. These warnings can be safely ignored.

## Performance Highlights

- **In-memory caching** keeps weather responses for 10 minutes to reduce API traffic without storing anything on disk.
- **Request cancellation with AbortController** prevents leaks when switching locations or unmounting components.
- **Typed arrays (Float64Array)** store hourly/daily data efficiently and avoid costly conversions.
- **Lightweight SVG charts** render only the active day with horizontal scrolling to keep UI smooth.
- **Build cleanup scripts** (`npm run clean`, `npm run clean:all`) remove artifacts and keep release builds slim.

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run build:apk` - Build APK using automated script
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts
- `npm run clean:all` - Full cleanup including node_modules
