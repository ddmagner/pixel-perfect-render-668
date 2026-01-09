-- Add timezone column to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';