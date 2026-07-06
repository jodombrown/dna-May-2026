import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import { getAppUrl } from '@/lib/config';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const currentUrl = `${window.location.search}${window.location.hash}`;
    const looksLikeRecoveryCallback = currentUrl.includes('type=recovery') || currentUrl.includes('code=');

    const timer = looksLikeRecoveryCallback
      ? window.setTimeout(async () => {
          const { data } = await supabase.auth.getSession();

          if (data.session) {
            navigate('/onboarding/reset-password-complete', { replace: true });
          }
        }, 600)
      : undefined;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/onboarding/reset-password-complete', { replace: true });
      }
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAppUrl('/onboarding/reset-password-complete'),
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card shadow-xl rounded-lg p-8 space-y-6 border">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-dna-forest">Reset Your Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email you used to sign up. We'll send you a secure link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              disabled={status === 'loading'}
            />
          </div>

          <Button 
            type="submit" 
            disabled={status === 'loading'} 
            className="w-full h-12 bg-dna-copper hover:bg-dna-copper/90"
          >
            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        {/* Success State */}
        {status === 'sent' && (
          <div className="bg-dna-mint/10 text-dna-forest border border-dna-mint/20 rounded-xl p-4 flex items-start gap-3">
            <MailCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Check your inbox!</p>
              <p className="text-muted-foreground mt-1">
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 24 hours for security.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Something went wrong</p>
              <p className="mt-1">{errorMsg || 'Please try again later.'}</p>
            </div>
          </div>
        )}

        {/* Back to Auth */}
        <div className="pt-4 border-t">
          <Link 
            to="/auth" 
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-dna-copper transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        {/* Support */}
        <div className="text-xs text-center text-muted-foreground pt-2">
          Need help? <Link to="/contact" className="underline text-dna-copper hover:text-dna-copper/80">Contact support</Link>
        </div>
      </div>
    </div>
  );
}