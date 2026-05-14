import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UsernameManagerProps {
  currentUsername?: string;
  onUsernameChange?: (username: string) => void;
  disabled?: boolean;
}

const UsernameManager: React.FC<UsernameManagerProps> = ({
  currentUsername = '',
  onUsernameChange,
  disabled = false
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const canChangeUsername = !disabled;

  useEffect(() => {
    if (username === currentUsername) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    if (username.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, currentUsername]);

  const checkUsernameAvailability = async (name: string) => {
    if (name === currentUsername) return;
    
    setChecking(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', name)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const taken = !!data;
      setIsAvailable(!taken);

      if (taken) {
        const fallbackNames = generateSuggestions(name);
        setSuggestions(fallbackNames);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      setIsAvailable(false);
    }

    setChecking(false);
  };

  const generateSuggestions = (base: string): string[] => {
    const suffix = Math.floor(Math.random() * 1000);
    return [
      `${base}_${suffix}`,
      `${base}.${Math.floor(Math.random() * 100)}`,
      `${base}_${new Date().getFullYear()}`,
      `iam_${base}`,
      `${base}_dna`,
    ];
  };

  const saveUsername = async () => {
    if (!isAvailable || username === currentUsername) {
      toast({ 
        title: "Username Taken", 
        description: "Please choose a different username.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      // Use the database function directly via raw SQL
      const { data, error } = await supabase
        .rpc('update_username' as any, { 
          new_username: username 
        });

      if (error) {
        toast({ 
          title: "Error", 
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Trigger confetti celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#D97706', '#059669']
        });
        
        toast({ 
          title: "🎉 Username Saved!", 
          description: `Welcome, @${username}!`
        });
        onUsernameChange?.(username);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update username. Please try again.",
        variant: "destructive"
      });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
            placeholder="choose_username"
            disabled={!canChangeUsername}
            className={`pr-10 ${
              username.length >= 3 && username !== currentUsername
                ? isAvailable === true
                  ? 'border-green-500 focus:border-green-500'
                  : isAvailable === false
                  ? 'border-red-500 focus:border-red-500'
                  : ''
                : ''
            }`}
          />
          
          {checking && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-neutral-500" />
          )}
          
          {!checking && username.length >= 3 && username !== currentUsername && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isAvailable === true && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {isAvailable === false && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>

        {username.length >= 3 && username !== currentUsername && !checking && (
          <>
            {isAvailable === true && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span>🎉</span>
                <span className="font-medium">This username is available!</span>
              </div>
            )}
            
            {isAvailable === false && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">This username is taken. Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setUsername(suggestion)}
                      className="text-xs h-7"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Button */}
      {username !== currentUsername && username.length >= 3 && (
        <Button
          onClick={saveUsername}
          disabled={!isAvailable || saving || !canChangeUsername}
          className="w-full bg-dna-copper hover:bg-dna-gold text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Username'
          )}
        </Button>
      )}
    </div>
  );
};

export default UsernameManager;