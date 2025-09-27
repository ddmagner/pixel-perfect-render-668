-- Clean up test data for beta release

-- Remove time entries with test clients "BAD" and "OOO"
DELETE FROM public.time_entries 
WHERE client IN ('BAD', 'OOO');

-- Remove duplicate app_settings, keeping only the most recent one per user
DELETE FROM public.app_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.app_settings 
  ORDER BY user_id, created_at DESC
);