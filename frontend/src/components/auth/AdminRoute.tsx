import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Forbidden403 } from '../../pages/Forbidden403';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-secondary text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying administrator authorization...</span>
        </div>
      </div>
    );
  }

  // Authoritative check: Only users with actual backend system_role === 'ADMIN' can proceed
  if (!user || user.system_role !== 'ADMIN') {
    return <Forbidden403 />;
  }

  return <>{children}</>;
};
