import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var timerManager = TimerManager()
    @State private var isRecording = false
    @State private var accentColor = Color(hex: "#09121F")
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                // Timer Display
                VStack(spacing: 4) {
                    Text(timerManager.formattedTime)
                        .font(.system(size: 24, weight: .bold, design: .monospaced))
                        .foregroundColor(.primary)
                    
                    Text(timerManager.isRunning ? "Recording..." : "Ready")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Main Action Button
                Button(action: {
                    if timerManager.isRunning {
                        stopTimer()
                    } else {
                        startTimer()
                    }
                }) {
                    ZStack {
                        Circle()
                            .fill(timerManager.isRunning ? Color.red : accentColor)
                            .frame(width: 60, height: 60)
                        
                        Image(systemName: timerManager.isRunning ? "stop.fill" : "play.fill")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                .buttonStyle(PlainButtonStyle())
                .scaleEffect(timerManager.isRunning ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 0.1), value: timerManager.isRunning)
                
                // Quick Actions
                HStack(spacing: 16) {
                    NavigationLink(destination: RecentEntriesView()) {
                        VStack(spacing: 2) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 16))
                            Text("Recent")
                                .font(.caption2)
                        }
                        .foregroundColor(.secondary)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    Button(action: {
                        // Voice recording functionality
                        toggleVoiceRecording()
                    }) {
                        VStack(spacing: 2) {
                            Image(systemName: isRecording ? "mic.fill" : "mic")
                                .font(.system(size: 16))
                                .foregroundColor(isRecording ? .red : .secondary)
                            Text("Voice")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .padding(.top, 8)
            }
            .padding()
        }
        .onAppear {
            loadAccentColor()
        }
    }
    
    private func startTimer() {
        timerManager.start()
        WKInterfaceDevice.current().play(.start)
        
        // Sync with main app
        syncWithMainApp(action: "start")
    }
    
    private func stopTimer() {
        let duration = timerManager.stop()
        WKInterfaceDevice.current().play(.stop)
        
        // Show save options
        presentSaveOptions(duration: duration)
        
        // Sync with main app
        syncWithMainApp(action: "stop", duration: duration)
    }
    
    private func toggleVoiceRecording() {
        isRecording.toggle()
        
        if isRecording {
            WKInterfaceDevice.current().play(.start)
            // Start voice recording
            startVoiceRecording()
        } else {
            WKInterfaceDevice.current().play(.stop)
            // Stop voice recording and process
            stopVoiceRecording()
        }
    }
    
    private func presentSaveOptions(duration: TimeInterval) {
        // Present action sheet with quick save options
        let alert = WKAlertAction(title: "Quick Save", style: .default) {
            // Save with default values
            saveTimeEntry(duration: duration, task: "General Work", project: "Default", client: "Default")
        }
        
        let detailedAlert = WKAlertAction(title: "Add Details", style: .default) {
            // Navigate to detailed entry view
        }
        
        let cancelAlert = WKAlertAction(title: "Cancel", style: .cancel) {}
        
        WKInterfaceController().presentAlert(
            withTitle: "Save Time Entry",
            message: "Duration: \(formatDuration(duration))",
            preferredStyle: .actionSheet,
            actions: [alert, detailedAlert, cancelAlert]
        )
    }
    
    private func loadAccentColor() {
        // Load accent color from shared preferences
        if let colorHex = UserDefaults.standard.string(forKey: "widget_accent_color") {
            accentColor = Color(hex: colorHex)
        }
    }
    
    private func syncWithMainApp(action: String, duration: TimeInterval = 0) {
        // Sync data with main app through shared preferences or WatchConnectivity
        let syncData: [String: Any] = [
            "action": action,
            "duration": duration,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        UserDefaults.standard.set(syncData, forKey: "watch_sync_data")
    }
    
    private func startVoiceRecording() {
        // Implement voice recording functionality
        // This would use WatchKit's voice recording capabilities
    }
    
    private func stopVoiceRecording() {
        // Process voice recording and extract time entry data
    }
    
    private func saveTimeEntry(duration: TimeInterval, task: String, project: String, client: String) {
        let entry: [String: Any] = [
            "id": UUID().uuidString,
            "duration": duration,
            "task": task,
            "project": project,
            "client": client,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        // Save to local storage and sync with main app
        var entries = UserDefaults.standard.array(forKey: "time_entries") as? [[String: Any]] ?? []
        entries.append(entry)
        UserDefaults.standard.set(entries, forKey: "time_entries")
        
        // Haptic feedback
        WKInterfaceDevice.current().play(.success)
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        return String(format: "%dh %02dm", hours, minutes)
    }
}

// Color extension for hex support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}