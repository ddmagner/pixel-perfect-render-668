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
        className="flex w-full flex-col items-start relative bg-white overflow-x-hidden px-5"
        style={{ fontFamily: 'Gilroy, sans-serif' }}
      >
        {/* Logo Navigation */}
        <nav className="flex justify-center items-center self-stretch px-0 pt-4 pb-1">
          <div className="flex h-3.5 justify-end items-center">
            <div className="flex items-center gap-[9px]">
              <div>
                <img 
                  src="/lovable-uploads/8829a351-d8df-4d66-829d-f34b1754bd35.png" 
                  alt="Logo" 
                  className="w-[14px] h-[14px]"
                />
              </div>
              <div className="w-[91px] self-stretch">
                <img 
                  src="/lovable-uploads/21706651-e7f7-4eec-b5d7-cd8ccf2a385f.png" 
                  alt="TIME IN Logo" 
                  className="h-[14px] w-[91px]"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Divider */}
        <div className="flex h-px flex-col items-start gap-2.5 self-stretch px-0 py-0">
          <div className="h-px bg-[#09121F] self-stretch" />
        </div>

        {/* Auth Content */}
        <div className="flex w-full flex-col items-center justify-center px-0 py-10">
          {/* Title Section */}
          <header className="flex flex-col justify-center items-center gap-2 mb-8">
            <h1 className="text-[#09121F] text-[28px] font-bold leading-8 tracking-[-0.56px]">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-[#BFBFBF] text-[15px] text-center">
              {isSignUp ? 'Sign up to start tracking your time' : 'Sign in to continue tracking your time'}
            </p>
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF]"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            <div className="w-full px-0 pt-2.5 pb-1">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-white py-3.5 font-bold text-[15px] transition-colors" 
                style={{ backgroundColor: '#09121F' }}
                aria-label={isSignUp ? 'Create Account' : 'Sign In'}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>
          </form>

          {/* Toggle Sign Up/In */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#09121F] text-[15px] font-normal underline hover:opacity-70 transition-opacity"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
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