import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'
import { Encrypt } from './encryption/payload-encryption';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    global: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showGlobalError, setShowGlobalError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { username: '', password: '' };

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);

      const payload = {
        email: formData.username,
        password: formData.password
      };

      const { data, key } = Encrypt(payload);

      let data_pass = JSON.stringify({
        "data": data,
        "key": key
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.w1chat.com/account/login',
        headers: {
          'Content-Type': 'application/json'
        },
        data: data_pass
      };

      axios.request(config)
        .then((response) => {
          const data = response.data;

          if (data.error === false) {
            // store safely in localStorage
            localStorage.setItem("userData", JSON.stringify(data));
            toast.loading('Redirecting...');
            setTimeout(() => {
              navigate("/"); // Navigate to Home
            }, 1500);
          } else {
            throw new Error(data.error || "Something went wrong");
          }
        })
        .catch((error) => {
          setErrors((prev) => ({
            ...prev,
            global: error.message || "An error occurred during login"
          }));
          setShowGlobalError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const dismissGlobalError = () => {
    setShowGlobalError(false);
    // Clear the error message after animation completes
    setTimeout(() => {
      setErrors(prev => ({ ...prev, global: '' }));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Animated Image Side - Hidden on mobile */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#FFFFFF"
                d="M45.1,-65.6C58.2,-58.4,68.5,-45.8,73.9,-31.4C79.3,-17,79.7,-0.8,75.9,13.2C72.1,27.1,64.1,38.9,53.1,49.2C42.1,59.5,28.1,68.3,12.5,73.8C-3.1,79.3,-20.3,81.6,-34.9,74.9C-49.5,68.2,-61.5,52.6,-68.2,35.2C-74.9,17.8,-76.3,-1.4,-70.9,-17.8C-65.5,-34.2,-53.3,-47.8,-39.1,-54.7C-24.9,-61.6,-8.7,-61.8,6.3,-69.5C21.3,-77.2,42.6,-92.4,45.1,-65.6Z"
                transform="translate(100 100)"
              />
            </svg>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative z-10 p-10 flex flex-col justify-center h-full"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Welcome Back</h2>
            <p className="text-indigo-100 text-lg">
              Sign in to access your account and continue your journey with us.
            </p>
          </motion.div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Sign In</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>

          <AnimatePresence>
            {showGlobalError && errors.global && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mb-4 flex items-center justify-between rounded-lg border border-red-400 bg-red-100 px-4 py-2 text-red-700 shadow"
                role="alert"
              >
                <span>{errors.global}</span>
                <button
                  onClick={dismissGlobalError}
                  className="ml-3 text-red-800 hover:text-red-600"
                >
                  <svg
                    className="h-5 w-5 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.username ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="Enter your username"
              />
              <AnimatePresence>
                {errors.username && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="Enter your password"
              />
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </motion.button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to='../register' className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
      <Toaster />
    </div>
  );
};

export default Login;