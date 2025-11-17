import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiresProject = false }) => {
  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing userData from localStorage:', error);
      return null;
    }
  };

  const userData = getUserData();

  // If no user data, redirect to login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // If route requires project and user has no projects, redirect to projects page
  if (requiresProject && userData.project_count === 0) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

export default ProtectedRoute;
