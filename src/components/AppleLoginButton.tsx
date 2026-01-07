import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import despia from 'despia-native';
import { useDespia } from '@/hooks/useDespia';
import { useHaptics } from '@/hooks/useHaptics';

interface AppleLoginButtonProps {
  className?: string;
}

/**
 * AppleLoginButton handles both web and native Apple OAuth flows.
 * 
 * Web: Uses Supabase's signInWithOAuth directly
 * Native (Despia): Uses edge function + ASWebAuthenticationSession
 */
const AppleLoginButton = ({ className }: AppleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDespia, isIOS } = useDespia();
  const { lightImpact } = useHaptics();

  const handleAppleLogin = async () => {
    lightImpact();
    
    if (isDespia) {
      // NATIVE FLOW
      setIsLoading(true);
      
      try {
        console.log('Starting native Apple OAuth flow...');
        
        const { data, error } = await supabase.functions.invoke('auth-start', {
          body: { 
            provider: 'apple',
            deeplink_scheme: 'timeinapp',
          },
        });

        if (error || !data?.url) {
          console.error('Failed to get OAuth URL:', error);
          setIsLoading(false);
          return;
        }

        console.log('Got OAuth URL, opening in native browser...');
        despia(`oauth://?url=${encodeURIComponent(data.url)}`);
      } catch (err) {
        console.error('Error starting native auth:', err);
        setIsLoading(false);
      }
    } else {
      // WEB FLOW
      console.log('Starting web Apple OAuth flow...');
      
      await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          scopes: 'name email',
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleAppleLogin}
      disabled={isLoading}
      className={`w-full py-3.5 font-bold text-[15px] transition-colors flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 disabled:opacity-50 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
      {isLoading ? 'Opening...' : 'Continue with Apple'}
    </button>
  );
};

export default AppleLoginButton;
