#!/bin/bash
# Clean Android build artifacts to reduce app size

echo "Cleaning Android build artifacts..."

cd android || exit 1

# Remove build directories
rm -rf app/build
rm -rf build
rm -rf .gradle

# Clean gradle cache (optional, uncomment if needed)
# rm -rf ~/.gradle/caches/

echo "Build artifacts cleaned successfully!"

