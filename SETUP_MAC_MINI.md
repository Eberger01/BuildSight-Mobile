# Building iOS on Mac Mini

This guide explains how to build BuildSight for iOS using your Mac Mini. Local builds are FREE (no Expo cloud charges).

## Prerequisites

1. **Xcode** installed (latest version from App Store)
2. **CocoaPods**: `sudo gem install cocoapods`
3. **Node.js**: v18+ (recommend using nvm)
4. **EAS CLI**: `npm install -g eas-cli`

## Initial Setup (One Time)

1. Clone the repository to your Mac Mini:
   ```bash
   git clone https://github.com/Eberger01/BuildSight-Mobile.git
   cd BuildSight-Mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Login to EAS:
   ```bash
   eas login
   ```

4. Configure EAS (if not already done):
   ```bash
   eas build:configure
   ```

## Build Steps

### For iOS Simulator (Development/Testing)

```bash
# Navigate to project
cd BuildSight-Mobile

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Build for iOS Simulator
eas build --platform ios --profile development --local
```

Wait ~10-15 minutes for the build to complete. The output will be a `.app` file.

### For Physical iOS Device

Requires Apple Developer account ($99/year).

```bash
eas build --platform ios --profile production --local
```

## Testing in Simulator

1. Open iOS Simulator from Xcode:
   - Open Xcode
   - Menu: Xcode → Open Developer Tool → Simulator

2. Install the app:
   - Drag the generated `.app` file onto the simulator window
   - OR use: `xcrun simctl install booted /path/to/BuildSight.app`

3. App installs and launches automatically

## Android Builds

Android builds can be done on Windows/Mac/Linux:

```bash
# Development APK (can install directly on device)
eas build --platform android --profile development --local

# Production AAB (for Play Store)
eas build --platform android --profile production --local
```

## Environment Variables

For local builds, create a `.env` file:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

For EAS cloud builds, set secrets via:
```bash
eas secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value "your_key"
```

## Troubleshooting

### Build fails with CocoaPods error
```bash
cd ios && pod install --repo-update && cd ..
```

### Xcode command line tools not found
```bash
xcode-select --install
```

### Build cache issues
```bash
rm -rf node_modules
rm -rf ios/Pods
npm install
cd ios && pod install && cd ..
```

## Notes

- Local builds are FREE (no Expo cloud charges)
- No Apple Developer account needed for simulator testing
- For App Store distribution: Need Apple Developer Program ($99/year)
- First build takes longer (downloading iOS SDK components)
- Subsequent builds are faster due to caching

## Quick Reference

| Command | Description |
|---------|-------------|
| `eas build --platform ios --local` | Build iOS locally |
| `eas build --platform android --local` | Build Android locally |
| `eas build:configure` | Initialize EAS config |
| `eas login` | Login to Expo account |
| `eas whoami` | Check current login |