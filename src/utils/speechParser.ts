export interface ParsedTimeEntry {
  duration: number;
  task: string;
  project: string;
  client: string;
}

export function parseTimeEntryFromSpeech(transcript: string): Partial<ParsedTimeEntry> {
  const text = transcript.toLowerCase().trim();
  const result: Partial<ParsedTimeEntry> = {};

  // Extract duration - prioritize the specific format "[number] hours"
  const hourPatterns = [
    /(\d+(?:\.\d+)?)\s*hours?/i,
    /(\d+(?:\.\d+)?)\s*hrs?/i,
    /(\d+(?:\.\d+)?)\s*h\b/i,
    /(\d+(?:\.\d+)?)\s*(?:and\s*a\s*half|½)\s*(?:hours?|hrs?|h)/i,
  ];
  
  const minutePatterns = [
    /(\d+)\s*(?:minutes?|mins?|m)\b/i,
  ];

  // Look for hour patterns first
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

  // If no hours found, look for minutes
  if (!result.duration) {
    for (const pattern of minutePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.duration = parseFloat(match[1]) / 60; // Convert minutes to hours
        break;
      }
    }
  }

  // Extract task - improved patterns for "doing [task]" format
  const taskPatterns = [
    // Primary pattern for "doing [task]"
    /doing\s+([^.]+?)(?:\s+on\s+|$)/i,
    // Alternative patterns
    /(?:working on|spent time on|time on)\s+([^.]+?)(?:\s+(?:on|for)\s+|$)/i,
    /(?:task|activity):\s*([^.]+?)(?:\s+(?:on|for)\s+|$)/i,
  ];

  for (const pattern of taskPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.task = match[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }

  // Extract project - improved patterns for "on [project name]" format
  const projectPatterns = [
    // Primary pattern for "on [project name]"
    /\bon\s+([^.]+?)(?:\s+for\s+|$)/i,
    // Alternative patterns
    /(?:for|on)\s+(?:project|the)\s+([^.]+?)(?:\s+for\s+|$)/i,
    /project:\s*([^.]+?)(?:\s+for\s+|$)/i,
  ];

  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.project = match[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }

  // Extract client - patterns for "for [client name]" format
  const clientPatterns = [
    // Primary pattern for "for [client name]"
    /\bfor\s+([^.]+?)(?:\s*$)/i,
    // Alternative patterns
    /(?:client|customer):\s*([^.]+?)(?:\s*$)/i,
    /(?:working for|time for)\s+([^.]+?)(?:\s*$)/i,
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.client = match[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }

  return result;
}