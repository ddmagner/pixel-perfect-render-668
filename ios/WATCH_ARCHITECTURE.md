# Apple Watch Integration Architecture

## Overview
This document outlines the complete architecture for integrating Time In with Apple Watch, including data synchronization, UI components, and system integrations.

---

## 1. Data Synchronization Strategy

### 1.1 Sync Mechanisms

**Primary: WatchConnectivity Framework**
- Real-time bidirectional messaging for active sessions
- Background transfers for large data sets
- Automatic queue management when devices are out of range

**Secondary: App Groups (Shared Container)**
- Immediate fallback for when Watch Connectivity unavailable
- UserDefaults suite for lightweight state sharing
- FileManager shared container for larger data structures

**Tertiary: Supabase Cloud Sync**
- Ultimate source of truth
- Syncs entries created offline on either device
- Resolves conflicts using `submitted_at` timestamp

### 1.2 Data Flow Patterns

```
┌─────────────┐     WatchConnectivity    ┌──────────────┐
│             │ ───────────────────────> │              │
│   iPhone    │                          │  Apple Watch │
│     App     │ <─────────────────────── │     App      │
│             │     App Groups           │              │
└──────┬──────┘                          └──────┬───────┘
       │                                        │
       │        Supabase Database              │
       └────────────┬──────────────────────────┘
                    │
              ┌─────▼─────┐
              │  Cloud    │
              │  Storage  │
              └───────────┘
```

### 1.3 Sync Events

| Event | Direction | Method | Priority |
|-------|-----------|--------|----------|
| Timer Start | Watch → iPhone | WC Message | High |
| Timer Stop | Watch → iPhone | WC Message + Context | High |
| Entry Created | Both → Cloud | Background Transfer | Medium |
| Settings Changed | iPhone → Watch | WC Context Update | Medium |
| Recent Entries Request | Watch → iPhone | WC Message | Low |

---

## 2. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal: Basic timer functionality on Watch**

- [ ] Configure App Groups in Xcode (iPhone + Watch targets)
- [ ] Implement `WatchConnectivityManager.swift` wrapper
- [ ] Create shared data models in `Shared/` folder
- [ ] Build basic Watch UI with timer display
- [ ] Implement start/stop sync between devices

**Deliverables:**
- Users can start/stop timer on Watch
- Timer state syncs to iPhone in real-time
- Basic haptic feedback on interactions

### Phase 2: Voice & Quick Entry (Week 2)
**Goal: Enable voice logging and quick task selection**

- [ ] Add microphone permissions to Watch Info.plist
- [ ] Implement audio recording on Watch
- [ ] Send audio buffer to iPhone for Whisper transcription
- [ ] Parse voice entries using existing `speechParser.ts`
- [ ] Create quick task picker using Digital Crown

**Deliverables:**
- Voice recording works on Watch
- Transcribed entries appear in iPhone app
- Quick task templates accessible via Crown scroll

### Phase 3: Complications & Background (Week 3)
**Goal: Persistent presence on watch face**

- [ ] Implement `ComplicationController.swift` updates
- [ ] Create complications for all watch face families
- [ ] Display active timer duration on complications
- [ ] Show today's total time on modular faces
- [ ] Background app refresh for timer persistence

**Deliverables:**
- Active timer shows on watch face
- Tapping complication opens app
- Timer continues running when app backgrounded

### Phase 4: Polish & Optimization (Week 4)
**Goal: Production-ready experience**

- [ ] Implement offline queue for entries
- [ ] Add sync conflict resolution
- [ ] Optimize battery usage (reduce polling)
- [ ] Add Watch-specific settings screen
- [ ] Comprehensive error handling & logging

**Deliverables:**
- Offline mode works seamlessly
- Battery usage <5% per hour of active tracking
- Settings configurable from Watch

---

## 3. Technical Specifications

### 3.1 Project Structure

