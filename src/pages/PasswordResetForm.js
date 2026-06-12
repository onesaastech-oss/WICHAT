import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitPasswordResetWithToken } from '../api/auth';
import { Turnstile } from '@marsidev/react-turnstile';
import { FiCheck, FiX, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

const PasswordResetForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm_password: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [strength, setStrength] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileSiteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY || '0x4AAAAAACuMb3QQyxLqxHpe';

  const validateStrength = (pass) => {
    setStrength({
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    });
  };

  const isPasswordStrong = Object.values(strength).every(Boolean);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'password') {
      validateStrength(value);
      if (formData.confirm_password && value === formData.confirm_password) {
        setErrors(prev => ({ ...prev, confirm_password: '' }));
      }
    }

    if (field === 'confirm_password') {
      if (formData.password && value !== formData.password) {
        setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirm_password: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!isPasswordStrong) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
      return;
    }

    if (!turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }

    if (!token) {
      toast.error('Invalid or missing reset link');
      return;
    }

    setIsLoading(true);
    try {
      const response = await submitPasswordResetWithToken({
        token,
        password: formData.password,
        captcha_token: turnstileToken
      });

      if (response && response.error === false) {
        setSuccess(true);
        toast.success(response.msg || 'Password changed successfully');
        setTimeout(() => navigate('/login'), 2000);
      } else if (response && typeof response.error === 'string') {
        toast.error(response.error);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || 'Request failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const StrengthIndicator = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${met ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
      {met ? <FiCheck size={14} /> : <FiX size={14} />}
      <span>{text}</span>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Password changed successfully</h1>
          <p className="text-gray-600 mb-6">Redirecting you to login...</p>
          <Link
            to="/login"
            className="inline-block w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to login
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid reset link</h1>
          <p className="text-gray-600 mb-6">This link is invalid or has expired. Please request a new password reset.</p>
          <Link
            to="/reset-password"
            className="inline-block w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Request new reset link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Set new password</h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <span>
              <strong>Note:</strong> Changing your password will destroy all active sessions. You will be forced to log in again on all devices.
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <div className="relative">
              <input
                type={showPasswords.password ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  isPasswordStrong ? 'border-green-500' : errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(p => ({ ...p, password: !p.password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.password ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Strength requirements</span>
                {isPasswordStrong && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    SECURE
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                <StrengthIndicator met={strength.length} text="At least 8 characters" />
                <StrengthIndicator met={strength.upper} text="One uppercase letter" />
                <StrengthIndicator met={strength.lower} text="One lowercase letter" />
                <StrengthIndicator met={strength.number} text="One number" />
                <StrengthIndicator met={strength.special} text="One special character" />
              </div>
              <div className="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${isPasswordStrong ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${(Object.values(strength).filter(Boolean).length / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm_password ? 'text' : 'password'}
                id="confirm_password"
                value={formData.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(p => ({ ...p, confirm_password: !p.confirm_password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm_password ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <AnimatePresence>
              {errors.confirm_password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-red-500 text-sm mt-1 flex items-center gap-1"
                >
                  <FiAlertCircle size={14} /> {errors.confirm_password}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {turnstileSiteKey ? (
            <div className="flex justify-center">
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={t => setTurnstileToken(t)}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'light', size: 'normal' }}
              />
            </div>
          ) : null}

          <motion.button
            type="submit"
            disabled={isLoading || !isPasswordStrong}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
              isLoading || !isPasswordStrong ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </>
            ) : (
              'Change password'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordResetForm;
