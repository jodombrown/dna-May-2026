import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';

const NotFound = () => {
  useScrollToTop();
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-neutral-600 mb-4">Oops! Page not found</p>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
