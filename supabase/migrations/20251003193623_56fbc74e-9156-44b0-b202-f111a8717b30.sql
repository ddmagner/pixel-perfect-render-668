-- Add sort_option column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN sort_option TEXT NOT NULL DEFAULT 'project';