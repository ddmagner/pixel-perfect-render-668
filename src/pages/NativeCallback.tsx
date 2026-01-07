import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * NativeCallback handles OAuth callback for native apps (Despia).
 * 
 * This page runs inside ASWebAuthenticationSession (iOS) or Chrome Custom Tab (Android).
 * It parses tokens from the URL and redirects to a deeplink to:
 * 1. Close the browser session
 * 2. Pass tokens back to the app
 * 3. Navigate to /auth in the WebView
 */
const NativeCallback = () => {
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Get deeplink scheme from query params (set by edge function)
    const deeplinkScheme = searchParams.get('deeplink_scheme') || 
                           new URLSearchParams(window.location.search).get('deeplink_scheme');
    
    console.log('NativeCallback loaded');
    console.log('Deeplink scheme:', deeplinkScheme);
    console.log('Full URL:', window.location.href);
    console.log('Hash:', window.location.hash);

    if (!deeplinkScheme) {
      console.error('No deeplink_scheme provided');
      return;
    }

    // Parse tokens from URL hash (Supabase implicit flow puts them here)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    console.log('Access token present:', !!accessToken);
    console.log('Refresh token present:', !!refreshToken);

    if (!accessToken) {
      // Check for errors
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
      
      console.error('OAuth error:', error, errorDesc);
      
      // Redirect to app with error
      const errorUrl = `${deeplinkScheme}://oauth/auth?error=${encodeURIComponent(error || 'unknown')}&error_description=${encodeURIComponent(errorDesc || '')}`;
      console.log('Redirecting to error URL:', errorUrl);
      window.location.href = errorUrl;
      return;
    }

    // Build deeplink URL
    // Format: myapp://oauth/auth?access_token=xxx&refresh_token=yyy
    // - myapp:// = your app's scheme
    // - oauth/ = tells native code to close ASWebAuthenticationSession/Chrome Custom Tab
    // - auth = the path to navigate to in the WebView
    // - ?params = passed to that page
    const params = new URLSearchParams();
    params.set('access_token', accessToken);
    if (refreshToken) {
      params.set('refresh_token', refreshToken);
    }

    const deeplinkUrl = `${deeplinkScheme}://oauth/auth?${params.toString()}`;
    
    console.log('Redirecting to deeplink:', deeplinkUrl);
    
    // This closes the ASWebAuthenticationSession / Chrome Custom Tab
    // and opens /auth?access_token=xxx in the WebView
    window.location.href = deeplinkUrl;
  }, [searchParams]);

  return (
    <div className="flex w-full max-w-sm mx-auto flex-col items-center justify-center relative bg-white overflow-hidden h-screen fixed inset-0 px-2.5">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <p className="text-foreground text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default NativeCallback;
