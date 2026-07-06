import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * Landing page for Supabase reauthentication OTP.
 * Reauth emails deliver a 6-digit code (not a click-through link) that the
 * user enters here to unlock sensitive actions like password change.
 */
export default function Reauthenticate() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{6}$/.test(token)) {
      setErrorMsg('Enter the 6-digit code from your email.');
      return;
    }

    setStatus('loading');
    const { error } = await supabase.auth.verifyOtp({
      type: 'reauthentication',
      token,
    } as unknown as Parameters<typeof supabase.auth.verifyOtp>[0]);

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('success');
    setTimeout(() => navigate('/dna/me'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card shadow-xl rounded-lg p-8 space-y-6 border">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-dna-mint/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-dna-forest" />
          </div>
          <h1 className="text-2xl font-bold text-dna-forest">Verify It's You</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit verification code we just emailed you.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-dna-mint/10 text-dna-forest border border-dna-mint/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Verified</p>
              <p className="text-muted-foreground mt-1">Taking you back to your account...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification code</Label>
              <Input
                id="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                disabled={status === 'loading'}
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
              disabled={status === 'loading' || token.length !== 6}
              className="w-full h-12 bg-dna-copper hover:bg-dna-copper/90"
            >
              {status === 'loading' ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
