import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RevenueCat webhook event types
type RevenueCatEventType = 
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'NON_RENEWING_PURCHASE'
  | 'SUBSCRIPTION_PAUSED'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'TRANSFER';

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: string;
    store: string;
    is_trial_period?: boolean;
    cancellation_reason?: string;
    currency?: string;
    price?: number;
    price_in_purchased_currency?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook authorization
    const authHeader = req.headers.get('authorization');
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_HEADER');
    
    if (!expectedAuth || authHeader !== expectedAuth) {
      console.error('Unauthorized webhook request');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: RevenueCatWebhookEvent = await req.json();
    console.log('RevenueCat webhook received:', JSON.stringify(payload, null, 2));

    const { event } = payload;
    const userId = event.app_user_id;

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine subscription status based on event type
    let status: string;
    let expiresAt: string | null = null;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'NON_RENEWING_PURCHASE':
        status = 'active';
        if (event.expiration_at_ms) {
          expiresAt = new Date(event.expiration_at_ms).toISOString();
        }
        break;
      case 'CANCELLATION':
        // Keep active until expiration
        status = 'cancelled';
        if (event.expiration_at_ms) {
          expiresAt = new Date(event.expiration_at_ms).toISOString();
        }
        break;
      case 'EXPIRATION':
        status = 'expired';
        break;
      case 'SUBSCRIPTION_PAUSED':
        status = 'paused';
        break;
      case 'BILLING_ISSUE':
        status = 'billing_issue';
        if (event.expiration_at_ms) {
          expiresAt = new Date(event.expiration_at_ms).toISOString();
        }
        break;
      default:
        status = 'active';
    }

    console.log(`Updating subscription for user ${userId}: status=${status}, expires_at=${expiresAt}`);

    // Upsert subscription record
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        status,
        plan_id: event.product_id,
        transaction_id: event.id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Subscription updated successfully for user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
