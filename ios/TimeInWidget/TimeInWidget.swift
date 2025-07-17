import SwiftUI
import WidgetKit

struct TimeInWidgetEntryView: View {
    var entry: Provider.Entry
    
    var body: some View {
        ZStack {
            // Background color from user settings
            Color(hex: entry.accentColor)
                .ignoresSafeArea()
            
            // Speech bubble design
            VStack(spacing: 16) {
                // Speech bubble outline
                ZStack {
                    // Outer circle (speech bubble)
                    Circle()
                        .stroke(Color.white, lineWidth: 8)
                        .frame(width: 120, height: 120)
                    
                    // Inner circle with mic icon
                    Circle()
                        .fill(Color(hex: entry.accentColor))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Image(systemName: "mic.fill")
                                .foregroundColor(.white)
                                .font(.system(size: 24, weight: .medium))
                        )
                }
                
                // "Hold to Record" text
                Text("Hold to\nRecord")
                    .foregroundColor(.white)
                    .font(.system(size: 16, weight: .semibold))
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            
            // Bottom status text
            VStack {
                Spacer()
                HStack {
                    Text("\"⏱️ hours in...doing ⏱️...on ⏱️\"")
                        .foregroundColor(.white.opacity(0.8))
                        .font(.system(size: 12, weight: .regular))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .padding(.bottom, 12)
            }
        }
        .containerBackground(for: .widget) {
            Color(hex: entry.accentColor)
        }
    }
}

struct TimeInWidget: Widget {
    let kind: String = "TimeInWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TimeInWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Time In")
        .description("Quick access to time tracking")
        .supportedFamilies([.systemSmall])
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), accentColor: "#09121F")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), accentColor: "#09121F")
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Get accent color from shared preferences
        let accentColor = UserDefaults.standard.string(forKey: "widget_accent_color") ?? "#09121F"
        
        let entries: [SimpleEntry] = [
            SimpleEntry(date: Date(), accentColor: accentColor)
        ]
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let accentColor: String
}

// Color extension to handle hex colors
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

@main
struct TimeInWidgetBundle: WidgetBundle {
    var body: some Widget {
        TimeInWidget()
    }
}