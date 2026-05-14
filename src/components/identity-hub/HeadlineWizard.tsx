/**
 * Headline Wizard — Structured headline builder for onboarding.
 *
 * Rather than a blank text field, offers a structured headline builder:
 * [Role/Title] | [Focus/Industry] | [Location ↔ Heritage Connection]
 *
 * DIA suggests headline components based on entered information.
 * Per PRD Section 7.2.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HEADLINE_WIZARD } from '@/types/onboardingHub';
import { MateMasie } from '@/components/icons/adinkra';

interface HeadlineWizardProps {
  value: string;
  onChange: (headline: string) => void;
  industry?: string | null;
  heritageCountry?: string | null;
  currentLocation?: string | null;
}

export const HeadlineWizard: React.FC<HeadlineWizardProps> = ({
  value,
  onChange,
  industry,
  heritageCountry,
  currentLocation,
}) => {
  const [role, setRole] = useState('');
  const [focus, setFocus] = useState('');
  const [connection, setConnection] = useState('');
  const [useWizard, setUseWizard] = useState(true);

  // Build headline from components
  const composedHeadline = useMemo(() => {
    const parts = [role, focus, connection].filter(Boolean);
    return parts.join(' | ');
  }, [role, focus, connection]);

  // Update parent whenever composed headline changes
  const handleComponentChange = useCallback(
    (setter: (v: string) => void, newValue: string) => {
      setter(newValue);
      // We need to compute the new headline synchronously
      const newRole = setter === setRole ? newValue : role;
      const newFocus = setter === setFocus ? newValue : focus;
      const newConnection = setter === setConnection ? newValue : connection;
      const parts = [newRole, newFocus, newConnection].filter(Boolean);
      onChange(parts.join(' | '));
    },
    [role, focus, connection, onChange]
  );

  // DIA suggestions based on context
  const suggestions = useMemo(() => {
    const items: string[] = [];
    if (industry) {
      items.push(`${industry} Professional`);
      items.push(`Building in ${industry}`);
    }
    if (heritageCountry && currentLocation) {
      items.push(`${currentLocation} ↔ ${heritageCountry}`);
    }
    if (heritageCountry) {
      items.push(`Connecting ${heritageCountry}n diaspora`);
    }
    return items;
  }, [industry, heritageCountry, currentLocation]);

  return (
    <div className="space-y-4">
      {/* Toggle between wizard and free-form */}
      <div className="flex items-center gap-2">
        <button
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            useWizard
              ? 'bg-emerald-100 text-emerald-800 font-medium'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
          }`}
          onClick={() => setUseWizard(true)}
        >
          Guided
        </button>
        <button
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
            !useWizard
              ? 'bg-emerald-100 text-emerald-800 font-medium'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
          }`}
          onClick={() => setUseWizard(false)}
        >
          Free-form
        </button>
      </div>

      {useWizard ? (
        <>
          {/* Pattern display */}
          <div className="bg-neutral-50 rounded-lg p-3">
            <p className="text-xs text-neutral-500 font-mono">
              {HEADLINE_WIZARD.pattern}
            </p>
          </div>

          {/* Component inputs */}
          <div className="space-y-3">
            {HEADLINE_WIZARD.components.map((comp) => (
              <div key={comp.id}>
                <label className="text-xs font-medium text-neutral-700 mb-1 block">
                  {comp.label}
                  {comp.required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <Input
                  placeholder={comp.placeholder}
                  value={
                    comp.id === 'role' ? role :
                    comp.id === 'focus' ? focus :
                    connection
                  }
                  onChange={(e) => {
                    const setter =
                      comp.id === 'role' ? setRole :
                      comp.id === 'focus' ? setFocus :
                      setConnection;
                    handleComponentChange(setter, e.target.value);
                  }}
                  className="text-sm"
                  maxLength={60}
                />
              </div>
            ))}
          </div>

          {/* Live preview */}
          {composedHeadline && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium mb-1">
                Preview
              </p>
              <p className="text-sm font-medium text-emerald-900">
                {composedHeadline}
              </p>
            </div>
          )}

          {/* DIA suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <MateMasie className="w-3 h-3 text-amber-500" />
                <p className="text-[10px] text-neutral-500">DIA suggestions</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => {
                      // Try to insert the suggestion into the most fitting component
                      if (suggestion.includes('↔') || suggestion.includes('diaspora')) {
                        handleComponentChange(setConnection, suggestion);
                      } else if (suggestion.includes('Building') || suggestion.includes('Professional')) {
                        handleComponentChange(setFocus, suggestion);
                      } else {
                        handleComponentChange(setRole, suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Free-form input */}
          <Input
            placeholder="e.g., Supply Chain Innovation | Lagos ↔ Atlanta"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm"
            maxLength={120}
          />
          <p className="text-[10px] text-neutral-400">
            {value.length}/120 characters
          </p>
        </>
      )}

      {/* Examples */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1.5">
          Examples
        </p>
        <div className="space-y-1">
          {HEADLINE_WIZARD.examples.map((example, i) => (
            <button
              key={i}
              className="block w-full text-left text-xs text-neutral-500 hover:text-neutral-700 p-1.5 rounded hover:bg-neutral-50 transition-colors"
              onClick={() => {
                onChange(example);
                if (useWizard) {
                  const parts = example.split(' | ');
                  setRole(parts[0] || '');
                  setFocus(parts[1] || '');
                  setConnection(parts[2] || '');
                }
              }}
            >
              <ArrowRight className="w-3 h-3 inline mr-1 opacity-50" />
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeadlineWizard;
