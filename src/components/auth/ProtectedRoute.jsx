import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader, Container } from '@mantine/core';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      
        
      
    );
  }

  if (!user) {
    return ;
  }

  if (requiredRole && user.role !== requiredRole) {
    return ;
  }

  return children;
};