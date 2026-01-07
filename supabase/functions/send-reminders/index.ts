import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Use service role to access all user data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current time info
    const now = new Date();
    const currentHour = now.getUTCHours();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

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

    // Filter users who should receive notifications this hour
    const usersToNotify: string[] = [];

    for (const setting of settings || []) {
      // Skip if notifications disabled or frequency is 'never'
      if (!setting.notifications_enabled || setting.reminder_frequency === 'never') {
        continue;
      }

      // Check weekend preference
      if (isWeekend && !setting.weekend_reminders) {
        continue;
      }

      // Check if frequency matches today
      if (setting.reminder_frequency === 'weekdays' && isWeekend) {
        continue;
      }

      if (setting.reminder_frequency === 'weekly' && dayOfWeek !== 5) { // Only Friday
        continue;
      }

      // Check if current hour matches reminder time (format: "HH:00")
      const reminderHour = parseInt(setting.reminder_time?.split(':')[0] || '18', 10);
      if (currentHour !== reminderHour) {
        continue;
      }

      usersToNotify.push(setting.user_id);
    }

    console.log(`${usersToNotify.length} users match notification criteria for this hour`);

    if (usersToNotify.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No users to notify', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check which users have NOT logged time today
    const { data: todayEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('user_id')
      .gte('date', todayStart)
      .lte('date', todayStart)
      .in('user_id', usersToNotify);

    if (entriesError) {
      console.error('Error fetching time entries:', entriesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch time entries' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get unique user IDs who have logged time today
    const usersWithEntries = new Set(todayEntries?.map(e => e.user_id) || []);
    
    // Filter to users who haven't logged time
    const usersNeedingReminder = usersToNotify.filter(userId => !usersWithEntries.has(userId));

    console.log(`${usersNeedingReminder.length} users need reminders (haven't logged time today)`);

    if (usersNeedingReminder.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'All users have logged time', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notifications via OneSignal
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: usersNeedingReminder,
      headings: { en: "Don't forget to log your time!" },
      contents: { en: "You haven't logged any time today. Tap to add your hours." },
      target_channel: 'push',
      data: { action: 'log_time' },
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send notifications', details: result }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully sent reminders to ${usersNeedingReminder.length} users:`, result);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: usersNeedingReminder.length,
      notification_id: result.id 
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
