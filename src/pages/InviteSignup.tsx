import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { UserPlus, Users, ChevronRight } from 'lucide-react';
import { getErrorMessage } from '@/lib/errorLogger';

const InviteSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviterName, setInviterName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const referralCode = searchParams.get('ref');

  useEffect(() => {
    if (referralCode) {
      validateInvite();
    } else {
      setValidatingInvite(false);
    }
  }, [referralCode]);

  const validateInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('code', referralCode)
        .single();

      if (error || !data) {
        setInviteValid(false);
      } else {
        const isExpired = new Date(data.expires_at) < new Date();
        const isUsed = data.used_at;
        
        if (isExpired || isUsed) {
          setInviteValid(false);
        } else {
          setInviteValid(true);
          setInviterName('A DNA member');
          // Pre-fill email if available
          if (data.email) {
            setFormData(prev => ({ ...prev, email: data.email }));
          }
        }
      }
    } catch (error) {
      setInviteValid(false);
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            is_beta_tester: true,
            referral_code: referralCode,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user && referralCode) {
        // Handle referral tracking
        await supabase.rpc('handle_referral_signup', {
          new_user_id: authData.user.id,
          referral_code_param: referralCode
        });
      }

      toast({
        title: "Welcome to DNA!",
        description: "Your account has been created successfully",
      });

      // Redirect to feed
      navigate('/dna/feed');
    } catch (error: unknown) {
      toast({
        title: "Signup Error",
        description: getErrorMessage(error) || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingInvite) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader label="Validating invitation..." />
      </div>
    );
  }

  if (referralCode && !inviteValid) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This invitation link has expired or is no longer valid.
            </p>
            <Button 
              onClick={() => navigate('/waitlist')}
              className="w-full bg-dna-forest hover:bg-dna-forest/90"
            >
              Join the Waitlist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-dna-emerald/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-dna-emerald" />
          </div>
          <CardTitle className="text-xl">Join DNA</CardTitle>
          {inviteValid && (
            <p className="text-muted-foreground">
              {inviterName} invited you to join Africa's digital diaspora network
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              disabled={!!formData.email} // Disable if pre-filled from invite
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>
          
          <Button 
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-dna-forest hover:bg-dna-forest/90"
          >
            {loading ? <Loader /> : (
              <>
                Join DNA
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button variant="link" onClick={() => navigate('/auth')} className="p-0 h-auto">
                Sign in
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignup;