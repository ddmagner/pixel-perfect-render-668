import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            description: "Passwords don't match",
            variant: "destructive",
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
              variant: "destructive",
            });
            setIsSignUp(false);
          } else {
            toast({
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            description: "Check your email for the confirmation link!",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            description: error.message,
            variant: "destructive",
          });
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Gilroy:wght@400;700;800;900&display=swap"
      />
      <div 
        className="flex w-full max-w-[440px] min-h-[956px] flex-col items-center justify-center relative bg-white mx-auto my-0 px-8"
        style={{ fontFamily: 'Gilroy, sans-serif' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-[9px] mb-12">
          <div>
            <img 
              src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
              alt="Logo" 
              className="w-[28px] h-[28px]"
            />
          </div>
          <div className="w-[182px]">
            <img 
              src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
              alt="TIME IN Logo" 
              className="h-[28px] w-[182px]"
            />
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px] mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-[#BFBFBF] text-[15px]">
              {isSignUp ? 'Sign up to start tracking your time' : 'Sign in to continue tracking your time'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[#09121F] text-[15px] font-bold mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#09121F] text-[15px] font-bold mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#BFBFBF]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-[#09121F] text-[15px] font-bold mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#09121F] text-white py-3.5 font-bold text-[15px] mt-6"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#09121F] text-[15px] underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;