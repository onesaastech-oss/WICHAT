import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Encrypt } from './encryption/payload-encryption';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import GoogleAuthButton, { isGoogleAuthEnabled } from '../component/GoogleAuthButton';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { setAuthData, setSelectedProjectId } from '../store/authSlice';
import { loginUser, sendOtp } from '../api/auth';
import SwitchProjectModal from '../component/Modals/SwitchProjectModal';
import { Turnstile } from '@marsidev/react-turnstile';
import LegalLinks from '../component/LegalLinks';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mobile: '',
    otp: '',
  });
  const [errors, setErrors] = useState({
    mobile: '',
    otp: '',
    global: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGlobalError, setShowGlobalError] = useState(false);

  // Project selection modal state (uses SwitchProjectModal - same as Menu)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [loginProjects, setLoginProjects] = useState([]);

  // Cloudflare Turnstile
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileSiteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY || '0x4AAAAAACuMb3QQyxLqxHpe';

  // Prefill form from URL query params
  useEffect(() => {
    if (!location?.search) return;

    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    const usernameFromUrl = params.get('username');

    if (tokenFromUrl && usernameFromUrl) {
      const userDataToStore = {
        token: tokenFromUrl,
        username: usernameFromUrl,
        is_impersonating: true,
        impersonated_at: new Date().toISOString()
      };

      localStorage.setItem('userData', JSON.stringify(userDataToStore));
      localStorage.setItem('user_data', JSON.stringify(userDataToStore));
      dispatch(setAuthData(userDataToStore));
      toast.success(`Logged in as @${usernameFromUrl} (Admin Impersonation)`);

      navigate('/', { replace: true });
      return;
    }

    const mobileFromUrl = params.get('mobile') || '';

    if (mobileFromUrl) {
      setFormData(prev => ({
        ...prev,
        mobile: mobileFromUrl || prev.mobile,
      }));

      // Clear any existing field errors when URL provides values
      setErrors(prev => ({
        ...prev,
        mobile: '',
      }));
    }
  }, [location.search]);

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
    const newErrors = { mobile: '', otp: '' };

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
      valid = false;
    }

    if (step === 2) {
      if (!formData.otp.trim()) {
        newErrors.otp = 'OTP is required';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (step === 1) {
        const data = await sendOtp({ mobile: formData.mobile });
        if (data.error === false) {
          setStep(2);
          toast.success('OTP sent successfully');
        } else {
          throw new Error(data.error || 'Failed to send OTP');
        }
      } else {
        const data = await loginUser({
          mobile: formData.mobile,
          otp: formData.otp,
          captcha_token: turnstileToken || undefined
        });

        if (data.error === false) {
          // Persist full user payload (including projects) for backward compatibility
          const projects = Array.isArray(data.projects) ? data.projects : [];

          // Base object to store (without selected project for now)
          let userDataToStore = {
            ...data,
            selected_project_id: null
          };

          // If no projects at all, just store and redirect to projects page
          if (projects.length === 0) {
            localStorage.setItem('userData', JSON.stringify(userDataToStore));
            dispatch(setAuthData(userDataToStore));
            toast.success('Login successful, but no projects found.');
            setTimeout(() => {
              toast.dismiss();
              navigate('/projects');
            }, 800);
            return;
          }

          // If there is exactly one project, auto-select it and redirect
          if (projects.length === 1) {
            const onlyProjectId = projects[0]?.project_id || null;
            userDataToStore = {
              ...userDataToStore,
              selected_project_id: onlyProjectId
            };

            localStorage.setItem('userData', JSON.stringify(userDataToStore));
            dispatch(setAuthData(userDataToStore));
            if (onlyProjectId) {
              dispatch(setSelectedProjectId(onlyProjectId));
            }

            toast.loading('Redirecting...');
            setTimeout(() => {
              toast.dismiss();
              navigate('/'); // Navigate to Home directly
            }, 1500);
            return;
          }

          // More than one project → open SwitchProjectModal (same as Menu) for selection
          localStorage.setItem('userData', JSON.stringify(userDataToStore));
          dispatch(setAuthData(userDataToStore));
          setLoginProjects(projects);
          setShowProjectModal(true);
          toast.success('Login successful. Please choose a project.');
        } else {
          throw new Error(data.error || 'Something went wrong');
        }
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        global: error.message || 'An error occurred'
      }));
      setShowGlobalError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    if (!project) return;

    const selectedId = project.project_id || project.id || null;
    if (!selectedId) return;

    try {
      const stored = localStorage.getItem('userData');
      const parsed = stored ? JSON.parse(stored) : {};
      const updated = {
        ...parsed,
        selected_project_id: selectedId
      };

      localStorage.setItem('userData', JSON.stringify(updated));
      dispatch(setSelectedProjectId(selectedId));
      dispatch(setAuthData(updated));
    } catch (error) {
      console.error('Failed to set selected project', error);
    }

    setShowProjectModal(false);
    toast.success('Redirecting...');
    setTimeout(() => {
      toast.dismiss();
      navigate('/');
    }, 500);
  };

  // Handle Google Login Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);

    try {
      // Decode the JWT token to get user info
      const decoded = jwtDecode(credentialResponse.credential);

      // Prepare payload for your backend
      const payload = {
        google_token: credentialResponse.credential,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };

      // Encrypt and send to your backend
      const { data, key } = Encrypt(payload);

      let data_pass = JSON.stringify({
        "data": data,
        "key": key
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${API_BASE_URL}/account/google-login`, // You'll need to create this endpoint
        headers: {
          'Content-Type': 'application/json'
        },
        data: data_pass
      };

      const response = await axios.request(config);
      const responseData = response.data;


      if (responseData.error) {
        throw new Error(responseData.error || "Google login failed");
      } else {
        localStorage.setItem("userData", JSON.stringify(responseData));
        toast.success('Google login successful!');
        setTimeout(() => {
          toast.dismiss();
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrors((prev) => ({
        ...prev,
        global: error.message || "Google login failed"
      }));
      setShowGlobalError(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Google Login Failure
  const handleGoogleError = () => {
    setErrors((prev) => ({
      ...prev,
      global: "Google login failed. Please try again."
    }));
    setShowGlobalError(true);
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

          {isGoogleAuthEnabled() && (
            <>
              <div className="mb-6">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="continue_with"
                />
                {isGoogleLoading && (
                  <div className="text-center mt-2">
                    <div className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in with Google...
                    </div>
                  </div>
                )}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="Enter your mobile number"
              />
              <AnimatePresence>
                {errors.mobile && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.mobile}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            )}

            {step === 2 && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                OTP
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.otp ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                placeholder="Enter OTP"
              />
              <AnimatePresence>
                {errors.otp && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.otp}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="mt-2 text-sm text-right">
                <button type="button" onClick={() => setStep(1)} className="font-medium text-indigo-600 hover:text-indigo-500">
                  Change Number
                </button>
              </div>
            </div>
            )}

            {turnstileSiteKey ? (
              <div className="flex justify-center">
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                  options={{
                    theme: 'light',
                    size: 'normal'
                  }}
                />
              </div>
            ) : null}

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
                    Processing...
                  </>
                ) : (step === 1 ? 'Send OTP' : 'Sign in')}
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

          <LegalLinks className="mt-6 pt-4 border-t border-gray-100" />
        </div>
      </motion.div>
      <Toaster />

      {/* Project selection modal - same as Menu's Switch Project */}
      <SwitchProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSelectCompany={handleProjectSelect}
        companies={loginProjects}
      />
    </div>
  );
};

export default Login;