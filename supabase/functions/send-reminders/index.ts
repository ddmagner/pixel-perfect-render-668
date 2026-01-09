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

    // Fetch all users with notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('user_id, notifications_enabled, reminder_frequency, reminder_time, weekend_reminders');

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

    // ========================================
    // 1. MORNING QUOTE AT 9 AM (local time approximation)
    // ========================================
    // We check if user's reminder_time suggests they're in a timezone where it's ~9 AM
    // For device-based approach, we'll send quotes at 9 AM UTC to all users with notifications enabled
    const usersForMorningQuote: string[] = [];
    
    if (currentHour === 9) {
      for (const setting of settings || []) {
        if (!setting.notifications_enabled) continue;
        if (isWeekend && !setting.weekend_reminders) continue;
        usersForMorningQuote.push(setting.user_id);
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
          console.log(`Sent morning quote to ${usersForMorningQuote.length} users`);
        }
      }
    }

    // ========================================
    // 2. 48-HOUR INACTIVITY REMINDER AT 1 PM
    // ========================================
    const usersForInactivityReminder: string[] = [];

    if (currentHour === 13) {
      // Get all users who have notifications enabled
      const activeUserIds = (settings || [])
        .filter(s => s.notifications_enabled)
        .filter(s => !isWeekend || s.weekend_reminders)
        .map(s => s.user_id);

      if (activeUserIds.length > 0) {
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
          for (const userId of activeUserIds) {
            if (!usersWithRecentEntries.has(userId)) {
              usersForInactivityReminder.push(userId);
            }
          }

          if (usersForInactivityReminder.length > 0) {
            const message = getInactivityMessage(dayOfWeek);
            const inactivityResult = await sendNotification(
              ONESIGNAL_APP_ID,
              ONESIGNAL_REST_API_KEY,
              usersForInactivityReminder,
              message.title,
              message.body,
              { action: 'inactivity_reminder' }
            );

            if (inactivityResult.success) {
              results.inactivityReminder.sent = usersForInactivityReminder.length;
              results.inactivityReminder.users = usersForInactivityReminder;
              console.log(`Sent inactivity reminders to ${usersForInactivityReminder.length} users (${message.title})`);
              console.log(`Day of week: ${dayOfWeek}, Message: ${message.title} - ${message.body}`);
            }
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