```
ios/
├── Shared/
│   ├── Models/
│   │   ├── TimeEntry.swift
│   │   ├── AppSettings.swift
│   │   └── SyncMessage.swift
│   ├── Managers/
│   │   ├── WatchConnectivityManager.swift
│   │   └── SharedStorageManager.swift
│   └── Extensions/
│       └── Date+Formatting.swift
├── TimeInWatch/
│   ├── Views/
│   │   ├── ContentView.swift
│   │   ├── TimerView.swift
│   │   ├── RecentEntriesView.swift
│   │   └── QuickTaskPicker.swift
│   ├── ViewModels/
│   │   └── WatchViewModel.swift
│   ├── Managers/
│   │   ├── TimerManager.swift
│   │   └── AudioRecorder.swift
│   └── ComplicationController.swift
└── App/ (iPhone)
    └── Managers/
        └── WatchSyncManager.swift
```

### 3.2 WatchConnectivity Implementation

**Message Types:**
```swift
enum WatchMessage {
    case timerStart(date: Date)
    case timerStop(duration: TimeInterval, date: Date)
    case entryCreated(TimeEntry)
    case requestSettings
    case requestRecentEntries(limit: Int)
    case syncAudio(Data, metadata: [String: Any])
}
```

**Context Updates (Background):**
```swift
struct WatchContext: Codable {
    let accentColor: String
    let taskTypes: [TaskType]
    let recentProjects: [String]
    let lastSyncDate: Date
}
```

### 3.3 App Groups Configuration

**Group ID:** `group.com.lovable.timeinbeta.shared`

**Shared UserDefaults Keys:**
```swift
enum SharedKey {
    static let accentColor = "shared.accentColor"
    static let activeTimer = "shared.activeTimer"
    static let pendingEntries = "shared.pendingEntries"
    static let lastSyncTimestamp = "shared.lastSync"
}
```

### 3.4 Complication Data Source

**Supported Families:**
- `.graphicCircular` - Active timer ring progress
- `.graphicCorner` - Timer + today's total
- `.modularSmall` - Compact timer display
- `.utilitarianSmall` - Text-only timer

**Update Strategy:**
- Update every 60 seconds when timer active
- Update on timer start/stop events
- Background push from iPhone when entry created

---

## 4. Data Models (Shared)

### 4.1 TimeEntry (Swift)
```swift
struct TimeEntry: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let duration: Double // hours
    let task: String
    let project: String
    let client: String?
    let date: Date
    let submittedAt: Date
    let hourlyRate: Double?
    var synced: Bool = false
}
```

### 4.2 SyncPayload
```swift
struct SyncPayload: Codable {
    let entries: [TimeEntry]
    let settings: AppSettings?
    let timestamp: Date
    let deviceId: String
}
```

---

## 5. System Integrations

### 5.1 HealthKit Integration (Optional)
**Use Case:** Pause timer during detected workouts

```swift
// Request authorization
HKHealthStore().requestAuthorization(toShare: [], read: [.workoutType])

// Observe workout sessions
HKObserverQuery(sampleType: .workoutType) { query, completion, error in
    // Auto-pause timer when workout starts
    TimerManager.shared.pause()
}
```

### 5.2 Handoff Support
**Use Case:** Continue editing entry on iPhone

```swift
// Watch: Create user activity
let activity = NSUserActivity(activityType: "com.lovable.timeinbeta.editEntry")
activity.userInfo = ["entryId": entry.id.uuidString]
activity.becomeCurrent()

// iPhone: Restore from activity
func application(_ application: UIApplication, 
                 continue userActivity: NSUserActivity) {
    guard let entryId = userActivity.userInfo?["entryId"] as? String else { return }
    // Navigate to entry editor
}
```

### 5.3 CloudKit Private Database (Future)
**Use Case:** Sync app state across user's devices

- Store timer state in CloudKit
- Subscribe to changes for multi-device sync
- Resolve conflicts using vector clocks

