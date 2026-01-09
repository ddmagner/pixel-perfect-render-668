import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  expires_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isPremium: boolean;
  isTrialing: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number | null;
  hasAccess: boolean; // true if user can use the app (trialing or active subscription)
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_DURATION_DAYS = 14;

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
      } else if (data) {
        // Cast to include the new columns
        setSubscription(data as unknown as Subscription);
      } else {
        // No subscription record - create one with trial (for existing users)
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
        
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            status: 'trialing',
            trial_started_at: trialStartedAt.toISOString(),
            trial_ends_at: trialEndsAt.toISOString(),
          } as any)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating trial subscription:', insertError);
          setSubscription(null);
        } else {
          setSubscription(newSub as unknown as Subscription);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Poll for subscription updates after a purchase
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchSubscription();
  }, [fetchSubscription]);

  // Calculate subscription state
  const now = new Date();
  
  const isPremium = subscription?.status === 'active' && 
    (!subscription.expires_at || new Date(subscription.expires_at) > now);
  
  const isTrialing = subscription?.status === 'trialing' && 
    subscription.trial_ends_at && new Date(subscription.trial_ends_at) > now;
  
  const isTrialExpired = subscription?.status === 'trialing' && 
    subscription.trial_ends_at && new Date(subscription.trial_ends_at) <= now;

  const trialDaysRemaining = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // User has access if they have an active subscription OR are in trial period
  const hasAccess = isPremium || isTrialing;

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      isPremium, 
      isTrialing,
      isTrialExpired,
      trialDaysRemaining,
      hasAccess,
      isLoading, 
      refetch 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
