import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Mail,
  Send
} from 'lucide-react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errorLogger';

interface AdminValidation {
  isValid: boolean;
  roleLevel: string | null;
  isSuperAdmin: boolean;
}

const AdminLogin = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<AdminValidation | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Check if already authenticated as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Check if current user is admin
          const { data, error } = await (supabase as any).rpc('get_current_admin_status');

          if (!error && data && Array.isArray(data) && data.length > 0 && data[0].is_admin) {
            navigate('/admin/dashboard', { replace: true });
            return;
          }
        }
      } catch (error) {
        // Error checking auth
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [navigate]);

  // Validate email on blur
  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) {
      setEmailValidation(null);
      setEmailError(null);
      return;
    }

    setIsValidatingEmail(true);
    setEmailError(null);

    try {
      const { data, error } = await (supabase as any).rpc('is_valid_admin_email', {
        check_email: email.toLowerCase().trim()
      });

      if (error) {
        setEmailError('Unable to validate email. Please try again.');
        setEmailValidation(null);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        setEmailValidation({
          isValid: result.is_valid,
          roleLevel: result.role_level,
          isSuperAdmin: result.is_super_admin
        });

        if (!result.is_valid) {
          setEmailError('This email is not authorized for admin access. Only @diasporanetwork.africa emails or pre-approved accounts can access the admin panel.');
        }
      } else {
        setEmailValidation({ isValid: false, roleLevel: null, isSuperAdmin: false });
        setEmailError('This email is not authorized for admin access.');
      }
    } catch (error) {
      setEmailError('Unable to validate email. Please try again.');
      setEmailValidation(null);
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    // First validate the email if not already validated
    if (!emailValidation) {
      await handleEmailBlur();
    }

    // Re-check validation state
    const currentValidation = emailValidation;
    if (!currentValidation?.isValid) {
      toast({
        title: 'Access Denied',
        description: 'This email is not authorized for admin access.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the send-magic-link edge function
      const { data, error } = await supabase.functions.invoke('send-magic-link', {
        body: {
          email: email.toLowerCase().trim(),
          redirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
      toast({
        title: 'Magic Link Sent',
        description: 'Check your email for a secure login link.',
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to send magic link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = () => {
    setMagicLinkSent(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl" />
        </div>

        {/* Back Link */}
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DNA Platform
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-lg bg-emerald-600 flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              DNA Admin Portal
            </h1>
            <p className="text-lg text-white/70 max-w-md">
              Secure administrative access to manage users, content, and platform settings.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-white/60">
              <Mail className="w-5 h-5 text-emerald-500" />
              <span>Passwordless magic link authentication</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <Lock className="w-5 h-5 text-emerald-500" />
              <span>Domain-restricted access</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span>Role-based access control</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <AlertTriangle className="w-5 h-5 text-emerald-500" />
              <span>All actions are logged for security</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/40 text-sm">
          Access restricted to authorized personnel only.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-neutral-50 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Back Link */}
          <div className="lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to DNA Platform
            </Link>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="lg:hidden w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Admin Sign In</h2>
            <p className="text-neutral-500">
              {magicLinkSent 
                ? 'Check your email for the magic link' 
                : 'Enter your email to receive a secure login link'}
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-neutral-200 shadow-lg">
            <CardContent className="pt-6">
              {magicLinkSent ? (
                // Magic Link Sent State
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-neutral-900">Check Your Email</h3>
                    <p className="text-neutral-600 text-sm">
                      We've sent a secure login link to<br />
                      <span className="font-medium text-neutral-900">{email}</span>
                    </p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-600">
                    <p>Click the link in your email to access the admin portal. The link expires in 24 hours.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResendLink}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Another Link
                  </Button>
                </div>
              ) : (
                // Email Input Form
                <form onSubmit={handleSendMagicLink} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-neutral-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@diasporanetwork.africa"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailValidation(null);
                          setEmailError(null);
                        }}
                        onBlur={handleEmailBlur}
                        required
                        disabled={isLoading}
                        className={`pr-10 ${
                          emailValidation?.isValid
                            ? 'border-emerald-500 focus-visible:ring-emerald-500'
                            : emailError
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                        }`}
                      />
                      {isValidatingEmail && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />
                      )}
                      {!isValidatingEmail && emailValidation?.isValid && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                      {!isValidatingEmail && emailError && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {emailValidation?.isValid && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Authorized: {emailValidation.roleLevel?.replace('_', ' ')}
                        {emailValidation.isSuperAdmin && ' (Super Admin)'}
                      </p>
                    )}
                  </div>

                  {/* Email Error Alert */}
                  {emailError && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {emailError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading || !email || !!emailError}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p className="text-amber-700">
                  Magic links are sent only to authorized @diasporanetwork.africa emails. All login attempts are logged.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Admin */}
          <p className="text-center text-sm text-neutral-500">
            Need admin access?{' '}
            <a
              href="mailto:admin@diasporanetwork.africa"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Contact an administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
