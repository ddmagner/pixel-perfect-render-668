import ClockKit
import SwiftUI

class ComplicationController: NSObject, CLKComplicationDataSource {
    
    // MARK: - Complication Configuration
    
    func getComplicationDescriptors(handler: @escaping ([CLKComplicationDescriptor]) -> Void) {
        let descriptors = [
            CLKComplicationDescriptor(
                identifier: "timer",
                displayName: "Timer",
                supportedFamilies: [
                    .modularSmall,
                    .circularSmall,
                    .utilitarianSmall,
                    .graphicCorner,
                    .graphicCircular
                ]
            )
        ]
        
        handler(descriptors)
    }
    
    // MARK: - Timeline Configuration
    
    func getTimelineStartDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
        handler(Date())
    }
    
    func getTimelineEndDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
        handler(Date().addingTimeInterval(24 * 60 * 60)) // 24 hours from now
    }
    
    func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
        handler(.showOnLockScreen)
    }
    
    // MARK: - Timeline Population
    
    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        let template = createTemplate(for: complication)
        let entry = CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
        handler(entry)
    }
    
    func getTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Generate future timeline entries if needed
        handler(nil)
    }
    
    // MARK: - Sample Templates
    
    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        let template = createTemplate(for: complication)
        handler(template)
    }
    
    // MARK: - Template Creation
    
    private func createTemplate(for complication: CLKComplication) -> CLKComplicationTemplate {
        switch complication.family {
        case .modularSmall:
            let template = CLKComplicationTemplateModularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: "⏱")
            return template
            
        case .circularSmall:
            let template = CLKComplicationTemplateCircularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: "⏱")
            return template
            
        case .utilitarianSmall:
            let template = CLKComplicationTemplateUtilitarianSmallFlat()
            template.textProvider = CLKSimpleTextProvider(text: "⏱ Time")
            return template
            
        case .graphicCorner:
            let template = CLKComplicationTemplateGraphicCornerTextImage()
            template.textProvider = CLKSimpleTextProvider(text: "Time")
            template.imageProvider = CLKFullColorImageProvider(fullColorImage: UIImage(systemName: "timer") ?? UIImage())
            return template
            
        case .graphicCircular:
            let template = CLKComplicationTemplateGraphicCircularImage()
            template.imageProvider = CLKFullColorImageProvider(fullColorImage: UIImage(systemName: "timer") ?? UIImage())
            return template
            
        default:
            let template = CLKComplicationTemplateModularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: "⏱")
            return template
        }
    }
}