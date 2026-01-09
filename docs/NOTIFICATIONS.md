# Push Notifications System

Time In uses OneSignal for push notifications with a Supabase Edge Function (`send-reminders`) that runs on a schedule.

## Notification Types

### 1. Morning Inspiration Quote (9 AM Local Time)

**Title:** Time In Reminder  
**Body:** A motivational quote about time

**Example:**
> "Time is the most valuable thing a man can spend." — Theophrastus

**Source:** Quotes are fetched from the [ZenQuotes API](https://zenquotes.io/). If the API is unavailable, fallback quotes are used.

**Fallback Quotes:**
- "Time is the most valuable thing a man can spend." — Theophrastus
- "Lost time is never found again." — Benjamin Franklin
- "The key is not spending time, but investing it." — Stephen Covey
- "Time you enjoy wasting is not wasted time." — Marthe Troly-Curtin
- "Better three hours too soon than a minute too late." — William Shakespeare

---

### 2. Inactivity Reminder (1 PM Local Time)

Sent to users who haven't logged time in the last 48 hours. Messages are day-specific:

| Day       | Title                  | Body                      |
|-----------|------------------------|---------------------------|
| Monday    | Time is on your side.  | Tap to record it.         |
| Tuesday   | Get your time in.      | Tap to track it.          |
| Wednesday | Time getting away?     | Tap to capture it.        |
| Thursday  | Have time?             | Tap to capture minutes.   |
| Friday    | Time flies!            | Tap to recap the week.    |

Weekend notifications are only sent if the user has enabled "Include weekends" in their settings.

---

## Timezone Handling

Notifications are sent based on the **user's local time**, not UTC:

1. **Device Detection:** When the app opens, the user's device timezone is automatically detected using `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. **Database Storage:** The timezone is saved to the `timezone` column in `app_settings`
3. **Travel Support:** The timezone updates every time the app is opened, so it stays accurate when traveling
4. **Edge Function:** The `send-reminders` function calculates each user's local hour and day to send notifications at the correct time

---

## User Preferences

Users can configure notifications in **Settings > Communications**:

| Setting              | Description                                      | Default |
|----------------------|--------------------------------------------------|---------|
| Use-based reminders  | Enable/disable all push notifications            | On      |
| Include weekends     | Receive notifications on Saturday/Sunday         | Off     |

---

## Technical Architecture

### Database Schema

```sql
-- app_settings table
timezone TEXT DEFAULT 'UTC'  -- e.g., "America/New_York", "Europe/London"
notifications_enabled BOOLEAN DEFAULT true
weekend_reminders BOOLEAN DEFAULT false
```

### Edge Function

**Location:** `supabase/functions/send-reminders/index.ts`

**Trigger:** Runs hourly via Supabase cron job

**Flow:**
1. Fetches all users with their notification settings and timezone
2. For each user, calculates their local hour and day of week
3. At 9 AM local time → Sends morning quote
4. At 1 PM local time → Checks for 48-hour inactivity and sends day-specific reminder

### Required Secrets

| Secret Name            | Description                    |
|------------------------|--------------------------------|
| ONESIGNAL_APP_ID       | OneSignal application ID       |
| ONESIGNAL_REST_API_KEY | OneSignal REST API key         |

---

## OneSignal Setup

1. Create a OneSignal account and app at [onesignal.com](https://onesignal.com)
2. Configure iOS and Android push credentials
3. Add the app ID and REST API key to Supabase secrets
4. Users are identified by their Supabase `user_id` as the external user ID

---

## Testing

To test notifications manually:

1. Open the app to save your timezone
2. Call the edge function directly via Supabase dashboard or curl
3. Check the function logs for results

**Logs location:** Supabase Dashboard > Edge Functions > send-reminders > Logs
