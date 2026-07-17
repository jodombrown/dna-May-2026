import React from 'react';

/**
 * Editorial section label for the public profile page.
 * Small uppercase, letter-spaced, copper accent — matches the Identity System
 * grouped-list vocabulary used in SettingsGroup.
 */
interface ProfileSectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

const ProfileSectionLabel: React.FC<ProfileSectionLabelProps> = ({ children, className = '' }) => (
  <h2
    className={`text-[11px] uppercase tracking-[0.14em] font-semibold mb-3 ${className}`}
    style={{ color: 'hsl(25 55% 40%)' }}
  >
    {children}
  </h2>
);

export default ProfileSectionLabel;
