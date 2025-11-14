#!/bin/bash

# Build APK script for MySky
# This script creates a release APK and copies it to android/apk/

set -e

echo "🚀 Building MySky APK..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p android/app/src/main/assets
mkdir -p android/app/src/main/res
mkdir -p android/apk

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Bundle JavaScript
echo "📦 Bundling JavaScript..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build debug APK (easier for testing, uses debug keystore)
echo "🔨 Building debug APK..."
cd android
./gradlew assembleDebug
cd ..

# Copy APK to android/apk/ with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APK_NAME="MySky-debug-${TIMESTAMP}.apk"
cp android/app/build/outputs/apk/debug/app-debug.apk "android/apk/${APK_NAME}"

echo "✅ Build complete!"
echo "📱 APK location: android/apk/${APK_NAME}"
echo ""
echo "To install on your device:"
echo "  adb install -r android/apk/${APK_NAME}"

