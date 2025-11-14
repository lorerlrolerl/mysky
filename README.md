# MySky Weather App

A privacy-first weather application for Android built with React Native and TypeScript.

## Setup

### Prerequisites

- Node.js >= 18
- Java JDK 17
- Android Studio with Android SDK
- Android emulator or physical device

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mysky
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration if needed
   ```

4. Start Metro bundler:
   ```bash
   npm start
   ```

5. Run on Android:
   ```bash
   npm run android
   ```

## Building for Release

1. Clean build artifacts:
   ```bash
   npm run clean
   ```

2. Build release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android device/emulator
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts
- `npm run clean:all` - Full cleanup including node_modules
