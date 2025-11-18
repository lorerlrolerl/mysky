#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

echo "🔨 Building debug APKs (per ABI)..."
cd android
./gradlew assembleDebug
cd ..

echo "✅ Debug build complete!"
echo "📁 APKs located in android/app/build/outputs/apk/debug"
ls -lh android/app/build/outputs/apk/debug || true

echo "To install (example for arm64):"
echo "  adb install -r android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk"
