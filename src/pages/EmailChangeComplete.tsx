import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Landing page for the Supabase "confirm email change" link.
 * Supabase parses the recovery/change token from the URL hash and updates
 * the user's email + session automatically. We just confirm success.
 */
export default function EmailChangeComplete() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [newEmail, setNewEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const check = async () => {
      // Give Supabase a moment to process the hash fragment
      await new Promise((r) => setTimeout(r, 400));

      const hash = window.location.hash || '';
      if (hash.includes('error=') || hash.includes('error_description=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        setErrorMsg(
          params.get('error_description')?.replace(/\+/g, ' ') ||
            'This email confirmation link is invalid or has expired.',
        );
        setStatus('error');
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setErrorMsg('We could not confirm this email change. The link may have expired.');
        setStatus('error');
        return;
      }

      setNewEmail(data.user.email ?? '');
      setStatus('success');
    };

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user?.email) {
        setNewEmail(session.user.email);
        setStatus('success');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card shadow-xl rounded-lg p-8 space-y-6 border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-dna-forest">Email Address Updated</h1>
          <p className="text-sm text-muted-foreground">
            Confirming your new email address on your DNA account.
          </p>
        </div>

        {status === 'checking' && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verifying link...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-dna-mint/10 text-dna-forest border border-dna-mint/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Your email has been updated</p>
              {newEmail && (
                <p className="text-muted-foreground mt-1">
                  You'll now sign in with <span className="font-medium">{newEmail}</span>.
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Confirmation failed</p>
              <p className="mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {status !== 'checking' && (
          <Button
            className="w-full h-12 bg-dna-copper hover:bg-dna-copper/90"
            onClick={() => navigate(status === 'success' ? '/dna/me' : '/auth')}
          >
            {status === 'success' ? 'Continue to DNA' : 'Back to Sign In'}
          </Button>
        )}
      </div>
    </div>
  );
}
