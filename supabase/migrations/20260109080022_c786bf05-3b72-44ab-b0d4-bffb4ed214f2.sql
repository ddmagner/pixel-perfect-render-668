-- Add trial_started_at column to track when user's trial began
-- This is set when the user first creates an account
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

-- Add trial_ends_at column for easy trial expiration checking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create a function to auto-initialize trial for new users
CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id, 
    'trialing', 
    now(), 
    now() + interval '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to initialize trial when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_init_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_init_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_trial();

-- Update existing subscriptions to set trial dates if they don't have active status
-- For existing users without a subscription, we'll handle this in the app