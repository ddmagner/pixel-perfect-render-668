import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, deeplink_scheme } = await req.json();

    if (!provider || !deeplink_scheme) {
      console.error('Missing required parameters:', { provider, deeplink_scheme });
      return new Response(
        JSON.stringify({ error: 'provider and deeplink_scheme required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Redirect to /native-callback so we can close the browser session via deeplink
    // The deeplink_scheme is passed through so NativeCallback knows where to redirect
    const redirectUrl = `https://90417b06-4690-4e77-b9f5-e0a1c7808d94.lovableproject.com/native-callback?deeplink_scheme=${encodeURIComponent(deeplink_scheme)}`;
    
    console.log('Starting OAuth for provider:', provider);
    console.log('Redirect URL:', redirectUrl);

    const params = new URLSearchParams({
      provider,
      redirect_to: redirectUrl,
      scopes: 'openid email profile',
      flow_type: 'implicit',
    });

    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?${params}`;

    console.log('Generated OAuth URL:', oauthUrl);

    return new Response(
      JSON.stringify({ url: oauthUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in auth-start:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
