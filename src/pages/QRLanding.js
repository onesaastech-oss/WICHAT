import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import {
    FiCheckCircle,
    FiAlertCircle,
    FiPhone,
    FiUser,
    FiMail,
    FiBriefcase,
    FiLock,
    FiArrowRight,
    FiShield,
    FiMessageSquare,
    FiRefreshCw,
    FiCheck,
    FiArrowLeft
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { validateQRCode, processScanAction } from '../api/qrcode';
import { setAuthData, setSelectedProjectId } from '../store/authSlice';

const QRLanding = () => {
    const { qr_id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Validation & Project state
    const [loadingProject, setLoadingProject] = useState(true);
    const [projectData, setProjectData] = useState(null);
    const [qrLabel, setQrLabel] = useState('');
    const [error, setError] = useState('');

    // Flow states: 'checking_auth' | 'input_mobile' | 'verify_otp' | 'success'
    const [flowStep, setFlowStep] = useState('checking_auth');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [existingUserInfo, setExistingUserInfo] = useState(null);

    // Form inputs
    const [formData, setFormData] = useState({
        mobile: '',
        name: '',
        email: '',
        firm_name: '',
        otp: '',
    });

    // Countdown for OTP resend
    const [resendTimer, setResendTimer] = useState(0);
    const timerRef = useRef(null);

    // Helper: update local stored session
    const saveSession = (data, targetProjectId) => {
        const userDataToStore = {
            token: data.token,
            username: data.username,
            profile: data.profile || null,
            projects: data.projects || [],
            project_count: data.project_count || (data.projects?.length ?? 1),
            selected_project_id: targetProjectId,
        };

        localStorage.setItem('userData', JSON.stringify(userDataToStore));
        localStorage.setItem('user_data', JSON.stringify(userDataToStore));

        dispatch(setAuthData(userDataToStore));
        dispatch(setSelectedProjectId(targetProjectId));
    };

    // 1. Initial QR Validation & Auto-Auth Check
    useEffect(() => {
        if (!qr_id) {
            setError('Invalid QR code link');
            setLoadingProject(false);
            return;
        }

        const initScan = async () => {
            setLoadingProject(true);
            setError('');

            try {
                // Step A: Validate QR Code
                const valRes = await validateQRCode(qr_id);

                if (valRes.error) {
                    setError(valRes.error);
                    setLoadingProject(false);
                    return;
                }

                setProjectData(valRes.project);
                setQrLabel(valRes.qr_label || '');

                // Step B: Check for existing login session in localStorage
                const stored = localStorage.getItem('userData') || localStorage.getItem('user_data');
                let existingUser = null;
                if (stored) {
                    try {
                        existingUser = JSON.parse(stored);
                    } catch (e) {
                        existingUser = null;
                    }
                }

                if (existingUser?.token && existingUser?.username) {
                    // Try auto-mapping existing session
                    const actionRes = await processScanAction({
                        qr_id,
                        token: existingUser.token,
                        username: existingUser.username,
                    });

                    if (!actionRes.error && actionRes.action === 'open_chatroom') {
                        saveSession(actionRes, actionRes.project_id);
                        setFlowStep('success');
                        toast.success(
                            actionRes.is_new_mapping
                                ? `Mapped to ${valRes.project.project_name}! Opening chatroom...`
                                : `Welcome back to ${valRes.project.project_name}!`
                        );
                        setTimeout(() => {
                            navigate('/live-chat', { replace: true });
                        }, 1200);
                        return;
                    }
                }

                // Not logged in or session expired -> Go to mobile entry
                setFlowStep('input_mobile');
            } catch (err) {
                console.error('Scan init error:', err);
                setError('Failed to connect. Please try scanning again.');
            } finally {
                setLoadingProject(false);
            }
        };

        initScan();
    }, [qr_id, navigate, dispatch]);

    // Timer effect for OTP resend
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timerRef.current);
    }, [resendTimer]);

    // Handle Mobile Submit -> Request OTP
    const handleMobileSubmit = async (e) => {
        e.preventDefault();
        const cleanMobile = formData.mobile.trim().replace(/\D/g, '');

        if (!cleanMobile || cleanMobile.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await processScanAction({
                qr_id,
                mobile: cleanMobile,
                country_code: '91',
            });

            if (res.error) {
                toast.error(res.error);
                return;
            }

            if (res.action === 'otp_sent') {
                setIsExistingUser(res.is_existing_user);
                if (res.user_info) {
                    setExistingUserInfo(res.user_info);
                    setFormData((prev) => ({
                        ...prev,
                        name: prev.name || res.user_info.name || '',
                        email: prev.email || res.user_info.email || '',
                        firm_name: prev.firm_name || res.user_info.firm_name || '',
                    }));
                }
                setFlowStep('verify_otp');
                setResendTimer(30);
                toast.success('OTP sent via SMS and WhatsApp!');
            }
        } catch (err) {
            toast.error('Failed to send OTP. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await processScanAction({
                qr_id,
                mobile: formData.mobile.trim().replace(/\D/g, ''),
                country_code: '91',
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                setResendTimer(30);
                toast.success('New OTP sent successfully!');
            }
        } catch (err) {
            toast.error('Could not resend OTP');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle OTP + Registration Submit -> Auto Register, Map & Open Chatroom
    const handleVerifyAndJoin = async (e) => {
        e.preventDefault();
        const cleanOtp = formData.otp.trim();

        if (!cleanOtp || cleanOtp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }

        if (!isExistingUser && !formData.name.trim()) {
            toast.error('Please enter your full name');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                qr_id,
                mobile: formData.mobile.trim().replace(/\D/g, ''),
                country_code: '91',
                otp: cleanOtp,
                name: formData.name.trim() || undefined,
                email: formData.email.trim() || undefined,
                firm_name: formData.firm_name.trim() || formData.name.trim() || undefined,
            };

            const res = await processScanAction(payload);

            if (res.error) {
                toast.error(res.error);
                return;
            }

            if (res.action === 'open_chatroom') {
                saveSession(res, res.project_id);
                setFlowStep('success');

                const welcomeMsg = res.is_new_user
                    ? `Account created! Welcome to ${res.project_name}!`
                    : `Welcome back to ${res.project_name}!`;

                toast.success(welcomeMsg);

                setTimeout(() => {
                    navigate('/live-chat', { replace: true });
                }, 1200);
            } else {
                toast.error('Unexpected response. Please try again.');
            }
        } catch (err) {
            toast.error('Verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between text-white selection:bg-indigo-500 selection:text-white p-4 sm:p-6 md:p-8">
            <Toaster position="top-center" />

            {/* Top Bar / Brand */}
            <header className="max-w-md mx-auto w-full flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
                        1C
                    </div>
                    <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        OneChatting
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300">
                    <FiShield className="text-emerald-400" size={12} />
                    <span>Verified Project QR</span>
                </div>
            </header>

            {/* Main Card */}
            <main className="max-w-md mx-auto w-full my-auto py-4">
                <div className="relative bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-800 shadow-2xl p-6 sm:p-8 overflow-hidden">
                    {/* Decorative Background Glows */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-y-16 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none translate-y-12 -translate-x-12" />

                    {/* Initial Loading */}
                    {loadingProject && (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mx-auto animate-pulse">
                                <FiRefreshCw className="text-indigo-400 animate-spin" size={28} />
                            </div>
                            <h2 className="text-lg font-bold text-white">Validating QR Code...</h2>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto">
                                Connecting you to the project chatroom. Please hold on a moment.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loadingProject && error && (
                        <div className="py-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                                <FiAlertCircle size={32} />
                            </div>
                            <h2 className="text-lg font-bold text-white">QR Code Not Available</h2>
                            <p className="text-xs text-gray-300 max-w-xs mx-auto">{error}</p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/30"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Active Flows */}
                    {!loadingProject && !error && projectData && (
                        <div>
                            {/* Project Header Banner */}
                            <div className="text-center mb-6">
                                <div className="relative inline-block mb-3">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-50" />
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold shadow-xl mx-auto">
                                        {projectData.profile_picture ? (
                                            <img
                                                src={projectData.profile_picture}
                                                alt={projectData.project_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span>{projectData.project_name?.charAt(0) || 'P'}</span>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-900">
                                        <FiCheckCircle size={13} className="text-white" />
                                    </div>
                                </div>

                                <h1 className="text-xl font-bold text-white mb-1">
                                    {projectData.project_name}
                                </h1>
                                {qrLabel && (
                                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1">
                                        {qrLabel}
                                    </span>
                                )}
                                <p className="text-xs text-gray-300 mt-1">
                                    Scan & Chat Support Portal
                                </p>
                            </div>

                            {/* SUCCESS STATE */}
                            {flowStep === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8 text-center space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                                        <FiCheck size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Connected Successfully!</h3>
                                    <p className="text-xs text-emerald-300">
                                        Redirecting to live chatroom...
                                    </p>
                                    <div className="flex justify-center">
                                        <FiRefreshCw className="animate-spin text-indigo-400" size={20} />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 1: MOBILE ENTRY */}
                            {flowStep === 'input_mobile' && (
                                <motion.form
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleMobileSubmit}
                                    className="space-y-4"
                                >
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 space-y-2">
                                        <p className="font-semibold text-white flex items-center gap-1.5">
                                            <FiMessageSquare className="text-indigo-400" /> Start Chatting Instantly
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            Enter your mobile number to connect with {projectData.project_name}. If you're new, your account will be set up automatically.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                                            Mobile Number
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 flex items-center gap-1 text-xs font-semibold text-indigo-300 border-r border-white/20 pr-2.5">
                                                <span>🇮🇳 +91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="98765 43210"
                                                value={formData.mobile}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        mobile: e.target.value.replace(/\D/g, ''),
                                                    })
                                                }
                                                className="w-full pl-24 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || formData.mobile.length < 10}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                                    >
                                        {isSubmitting ? (
                                            <FiRefreshCw className="animate-spin" size={16} />
                                        ) : (
                                            <>
                                                <span>Continue</span>
                                                <FiArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}

                            {/* STEP 2: OTP & QUICK REGISTRATION */}
                            {flowStep === 'verify_otp' && (
                                <motion.form
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleVerifyAndJoin}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setFlowStep('input_mobile')}
                                            className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 font-medium transition-colors"
                                        >
                                            <FiArrowLeft size={13} /> Change Mobile (+91 {formData.mobile})
                                        </button>
                                        <span className="text-[11px] text-gray-400 font-mono">
                                            {isExistingUser ? 'Existing User' : 'New Registration'}
                                        </span>
                                    </div>

                                    {/* Registration fields if user is brand new */}
                                    {!isExistingUser && (
                                        <div className="space-y-3 pt-1 border-t border-white/10">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                                    Full Name <span className="text-red-400">*</span>
                                                </label>
                                                <div className="relative flex items-center">
                                                    <FiUser className="absolute left-3.5 text-gray-400" size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="Your Name"
                                                        value={formData.name}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, name: e.target.value })
                                                        }
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                                                        Email (Optional)
                                                    </label>
                                                    <div className="relative flex items-center">
                                                        <FiMail className="absolute left-3 text-gray-400" size={12} />
                                                        <input
                                                            type="email"
                                                            placeholder="you@email.com"
                                                            value={formData.email}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, email: e.target.value })
                                                            }
                                                            className="w-full pl-8 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                                                        Firm / Business (Opt)
                                                    </label>
                                                    <div className="relative flex items-center">
                                                        <FiBriefcase className="absolute left-3 text-gray-400" size={12} />
                                                        <input
                                                            type="text"
                                                            placeholder="Company Name"
                                                            value={formData.firm_name}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, firm_name: e.target.value })
                                                            }
                                                            className="w-full pl-8 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* OTP Input */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                                                <FiLock size={12} className="text-indigo-400" />
                                                Enter 6-Digit OTP
                                            </label>
                                            {resendTimer > 0 ? (
                                                <span className="text-[11px] text-gray-400 font-mono">
                                                    Resend in {resendTimer}s
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={isSubmitting}
                                                    className="text-[11px] text-indigo-300 hover:text-indigo-200 underline font-medium"
                                                >
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="• • • • • •"
                                            value={formData.otp}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    otp: e.target.value.replace(/\D/g, ''),
                                                })
                                            }
                                            className="w-full py-3 text-center bg-white/10 border border-white/20 rounded-xl text-lg font-mono font-bold tracking-[0.4em] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || formData.otp.length !== 6}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                                    >
                                        {isSubmitting ? (
                                            <FiRefreshCw className="animate-spin" size={16} />
                                        ) : (
                                            <>
                                                <span>Verify & Start Chatting</span>
                                                <FiCheck size={16} />
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-md mx-auto w-full text-center py-2 text-[11px] text-gray-500">
                <span>End-to-end encrypted • WhatsApp Cloud Platform</span>
            </footer>
        </div>
    );
};

export default QRLanding;
