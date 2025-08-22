import SwiftUI
import Foundation

class TimerManager: ObservableObject {
    @Published var isRunning = false
    @Published var elapsedTime: TimeInterval = 0
    
    private var timer: Timer?
    private var startTime: Date?
    
    var formattedTime: String {
        let hours = Int(elapsedTime) / 3600
        let minutes = Int(elapsedTime) % 3600 / 60
        let seconds = Int(elapsedTime) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }
    
    func start() {
        guard !isRunning else { return }
        
        startTime = Date()
        isRunning = true
        
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.updateElapsedTime()
        }
    }
    
    func stop() -> TimeInterval {
        guard isRunning else { return 0 }
        
        timer?.invalidate()
        timer = nil
        isRunning = false
        
        let finalDuration = elapsedTime
        elapsedTime = 0
        
        return finalDuration
    }
    
    func pause() {
        guard isRunning else { return }
        
        timer?.invalidate()
        timer = nil
        isRunning = false
    }
    
    func resume() {
        guard !isRunning else { return }
        
        startTime = Date().addingTimeInterval(-elapsedTime)
        isRunning = true
        
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.updateElapsedTime()
        }
    }
    
    private func updateElapsedTime() {
        guard let startTime = startTime else { return }
        elapsedTime = Date().timeIntervalSince(startTime)
    }
    
    deinit {
        timer?.invalidate()
    }
}