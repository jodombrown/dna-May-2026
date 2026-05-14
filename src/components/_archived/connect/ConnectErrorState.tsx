
import React from 'react';

interface ConnectErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ConnectErrorState: React.FC<ConnectErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-xl font-semibold mb-2 text-red-600">Failed to Load Network</div>
        <div className="text-neutral-600 mb-4">{error}</div>
        <button 
          onClick={onRetry}
          className="bg-dna-emerald hover:bg-dna-forest text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ConnectErrorState;
