# Apple Watch App Setup Instructions

## Prerequisites
- Mac with Xcode 14.0 or later
- Apple Developer Account
- Apple Watch paired with iPhone

## Setup Steps

### 1. Add Watch Target to iOS Project

1. Open your iOS project in Xcode
2. Go to **File → New → Target**
3. Select **watchOS** → **Watch App for iOS App**
4. Configure the target:
   - Product Name: `TimeInWatch`
   - Bundle Identifier: `app.lovable.90417b0646904e77b9f5e0a1c7808d94.watchkitapp`
   - Language: Swift
   - Interface: SwiftUI
   - Include Complication: Yes

### 2. Copy Watch App Files

Copy all the Swift files from the `ios/TimeInWatch/` directory to your new Watch target in Xcode:

- `TimeInWatchApp.swift`
- `ContentView.swift`
- `TimerManager.swift`
- `RecentEntriesView.swift`
- `ComplicationController.swift`

### 3. Update Info.plist

Replace the Watch target's Info.plist with the provided `Info.plist` file to enable:
- Microphone access for voice recordings
- Background processing for timers
- Proper companion app linking

### 4. Configure App Groups (Optional)

For data sharing between iPhone and Watch:

1. In Xcode, select your main iOS target
2. Go to **Signing & Capabilities**
3. Add **App Groups** capability
4. Create a new app group: `group.app.lovable.timein`
5. Repeat for the Watch target

### 5. Update Capacitor Integration

Add the following to your main app's widget sync utility to support Watch data:

```typescript
// In src/utils/widgetSync.ts
export const syncWatchData = async (timerData: { 
  isRunning: boolean; 
  elapsedTime: number; 
  accentColor: string 
}) => {
  try {
    await Preferences.set({
      key: 'watch_timer_running',
      value: timerData.isRunning.toString()
    });
    
    await Preferences.set({
      key: 'watch_elapsed_time',
      value: timerData.elapsedTime.toString()
    });
    
    await Preferences.set({
      key: 'watch_accent_color',
      value: timerData.accentColor
    });
  } catch (error) {
    console.error('Failed to sync watch data:', error);
  }
};
```

## Watch App Features

### Core Functionality
- **Quick Timer**: Start/stop timer with large, accessible button
- **Voice Recording**: Tap to record voice time entries
- **Recent Entries**: View last 10 time entries
- **Haptic Feedback**: Tactile feedback for all interactions
- **Complications**: Show timer status on watch face

### User Interface
- **Dark/Light Mode**: Automatically adapts to system settings
- **Accent Color Sync**: Uses the same accent color as main app
- **Large Touch Targets**: Optimized for small screen interaction
- **Minimal Design**: Clean, distraction-free interface

### Data Sync
- **Automatic Sync**: Timer data syncs with main iPhone app
- **Offline Storage**: Works without iPhone connection
- **Background Updates**: Timer continues running in background

## Development Notes

### Testing
1. Build and run on Watch Simulator
2. Test on physical Apple Watch for haptic feedback
3. Verify data sync between iPhone and Watch

### Deployment
1. Archive the iOS app with Watch extension
2. Upload to App Store Connect
3. Both iPhone and Watch apps will be distributed together

### Customization
- Modify accent colors in `ContentView.swift`
- Add new complication templates in `ComplicationController.swift`
- Extend voice recording functionality as needed

## Troubleshooting

### Common Issues
1. **Build Errors**: Ensure Watch target deployment version matches Watch OS version
2. **Data Sync**: Verify App Groups are configured correctly
3. **Permissions**: Check microphone permission in Watch settings

### Performance Tips
- Keep UI updates on main thread
- Minimize background processing
- Use efficient data storage methods

The Watch app provides a streamlined time tracking experience perfect for quick logging on the go!