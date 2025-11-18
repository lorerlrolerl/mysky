#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

echo "🔨 Building release APKs (per ABI)..."
cd android
./gradlew assembleRelease
cd ..

echo "✅ Release build complete!"
echo "📁 APKs located in android/app/build/outputs/apk/release"
ls -lh android/app/build/outputs/apk/release || true

echo "To install (example for arm64):"
echo "  adb install -r android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"
