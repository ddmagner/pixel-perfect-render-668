-- Add custom_fields column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_fields JSONB DEFAULT '[]'::jsonb;