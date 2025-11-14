# Optimization Setup

## Quick Optimization

Before building for release:

```bash
npm run clean
```

## Build Release APK

```bash
cd android
./gradlew assembleRelease
```

## Memory Management

- Caching: 10-minute in-memory cache
- Request cancellation: Automatic cleanup
- Build cleanup: Use `npm run clean` before release
