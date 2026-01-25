import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { changePassword } from '../api/auth';
import { 
    FiLock, FiEye, FiEyeOff, FiSave, FiAlertCircle, 
    FiCheckCircle, FiCheck, FiX 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChangePassword = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        old_password: false,
        new_password: false,
        confirm_password: false
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');

    // Password Strength State
    const [strength, setStrength] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false,
    });

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Validate password strength in real-time
    const validateStrength = (pass) => {
        setStrength({
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
        });
    };

    const isPasswordStrong = Object.values(strength).every(Boolean);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear API error when user starts typing
        if (apiError) {
            setApiError('');
        }
        
        if (field === 'new_password') {
            validateStrength(value);
            // Clear match error if user starts typing new password again
            if (formData.confirm_password && value === formData.confirm_password) {
                setErrors(prev => ({ ...prev, confirm_password: '' }));
            }
        }

        if (field === 'confirm_password') {
            if (formData.new_password && value !== formData.new_password) {
                setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
            } else {
                setErrors(prev => ({ ...prev, confirm_password: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear previous API errors
        setApiError('');
        
        if (!isPasswordStrong) {
            toast.error("Please meet all password requirements");
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match' }));
            return;
        }

        try {
            setLoading(true);
            const response = await changePassword({
                old_password: formData.old_password,
                new_password: formData.new_password
            });

            if (response && !response.error) {
                toast.success('Password updated successfully!');
                setFormData({ old_password: '', new_password: '', confirm_password: '' });
                setStrength({ length: false, upper: false, lower: false, number: false, special: false });
                setApiError('');
            } else {
                const errorMessage = response?.error || 'Failed to update password';
                setApiError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.error || 'A server error occurred';
            setApiError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Helper component for the strength indicators
    const StrengthIndicator = ({ met, text }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${met ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
            {met ? <FiCheck size={14} /> : <FiX size={14} />}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />

            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />

                <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400">Update your account credentials to stay secure.</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* API Error Display */}
                                {apiError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                                        <FiAlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-300">{apiError}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setApiError('')}
                                            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                        >
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.old_password ? 'text' : 'password'}
                                            value={formData.old_password}
                                            onChange={(e) => handleChange('old_password', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button type="button" onClick={() => setShowPasswords(p => ({...p, old_password: !p.old_password}))} className="absolute right-3 top-2.5 text-gray-400">
                                            {showPasswords.old_password ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-gray-100 dark:border-gray-700" />

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new_password ? 'text' : 'password'}
                                            value={formData.new_password}
                                            onChange={(e) => handleChange('new_password', e.target.value)}
                                            className={`w-full px-4 py-2 pr-10 border rounded-lg dark:bg-gray-700 dark:text-white outline-none transition-all ${
                                                isPasswordStrong ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500'
                                            }`}
                                            placeholder="Create a strong password"
                                        />
                                        <button type="button" onClick={() => setShowPasswords(p => ({...p, new_password: !p.new_password}))} className="absolute right-3 top-2.5 text-gray-400">
                                            {showPasswords.new_password ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>

                                    {/* Password Strength Checklist UI */}
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Strength Requirements</span>
                                            {isPasswordStrong && (
                                                <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    <FiCheckCircle /> SECURE
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
                                        
                                        {/* Progress Bar */}
                                        <div className="mt-4 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${isPasswordStrong ? 'bg-green-500' : 'bg-amber-500'}`}
                                                style={{ width: `${(Object.values(strength).filter(Boolean).length / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm_password ? 'text' : 'password'}
                                            value={formData.confirm_password}
                                            onChange={(e) => handleChange('confirm_password', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white outline-none transition-all ${
                                                errors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                                            }`}
                                            placeholder="Repeat new password"
                                        />
                                        <button type="button" onClick={() => setShowPasswords(p => ({...p, confirm_password: !p.confirm_password}))} className="absolute right-3 top-2.5 text-gray-400">
                                            {showPasswords.confirm_password ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && (
                                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><FiAlertCircle /> {errors.confirm_password}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !isPasswordStrong}
                                    className="w-full flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiSave className="mr-2" /> Update Password</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChangePassword;