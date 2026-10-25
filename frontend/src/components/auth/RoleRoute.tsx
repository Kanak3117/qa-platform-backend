import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProjectRole } from '../../types';

interface RoleRouteProps {
  allowedRoles: ProjectRole[];
  allowAdmin?: boolean;
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  allowAdmin = true,
  children,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-secondary text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying role authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowAdmin && user.system_role === 'ADMIN') {
    return <>{children}</>;
  }

  if (user.project_role && allowedRoles.includes(user.project_role)) {
    return <>{children}</>;
  }

  // Unauthorized for this specific role workspace: redirect to user's authorized home
  const targetRedirect = user.project_role === 'DEVELOPER' ? '/developer-workspace' : '/workspace';
  return <Navigate to={targetRedirect} replace />;
};
