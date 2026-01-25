import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { checkSession } from '../api/auth';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requiresProject = false }) => {
  const navigate = useNavigate();
  const [isSessionValid, setIsSessionValid] = useState(null); // null = loading

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

  useEffect(() => {
    const verifySession = async () => {
      if (!userData) {
        setIsSessionValid(false);
        return;
      }

      try {
        const response = await checkSession();
        if (response.error === "session expired") {
          localStorage.removeItem('userData');
          toast.error("Session expired. Please login again.");
          setIsSessionValid(false);
        } else {
          setIsSessionValid(true);
        }
      } catch (error) {
        console.error("Session check failed", error);
        // On network error, we might want to be lenient or strict. 
        // For now, let's assume valid to avoid blocking on transient errors, 
        // unless it was an explicit auth failure handled in checkSession.
        setIsSessionValid(true);
      }
    };

    verifySession();
  }, []);

  // If no user data initially, redirect immediately
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // While checking session, you might show a loader or valid content
  // Showing valid content prevents flash, but might show sensitive data briefly if session is actually expired.
  // A spinner is safer.
  if (isSessionValid === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (isSessionValid === false) {
    return <Navigate to="/login" replace />;
  }

  // If route requires project and user has no projects, redirect to projects page
  if (requiresProject && userData.project_count === 0) {
    return <Navigate to="/projects" replace />;
  }

  return children;
};

export default ProtectedRoute;
