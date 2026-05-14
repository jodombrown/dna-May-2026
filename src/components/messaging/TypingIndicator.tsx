import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  users: Array<{ user_id: string; display_name: string }>;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users, className }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].display_name} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].display_name} and ${users[1].display_name} are typing...`;
    } else {
      return `${users[0].display_name} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className={cn("flex items-center space-x-2 text-sm text-neutral-500", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
        <div 
          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};