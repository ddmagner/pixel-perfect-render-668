import SwiftUI

struct RecentEntriesView: View {
    @State private var entries: [TimeEntry] = []
    
    var body: some View {
        List {
            if entries.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "clock")
                        .font(.system(size: 24))
                        .foregroundColor(.secondary)
                    
                    Text("No recent entries")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .listRowBackground(Color.clear)
            } else {
                ForEach(entries) { entry in
                    TimeEntryRow(entry: entry)
                }
            }
        }
        .navigationTitle("Recent")
        .onAppear {
            loadEntries()
        }
    }
    
    private func loadEntries() {
        guard let data = UserDefaults.standard.array(forKey: "time_entries") as? [[String: Any]] else {
            return
        }
        
        entries = data.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let duration = dict["duration"] as? TimeInterval,
                  let task = dict["task"] as? String,
                  let project = dict["project"] as? String,
                  let client = dict["client"] as? String,
                  let timestamp = dict["timestamp"] as? TimeInterval else {
                return nil
            }
            
            return TimeEntry(
                id: id,
                duration: duration,
                task: task,
                project: project,
                client: client,
                timestamp: Date(timeIntervalSince1970: timestamp)
            )
        }
        .sorted { $0.timestamp > $1.timestamp }
        .prefix(10)
        .map { $0 }
    }
}

struct TimeEntryRow: View {
    let entry: TimeEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(formatDuration(entry.duration))
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text(formatTime(entry.timestamp))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Text(entry.task)
                .font(.caption)
                .foregroundColor(.primary)
                .lineLimit(1)
            
            HStack {
                Text(entry.project)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Text("•")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Text(entry.client)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        
        if hours > 0 {
            return String(format: "%dh %02dm", hours, minutes)
        } else {
            return String(format: "%dm", minutes)
        }
    }
    
    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct TimeEntry: Identifiable {
    let id: String
    let duration: TimeInterval
    let task: String
    let project: String
    let client: String
    let timestamp: Date
}