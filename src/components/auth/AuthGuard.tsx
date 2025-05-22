
import React from 'react';
// import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // Placeholder for authentication logic
  // const isAuthenticated = false; // Replace with actual auth check

  // if (!isAuthenticated) {
  //   return <Navigate to="/signin" replace />;
  // }

  return <>{children}</>;
};

export default AuthGuard;
