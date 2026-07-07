import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordComplete() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and creates a session automatically.
    // We just need to confirm a session exists before allowing password change.
    const check = async () => {
      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        setHasRecoverySession(!!data.session);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setHasRecoverySession(!!data.session);
    };

    // Give Supabase a tick to process the hash
    const timer = setTimeout(check, 300);

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(!!session);
      }
    });

    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('success');
    setTimeout(() => navigate('/dna/me'), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card shadow-xl rounded-lg p-8 space-y-6 border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-dna-forest">Choose a New Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter and confirm your new password below.
          </p>
        </div>

        {hasRecoverySession === false && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Reset link is invalid or expired</p>
              <p className="mt-1">
                Please request a new password reset email and try again.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-dna-copper mt-2"
                onClick={() => navigate('/reset-password')}
              >
                Request new link
              </Button>
            </div>
          </div>
        )}

        {status === 'success' ? (
          <div className="bg-dna-mint/10 text-dna-forest border border-dna-mint/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Password updated!</p>
              <p className="text-muted-foreground mt-1">Redirecting you now...</p>
            </div>
          </div>
        ) : (
          hasRecoverySession && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    disabled={status === 'loading'}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12"
                  disabled={status === 'loading'}
                  autoComplete="new-password"
                />
              </div>

              {errorMsg && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-3 flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-12 bg-dna-copper hover:bg-dna-copper/90"
              >
                {status === 'loading' ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )
        )}

        {hasRecoverySession === null && (
          <p className="text-center text-sm text-muted-foreground">Verifying reset link...</p>
        )}
      </div>
    </div>
  );
}
