import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionErrorProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

const ConnectionError: React.FC<ConnectionErrorProps> = ({ 
  onRetry, 
  title = "Connection Error",
  description = "Unable to connect to our servers. Please check your internet connection and try again."
}) => {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-white to-dna-emerald/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-neutral-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-neutral-600 text-sm leading-relaxed">
            {description}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              className="w-full bg-dna-copper hover:bg-dna-gold text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
          
          <div className="mt-6 text-xs text-neutral-500 space-y-1">
            <p>If the problem persists:</p>
            <ul className="text-left space-y-1 pl-4">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Contact support if needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionError;