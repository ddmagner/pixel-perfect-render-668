export interface ParsedTimeEntry {
  duration: number;
  task: string;
  project: string;
  client: string;
}

export function parseTimeEntryFromSpeech(transcript: string): Partial<ParsedTimeEntry> {
  const text = transcript.toLowerCase().trim();
  console.log('Parsing speech text:', text);
  const result: Partial<ParsedTimeEntry> = {};

  // Extract duration - prioritize the specific format "[number] hours"
  const hourPatterns = [
    /(\d+(?:\.\d+)?)\s*hours?/i,
    /(\d+(?:\.\d+)?)\s*hrs?/i,
    /(\d+(?:\.\d+)?)\s*h\b/i,
    /(\d+(?:\.\d+)?)\s*(?:and\s*a\s*half|½)\s*(?:hours?|hrs?|h)/i,
    // Add more flexible patterns
    /(\d+(?:\.\d+)?)\s*(?:hour|hr)/i,
    // Handle "one hour", "two hours" etc.
    /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:hours?|hrs?|h\b)/i,
    // Handle decimal formats like "1.5 hours"
    /(\d+)\.(\d+)\s*(?:hours?|hrs?|h\b)/i,
  ];
  
  const minutePatterns = [
    /(\d+)\s*(?:minutes?|mins?|m)\b/i,
    // Handle "thirty minutes", "fifteen minutes" etc.
    /(fifteen|thirty|forty-five|sixty)\s*(?:minutes?|mins?)/i,
  ];

  // Look for hour patterns first
  for (const pattern of hourPatterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Hour pattern matched:', match);
      if (match[1] && !isNaN(parseFloat(match[1]))) {
        result.duration = parseFloat(match[1]);
      } else if (match[1]) {
        // Handle word numbers
        const wordToNumber: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'eleven': 11, 'twelve': 12
        };
        result.duration = wordToNumber[match[1]] || 1;
      }
      
      if (text.includes('half') || text.includes('½')) {
        result.duration = (result.duration || 0) + 0.5;
      }
      console.log('Extracted duration:', result.duration);
      break;
    }
  }

  // If no hours found, look for minutes
  if (!result.duration) {
    for (const pattern of minutePatterns) {
      const match = text.match(pattern);
      if (match) {
        console.log('Minute pattern matched:', match);
        let minutes = parseFloat(match[1]);
        
        // Handle word numbers for minutes
        if (isNaN(minutes)) {
          const wordToNumber: { [key: string]: number } = {
            'fifteen': 15, 'thirty': 30, 'forty-five': 45, 'sixty': 60
          };
          minutes = wordToNumber[match[1]] || 30; // Default to 30 minutes if unknown
        }
        
        result.duration = minutes / 60; // Convert minutes to hours
        console.log('Extracted duration from minutes:', result.duration);
        break;
      }
    }
  }

  // Extract task - improved patterns for "doing [task]" and "of [task]" formats
  const taskPatterns = [
    // Primary pattern for "of [task]"
    /\bof\s+([^.]+?)(?:\s+on\s+|$)/i,
    // Secondary pattern for "doing [task]"
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