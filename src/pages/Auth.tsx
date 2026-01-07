import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Scan } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useDespia } from '@/hooks/useDespia';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import AppleLoginButton from '@/components/AppleLoginButton';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isIOS } = useDespia();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const hasProcessedOAuth = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const {
    isAuthenticated: isBiometricAuthenticated,
    isAuthenticating: isBiometricAuthenticating,
    authenticate: authenticateWithBiometric,
    error: biometricError,
    isDespiaNative
  } = useBiometricAuth();

  // Handle OAuth callback - parse tokens from URL and set session
  useEffect(() => {
    if (hasProcessedOAuth.current) return;

    const handleOAuthCallback = async () => {
      // Parse tokens from URL hash (web OAuth) or query params (native deeplink)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const windowParams = new URLSearchParams(window.location.search);

      // Check for OAuth errors
      const errorParam = searchParams.get('error') || hashParams.get('error') || windowParams.get('error');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description') || windowParams.get('error_description');
      
      if (errorParam) {
        console.error('OAuth error:', errorParam, errorDescription);
        toast({
          description: errorDescription || errorParam,
          variant: "destructive"
        });
        return;
      }

      // Get tokens (try hash first for web, then query params for native)
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || windowParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || windowParams.get('refresh_token');

      if (accessToken) {
        hasProcessedOAuth.current = true;
        setIsProcessingOAuth(true);
        
        console.log('Found OAuth tokens, setting session...');
        
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error('Failed to set session:', sessionError);
            toast({
              description: sessionError.message,
              variant: "destructive"
            });
            setIsProcessingOAuth(false);
            return;
          }
          
          console.log('Session set successfully, navigating to home...');
          navigate('/', { replace: true });
        } catch (err) {
          console.error('Error setting session:', err);
          toast({
            description: err instanceof Error ? err.message : 'Failed to complete sign in',
            variant: "destructive"
          });
          setIsProcessingOAuth(false);
        }
        return;
      }

      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, toast]);

  // Handle successful biometric authentication
  useEffect(() => {
    if (isBiometricAuthenticated) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/');
        } else {
          toast({
            description: "Face ID verified. Please sign in with your credentials.",
          });
        }
      });
    }
  }, [isBiometricAuthenticated, navigate, toast]);

  // Show biometric error
  useEffect(() => {
    if (biometricError) {
      toast({
        description: biometricError,
        variant: "destructive"
      });
    }
  }, [biometricError, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            description: "Passwords don't match",
            variant: "destructive"
          });
          return;
        }
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              description: "User already exists. Please sign in instead.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else {
            toast({
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            description: "Check your email for the confirmation link!"
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) {
          toast({
            description: error.message,
            variant: "destructive"
          });
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error?.message || 'Network connection failed. Please check your internet connection and try again.';
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while processing OAuth
  if (isProcessingOAuth) {
    return (
      <div className="flex w-full max-w-sm mx-auto flex-col items-center justify-center relative bg-white overflow-hidden h-screen fixed inset-0 px-2.5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground text-sm">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap" />
      <div className="flex w-full max-w-sm mx-auto flex-col items-start relative bg-white overflow-hidden h-screen fixed inset-0 px-2.5" style={{
        fontFamily: 'Gilroy, sans-serif'
      }}>
        {/* Logo Navigation */}
        <nav className="flex justify-center items-center self-stretch px-0 pt-4 pb-1">
          <div className="flex h-3.5 justify-end items-center">
            <div className="flex items-center gap-[9px]">
              <img src="/time-in-logo.png" alt="Time In Logo" className="h-[14px]" />
            </div>
          </div>
        </nav>

        {/* Auth Content */}
        <div className="flex w-full flex-col items-center justify-start px-0 pt-[100px] min-h-screen">
          {/* Title Section */}
          <header className="flex flex-col justify-start items-start gap-2 mb-8 w-full">
            <h1 className="text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">
              {isSignUp ? 'Create Account' : 'Sign in'}
            </h1>
          </header>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="flex flex-col items-start gap-1 self-stretch">
            <div className="flex flex-col items-start self-stretch">
              <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                <label htmlFor="email" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]">
                  Email
                </label>
              </div>
              <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                <input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" 
                  placeholder="Enter your email" 
                  required 
                />
              </div>
            </div>

            <div className="flex flex-col items-start self-stretch">
              <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                <label htmlFor="password" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]">
                  Password
                </label>
              </div>
              <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                <div className="flex-[1_0_0] relative">
                  <input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    className="w-full text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF] pr-8" 
                    placeholder="Enter your password" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-[#BFBFBF]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {isSignUp && (
              <div className="flex flex-col items-start self-stretch">
                <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                  <label htmlFor="confirmPassword" className="flex-[1_0_0] text-[#09121F] text-[15px] font-bold leading-5 tracking-[0.1px]">
                    Confirm Password
                  </label>
                </div>
                <div className="flex items-start gap-2.5 self-stretch px-0 py-1">
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} 
                    className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]" 
                    placeholder="Confirm your password" 
                    required 
                  />
                </div>
              </div>
            )}

            <div className="w-full px-0 pt-[25px] pb-1 flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full text-white py-3.5 font-bold text-[15px] transition-colors" 
                style={{ backgroundColor: '#09121F' }} 
                aria-label={isSignUp ? 'Create Account' : 'Sign In'}
              >
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>

              {/* Google Sign In */}
              {!isSignUp && <GoogleLoginButton />}

              {/* Apple Sign In - Show on iOS or always on web for Apple users */}
              {!isSignUp && <AppleLoginButton />}

              {/* Face ID Button - Only show on sign in and when in Despia native environment */}
              {!isSignUp && isDespiaNative && (
                <button
                  type="button"
                  onClick={authenticateWithBiometric}
                  disabled={isBiometricAuthenticating}
                  className="w-full py-3.5 font-bold text-[15px] transition-colors flex items-center justify-center gap-2 border border-[#09121F] text-[#09121F] hover:bg-[#09121F]/5"
                  aria-label="Sign in with Face ID"
                >
                  <Scan size={20} />
                  {isBiometricAuthenticating ? 'Authenticating...' : 'Sign in with Face ID'}
                </button>
              )}
            </div>
          </form>

          {/* Toggle Sign Up/In */}
          <div className="text-left mt-6 w-full">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-[#09121F] text-[15px] font-normal underline hover:opacity-70 transition-opacity"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Sign up'}
            </button>
          </div>

          {/* Bottom indicator */}
          <div className="flex flex-col justify-end items-start self-stretch mt-8">
            <div className="flex h-[34px] justify-center items-center self-stretch pl-[150px] pr-[151px] pt-5 pb-[9px]">
              <div className="w-[139px] h-[5px] bg-[#09121F] rounded-[100px]" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
