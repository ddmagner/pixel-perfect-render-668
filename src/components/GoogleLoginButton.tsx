import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import despia from 'despia-native';
import { useDespia } from '@/hooks/useDespia';
import { useHaptics } from '@/hooks/useHaptics';

interface GoogleLoginButtonProps {
  className?: string;
}

/**
 * GoogleLoginButton handles both web and native OAuth flows.
 * 
 * Web: Uses Supabase's signInWithOAuth directly
 * Native (Despia): Uses edge function + ASWebAuthenticationSession/Chrome Custom Tab
 */
const GoogleLoginButton = ({ className }: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDespia } = useDespia();
  const { lightImpact } = useHaptics();

  const handleGoogleLogin = async () => {
    lightImpact();
    
    if (isDespia) {
      // NATIVE FLOW
      // 1. Get OAuth URL from edge function (includes deeplink_scheme)
      // 2. Open in ASWebAuthenticationSession/Chrome Custom Tab via despia()
      // 3. After OAuth, NativeCallback.tsx redirects to deeplink
      setIsLoading(true);
      
      try {
        console.log('Starting native OAuth flow...');
        
        const { data, error } = await supabase.functions.invoke('auth-start', {
          body: { 
            provider: 'google',
            deeplink_scheme: 'timeinapp', // Your Despia app scheme
          },
        });

        if (error || !data?.url) {
          console.error('Failed to get OAuth URL:', error);
          setIsLoading(false);
          return;
        }

        console.log('Got OAuth URL, opening in native browser...');
        
        // Opens URL in ASWebAuthenticationSession (iOS) or Chrome Custom Tab (Android)
        despia(`oauth://?url=${encodeURIComponent(data.url)}`);
        
        // Note: We don't setIsLoading(false) here because the browser session
        // will close and redirect back to the app
      } catch (err) {
        console.error('Error starting native auth:', err);
        setIsLoading(false);
      }
    } else {
      // WEB FLOW
      // Standard Supabase OAuth - no edge function needed
      console.log('Starting web OAuth flow...');
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          scopes: 'openid email profile',
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`w-full py-3.5 font-bold text-[15px] transition-colors flex items-center justify-center gap-2 border border-[#09121F] text-[#09121F] hover:bg-[#09121F]/5 disabled:opacity-50 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {isLoading ? 'Opening...' : 'Continue with Google'}
    </button>
  );
};

export default GoogleLoginButton;
