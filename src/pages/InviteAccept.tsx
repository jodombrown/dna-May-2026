import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * Landing page for Supabase auth-invite emails.
 * Supabase parses the invite token from the URL hash and creates a session.
 * The user then sets their password + full name to finish onboarding.
 */
export default function InviteAccept() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasInviteSession, setHasInviteSession] = useState<boolean | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string>('');

  useEffect(() => {
    const check = async () => {
      await new Promise((r) => setTimeout(r, 400));
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setHasInviteSession(true);
        setInvitedEmail(data.session.user.email ?? '');
      } else {
        setHasInviteSession(false);
      }
    };
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setHasInviteSession(true);
        setInvitedEmail(session.user.email ?? '');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    const { error } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName.trim() },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    // Ensure the profiles row reflects the chosen name for later screens.
    const { data: userRes } = await supabase.auth.getUser();
    if (userRes.user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', userRes.user.id);
    }

    setStatus('success');
    // Send them into onboarding so they complete their profile.
    setTimeout(() => navigate('/onboarding'), 1400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card shadow-xl rounded-lg p-8 space-y-6 border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-dna-forest">Welcome to DNA</h1>
          <p className="text-sm text-muted-foreground">
            You've been invited to join the Diaspora Network of Africa. Set your password to
            activate your account.
          </p>
          {invitedEmail && (
            <p className="text-xs text-muted-foreground">
              Signing in as <span className="font-medium">{invitedEmail}</span>
            </p>
          )}
        </div>

        {hasInviteSession === null && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verifying invite...</span>
          </div>
        )}

        {hasInviteSession === false && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Invite link is invalid or expired</p>
              <p className="mt-1">
                Please ask the person who invited you to send a new invitation.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-dna-copper mt-2"
                onClick={() => navigate('/auth')}
              >
                Go to Sign In
              </Button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-dna-mint/10 text-dna-forest border border-dna-mint/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Account activated!</p>
              <p className="text-muted-foreground mt-1">Taking you to onboarding...</p>
            </div>
          </div>
        )}

        {hasInviteSession && status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
                disabled={status === 'loading'}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create password</Label>
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
              <Label htmlFor="confirm">Confirm password</Label>
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
              {status === 'loading' ? 'Activating...' : 'Activate Account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
