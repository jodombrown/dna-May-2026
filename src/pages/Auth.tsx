import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Globe, Users, Handshake, Eye, EyeOff } from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errorLogger';
import { cn } from '@/lib/utils';

/**
 * Only same-origin relative paths may be a post-auth destination. A login
 * screen that forwards to `?redirect=https://evil.com` is an open-redirect
 * phishing vector, so anything that isn't a single-leading-slash path
 * (no `//`, no scheme, no backslash tricks) is discarded.
 */
const safeRedirectPath = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('\\')) return null;
  return value;
};

const Auth = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const queryMode = queryParams.get('mode');
  // Toggle between sign-in and sign-up
  const [isSignUp, setIsSignUp] = useState(queryMode === 'signup');

  useEffect(() => {
    setIsSignUp(queryMode === 'signup');
  }, [queryMode]);

  // Where to redirect after login: explicit ?redirect= (public pages like
  // PublicEventPage), then state.from (OnboardingGuard / protected routes),
  // then the feed. Both sources are validated to same-origin paths.
  const redirectTo =
    safeRedirectPath(queryParams.get('redirect')) ??
    safeRedirectPath((location.state as { from?: string })?.from) ??
    '/dna/feed';
  const { toast } = useToast();
  
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [isSignInLoading, setIsSignInLoading] = useState(false);

  // Sign Up State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);

  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignInLoading(true);

    try {
      const { error, data } = await signIn(signInEmail, signInPassword);
      
      if (error) {
        toast({
          title: 'Sign in failed',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        return;
      }
      
      // Fetch user profile to get first name for personalized greeting
      let firstName = '';
      if (data?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, full_name')
          .eq('id', data.user.id)
          .maybeSingle();
        
        firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || '';
      }
      
      toast({
        title: firstName ? `Welcome back, ${firstName}!` : 'Welcome back!',
        description: 'Successfully signed in.',
      });
      navigate(redirectTo);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? getErrorMessage(err) : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`
        }
      });

      if (error) {
        toast({
          title: 'LinkedIn sign in failed',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpFullName.trim()) {
      toast({
        title: 'Full name required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (signUpPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSignUpLoading(true);

    try {
      const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);

      if (error) {
        toast({
          title: 'Sign up failed',
          description: getErrorMessage(error),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Welcome to DNA!',
        description: 'Your account has been created. Let\'s complete your profile.',
      });
      navigate('/onboarding');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? getErrorMessage(err) : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSignUpLoading(false);
    }
  };

  // Features for desktop hero
  const features = [
    {
      icon: Globe,
      title: 'Global Network',
      description: 'Connect with diaspora members across continents'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Join spaces and events that matter to you'
    },
    {
      icon: Handshake,
      title: 'Collaborate',
      description: 'Build partnerships for Africa\'s development'
    }
  ];

  const AuthModeToggle = () => (
    <div className="flex items-center p-1 bg-muted rounded-lg w-full max-w-xs mx-auto">
      <button
        type="button"
        onClick={() => setIsSignUp(true)}
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-all",
          isSignUp
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Join Now
      </button>
      <button
        type="button"
        onClick={() => setIsSignUp(false)}
        className={cn(
          "flex-1 py-2 text-sm font-medium rounded-md transition-all",
          !isSignUp
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Sign In
      </button>
    </div>
  );

  // Auth content switches between sign-in and sign-up
  const authContent = (
    <div className="w-full space-y-4">
      {isSignUp ? (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-fullname">Full Name</Label>
            <Input
              id="signup-fullname"
              type="text"
              placeholder="Your full name"
              value={signUpFullName}
              onChange={(e) => setSignUpFullName(e.target.value)}
              required
              disabled={isSignUpLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
              disabled={isSignUpLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showSignUpPassword ? "text" : "password"}
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                disabled={isSignUpLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSignUpPassword ? "Hide password" : "Show password"}
              >
                {showSignUpPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="signup-confirm"
                type={showSignUpConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                required
                disabled={isSignUpLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSignUpConfirm ? "Hide password" : "Show password"}
              >
                {showSignUpConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-dna-forest hover:bg-dna-forest/90"
            disabled={isSignUpLoading}
          >
            {isSignUpLoading ? 'Joining...' : 'Join Now'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="your@email.com"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              required
              disabled={isSignInLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <div className="relative">
              <Input
                id="signin-password"
                type={showSignInPassword ? "text" : "password"}
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
                disabled={isSignInLoading}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSignInPassword ? "Hide password" : "Show password"}
              >
                {showSignInPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-dna-forest hover:bg-dna-forest/90"
            disabled={isSignInLoading}
          >
            {isSignInLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      )}

      {!isSignUp && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLinkedInSignIn}
          >
            <svg className="w-5 h-5 mr-2" fill="#0077B5" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </Button>
        </>
      )}

    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-background to-dna-copper/10 flex flex-col px-3 pt-6 pb-6 lg:hidden">
        <div className="w-full max-w-md mx-auto">

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-dna-emerald to-dna-copper flex items-center justify-center">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <AuthModeToggle />
              <p className="text-sm text-muted-foreground mt-3">
                {isSignUp ? 'Join the global African diaspora network' : 'Sign in to your account'}
              </p>
            </CardHeader>
            <CardContent>
              {authContent}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Hero/Branding */}
        <div className="w-1/2 bg-gradient-to-br from-dna-forest via-dna-emerald to-dna-copper p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
          </div>
          
          {/* Logo & Back Link */}
          <div className="relative z-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Main Content */}
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Diaspora Network<br />of Africa
              </h1>
              <p className="text-xl text-white/80 max-w-md">
                Join the movement connecting Africa's global diaspora to build, invest, and contribute to the continent's future.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 text-white/60 text-sm">
            © 2024 Diaspora Network of Africa. All rights reserved.
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-1/2 bg-background flex items-center justify-center p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <AuthModeToggle />
              <p className="text-muted-foreground">
                {isSignUp ? 'Join the global African diaspora network' : 'Sign in to your account'}
              </p>
            </div>

            {/* Auth Card */}
            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6">
                {authContent}
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Trusted by diaspora members in 50+ countries</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;