---

## 6. Performance Optimization

### 6.1 Battery Conservation
- Use `WCSession` background transfers for non-urgent data
- Batch entry syncs (max 1/minute)
- Reduce complication updates when timer inactive
- Use Combine publishers to debounce rapid state changes

### 6.2 Memory Management
- Limit recent entries cache to 20 items
- Lazy load project/task lists
- Release audio buffers immediately after send
- Use `@MainActor` for UI updates only

### 6.3 Network Efficiency
- Compress entry payloads using `JSONEncoder` with `.fragmentsAllowed`
- Send delta updates instead of full state
- Use HTTP/2 multiplexing for Supabase requests

---

## 7. Testing Strategy

### 7.1 Unit Tests
- [ ] WatchConnectivityManager message parsing
- [ ] TimerManager duration calculations
- [ ] SyncPayload encoding/decoding
- [ ] Conflict resolution logic

### 7.2 Integration Tests
- [ ] End-to-end timer start → stop → entry creation
- [ ] Offline queue → online sync flow
- [ ] Settings change propagation
- [ ] Audio recording → transcription → parsing

### 7.3 Device Testing Checklist
- [ ] iPhone 12+ (iOS 17+) paired with Watch Series 6+
- [ ] Test with Watch on different WiFi network
- [ ] Test with Watch in Airplane Mode
- [ ] Force-quit apps and verify background sync
- [ ] Battery drain test: 8 hours of active tracking

---

## 8. Security & Privacy

### 8.1 Data Protection
- Enable Data Protection for shared App Group container
- Use Keychain for sensitive tokens (not UserDefaults)
- Encrypt audio buffers in transit (TLS 1.3)

### 8.2 Permissions
- Request microphone access only when needed
- Show permission rationale in Watch UI
- Gracefully degrade if permissions denied

### 8.3 Compliance
- Update Privacy Policy to mention Watch data collection
- Add Watch microphone usage to Info.plist description
- Ensure GDPR compliance for EU users (right to deletion)

---

## 9. Next Steps

1. **Review & Approve** this architecture
2. **Configure App Groups** in Apple Developer Portal
3. **Create Shared folder** with base models
4. **Implement WatchConnectivityManager** wrapper class
5. **Start Phase 1** of roadmap

---

## Appendix A: File Checklist

**Files to Create:**
- [ ] `ios/Shared/Models/TimeEntry.swift`
- [ ] `ios/Shared/Models/AppSettings.swift`
- [ ] `ios/Shared/Managers/WatchConnectivityManager.swift`
- [ ] `ios/Shared/Managers/SharedStorageManager.swift`
- [ ] `ios/TimeInWatch/ViewModels/WatchViewModel.swift`
- [ ] `ios/TimeInWatch/Views/QuickTaskPicker.swift`
- [ ] `ios/App/Managers/WatchSyncManager.swift`

**Files to Update:**
- [ ] `ios/TimeInWatch/ContentView.swift` (integrate WatchViewModel)
- [ ] `ios/TimeInWatch/ComplicationController.swift` (add live data)
- [ ] `ios/TimeInWatch/Info.plist` (add App Group ID)
- [ ] `capacitor.config.ts` (ensure native sync hooks)

**Xcode Configuration:**
- [ ] Add App Groups capability to both targets
- [ ] Create `group.com.lovable.timeinbeta.shared` identifier
- [ ] Link WatchConnectivity.framework to both targets
- [ ] Add microphone permission to Watch Info.plist

---

## Appendix B: Resources

- [WatchConnectivity Apple Docs](https://developer.apple.com/documentation/watchconnectivity)
- [Watch App Architecture Guide](https://developer.apple.com/design/human-interface-guidelines/watchos)
- [Complications Programming Guide](https://developer.apple.com/documentation/clockkit)
- [App Groups Setup](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-20  
**Owner:** Time In Development Team
