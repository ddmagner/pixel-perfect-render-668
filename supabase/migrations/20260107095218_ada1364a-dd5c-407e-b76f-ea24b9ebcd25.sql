-- Add notification preferences columns to app_settings table
ALTER TABLE public.app_settings
ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN reminder_frequency TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN reminder_time TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN weekend_reminders BOOLEAN NOT NULL DEFAULT false;