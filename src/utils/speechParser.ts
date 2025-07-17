export interface ParsedTimeEntry {
  duration: number;
  task: string;
  project: string;
}

export function parseTimeEntryFromSpeech(transcript: string): Partial<ParsedTimeEntry> {
  const text = transcript.toLowerCase();
  const result: Partial<ParsedTimeEntry> = {};

  // Extract duration - look for patterns like "2 hours", "1.5 hours", "30 minutes"
  const hourPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/i,
    /(\d+(?:\.\d+)?)\s*(?:and\s*a\s*half|½)\s*(?:hours?|hrs?|h)/i,
  ];
  
  const minutePatterns = [
    /(\d+)\s*(?:minutes?|mins?|m)/i,
  ];

  for (const pattern of hourPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.duration = parseFloat(match[1]);
      if (text.includes('half') || text.includes('½')) {
        result.duration += 0.5;
      }
      break;
    }
  }

  if (!result.duration) {
    for (const pattern of minutePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.duration = parseFloat(match[1]) / 60; // Convert minutes to hours
        break;
      }
    }
  }

  // Extract task - look for patterns like "working on", "doing", "spent time"
  const taskPatterns = [
    /(?:working on|doing|spent time|time on|for)\s+([^,]+?)(?:\s+(?:on|for)\s+|$)/i,
    /(?:task|activity):\s*([^,]+?)(?:\s+(?:on|for)\s+|$)/i,
  ];

  for (const pattern of taskPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.task = match[1].trim();
      break;
    }
  }

  // Extract project - look for patterns like "on project", "for project"
  const projectPatterns = [
    /(?:on|for)\s+(?:project|the)\s+([^,]+?)(?:\s|$)/i,
    /project:\s*([^,]+?)(?:\s|$)/i,
  ];

  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.project = match[1].trim();
      break;
    }
  }

  return result;
}