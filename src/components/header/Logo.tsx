
import React from 'react';
import { useNavigate } from 'react-router-dom';
import dnaLogo from '@/assets/dna-logo.png';

const Logo = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center space-x-4">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none"
        aria-label="Navigate to home"
      >
        <img 
          src={dnaLogo}
          alt="DNA Logo" 
          className="h-[80px] w-auto"
          width="57"
          height="32"
        />
      </button>
    </div>
  );
};

export default Logo;
