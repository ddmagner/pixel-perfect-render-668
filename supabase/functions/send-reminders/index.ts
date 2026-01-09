import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch a random quote about time from ZenQuotes API
async function fetchTimeQuote(): Promise<{ quote: string; author: string } | null> {
  try {
    // Use ZenQuotes random endpoint
    const response = await fetch('https://zenquotes.io/api/random');
    if (!response.ok) {
      console.error('ZenQuotes API error:', response.status);
      return null;
    }
    const data = await response.json();
    if (data && data[0]) {
      return { quote: data[0].q, author: data[0].a };
    }
    return null;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

// Fallback quotes in case the API fails
const fallbackQuotes = [
  { quote: "Time is the most valuable thing a man can spend.", author: "Theophrastus" },
  { quote: "Lost time is never found again.", author: "Benjamin Franklin" },
  { quote: "The key is not spending time, but investing it.", author: "Stephen Covey" },
  { quote: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly-Curtin" },
  { quote: "Better three hours too soon than a minute too late.", author: "William Shakespeare" },
];

function getRandomFallbackQuote(): { quote: string; author: string } {
  return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
}

// Day-specific inactivity reminder messages (0 = Sunday, 1 = Monday, etc.)
const inactivityMessages: Record<number, { title: string; body: string }> = {
  1: { title: "Time is on your side.", body: "Tap to record it." },
  2: { title: "Get your time in.", body: "Tap to track it." },
  3: { title: "Time getting away?", body: "Tap to capture it." },
  4: { title: "Have time?", body: "Tap to capture minutes." },
  5: { title: "Time flies!", body: "Tap to recap the week." },
};

// Default fallback for weekends (if ever triggered)
const defaultInactivityMessage = { title: "Time is on your side.", body: "Tap to record it." };

function getInactivityMessage(dayOfWeek: number): { title: string; body: string } {
  return inactivityMessages[dayOfWeek] || defaultInactivityMessage;
}

// Send notification via OneSignal
async function sendNotification(
  appId: string,
  apiKey: string,
  userIds: string[],
  heading: string,
  content: string,
  data: Record<string, string>
): Promise<{ success: boolean; result?: any; error?: string }> {
  if (userIds.length === 0) {
    return { success: true, result: { message: 'No users to notify' } };
  }

  const payload = {
    app_id: appId,
    include_external_user_ids: userIds,
    headings: { en: heading },
    contents: { en: content },
    target_channel: 'push',
    data,
  };

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('OneSignal API error:', result);
    return { success: false, error: JSON.stringify(result) };
  }

  return { success: true, result };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('Missing OneSignal configuration');
      return new Response(JSON.stringify({ error: 'OneSignal not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current time info (UTC)
    const now = new Date();
    const currentHour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    
    // Calculate 48 hours ago
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fortyEightHoursAgoDate = fortyEightHoursAgo.toISOString().split('T')[0];

    console.log(`Running reminder check at ${now.toISOString()}`);
    console.log(`Current hour (UTC): ${currentHour}, Day: ${dayOfWeek}, Is weekend: ${isWeekend}`);

    // Fetch all users with notification settings (including timezone)
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('user_id, notifications_enabled, reminder_frequency, reminder_time, weekend_reminders, timezone');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${settings?.length || 0} users with settings`);

    // Track results for each notification type
    const results = {
      morningQuote: { sent: 0, users: [] as string[] },
      inactivityReminder: { sent: 0, users: [] as string[] },
    };

    // Helper: Get local day of week for a user based on their timezone
    function getUserLocalDayOfWeek(timezone: string | null): number {
      try {
        const tz = timezone || 'UTC';
        const formatter = new Intl.DateTimeFormat('en-US', { 
          weekday: 'long', 
          timeZone: tz 
        });
        const dayName = formatter.format(now);
        const dayMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return dayMap[dayName] ?? dayOfWeek;
      } catch {
        return dayOfWeek; // Fallback to UTC day
      }
    }

    // Helper: Check if it's weekend in user's timezone
    function isUserWeekend(timezone: string | null): boolean {
      const localDay = getUserLocalDayOfWeek(timezone);
      return localDay === 0 || localDay === 6;
    }

    // Helper: Get local hour for a user based on their timezone
    function getUserLocalHour(timezone: string | null): number {
      try {
        const tz = timezone || 'UTC';
        const formatter = new Intl.DateTimeFormat('en-US', { 
          hour: 'numeric', 
          hour12: false,
          timeZone: tz 
        });
        return parseInt(formatter.format(now), 10);
      } catch {
        return currentHour; // Fallback to UTC hour
      }
    }

    // ========================================
    // 1. MORNING QUOTE AT 9 AM LOCAL TIME
    // ========================================
    const usersForMorningQuote: string[] = [];
    
    for (const setting of settings || []) {
      if (!setting.notifications_enabled) continue;
      
      const userLocalHour = getUserLocalHour(setting.timezone);
      const userIsWeekend = isUserWeekend(setting.timezone);
      
      // Send at 9 AM local time
      if (userLocalHour === 9) {
        if (userIsWeekend && !setting.weekend_reminders) continue;
        usersForMorningQuote.push(setting.user_id);
      }
    }

    if (usersForMorningQuote.length > 0) {
      // Fetch a quote
      let quoteData = await fetchTimeQuote();
      if (!quoteData) {
        quoteData = getRandomFallbackQuote();
      }

      const quoteResult = await sendNotification(
        ONESIGNAL_APP_ID,
        ONESIGNAL_REST_API_KEY,
        usersForMorningQuote,
        "✨ Morning Inspiration",
        `"${quoteData.quote}" — ${quoteData.author}`,
        { action: 'morning_quote' }
      );

      if (quoteResult.success) {
        results.morningQuote.sent = usersForMorningQuote.length;
        results.morningQuote.users = usersForMorningQuote;
        console.log(`Sent morning quote to ${usersForMorningQuote.length} users at their local 9 AM`);
      }
    }

    // ========================================
    // 2. 48-HOUR INACTIVITY REMINDER AT 1 PM LOCAL TIME
    // ========================================
    // Collect users who should receive inactivity reminders based on their local 1 PM
    const usersForInactivityCheck: Array<{ userId: string; timezone: string | null }> = [];

    for (const setting of settings || []) {
      if (!setting.notifications_enabled) continue;
      
      const userLocalHour = getUserLocalHour(setting.timezone);
      const userIsWeekend = isUserWeekend(setting.timezone);
      
      // Send at 1 PM local time
      if (userLocalHour === 13) {
        if (userIsWeekend && !setting.weekend_reminders) continue;
        usersForInactivityCheck.push({ userId: setting.user_id, timezone: setting.timezone });
      }
    }

    const usersForInactivityReminder: Array<{ userId: string; timezone: string | null }> = [];

    if (usersForInactivityCheck.length > 0) {
      const activeUserIds = usersForInactivityCheck.map(u => u.userId);
      
      // Check who has logged time in the last 48 hours
      const { data: recentEntries, error: recentError } = await supabase
        .from('time_entries')
        .select('user_id')
        .gte('date', fortyEightHoursAgoDate)
        .in('user_id', activeUserIds);

      if (recentError) {
        console.error('Error fetching recent entries:', recentError);
      } else {
        const usersWithRecentEntries = new Set(recentEntries?.map(e => e.user_id) || []);
        
        // Users who haven't logged in 48 hours
        for (const user of usersForInactivityCheck) {
          if (!usersWithRecentEntries.has(user.userId)) {
            usersForInactivityReminder.push(user);
          }
        }

        // Group users by their local day of week to send correct day-specific messages
        const usersByLocalDay: Record<number, string[]> = {};
        for (const user of usersForInactivityReminder) {
          const localDay = getUserLocalDayOfWeek(user.timezone);
          if (!usersByLocalDay[localDay]) {
            usersByLocalDay[localDay] = [];
          }
          usersByLocalDay[localDay].push(user.userId);
        }

        // Send notifications grouped by day
        for (const [dayStr, userIds] of Object.entries(usersByLocalDay)) {
          const localDay = parseInt(dayStr, 10);
          const message = getInactivityMessage(localDay);
          
          const inactivityResult = await sendNotification(
            ONESIGNAL_APP_ID,
            ONESIGNAL_REST_API_KEY,
            userIds,
            message.title,
            message.body,
            { action: 'inactivity_reminder' }
          );

          if (inactivityResult.success) {
            results.inactivityReminder.sent += userIds.length;
            results.inactivityReminder.users.push(...userIds);
            console.log(`Sent inactivity reminders to ${userIds.length} users for local day ${localDay} (${message.title})`);
          }
        }
      }
    }

    // Daily reminder section removed - only morning quotes and inactivity reminders are active

    const totalSent = results.morningQuote.sent + results.inactivityReminder.sent;

    console.log(`Total notifications sent: ${totalSent}`);
    console.log('Results:', JSON.stringify(results, null, 2));

    return new Response(JSON.stringify({ 
      success: true, 
      totalSent,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-reminders:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
