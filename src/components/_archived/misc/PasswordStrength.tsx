import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

function getScore(pw: string) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

function labelFromScore(score: number) {
  switch (score) {
    case 0:
      return 'Too short';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Weak';
  }
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const score = getScore(password);
  const label = labelFromScore(score);

  const activeColor =
    score <= 1
      ? 'bg-neutral-300'
      : score === 2
      ? 'bg-dna-copper'
      : score === 3
      ? 'bg-dna-gold'
      : 'bg-dna-mint';

  return (
    <div className="mt-2" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-full rounded ${i < score ? activeColor : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-neutral-500">Strength: {label}</p>
    </div>
  );
};

export default PasswordStrength;
