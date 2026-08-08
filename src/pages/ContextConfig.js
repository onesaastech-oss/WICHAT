import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Header, Sidebar } from '../component/Menu';
import { fetchProjectInfo } from '../store/projectSlice';
import { Encrypt } from './encryption/payload-encryption';
import { FiArrowLeft, FiShield, FiLock, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PROJECT_CONFIG_STORAGE_KEY = (projectId) => `project_config_${projectId}`;

const getStoredConfig = (projectId) => {
    try {
        const raw = localStorage.getItem(PROJECT_CONFIG_STORAGE_KEY(projectId));
        if (!raw) return { companyContext: '' };
        const parsed = JSON.parse(raw);
        return {
            companyContext: parsed?.companyContext || ''
        };
    } catch {
        return { companyContext: '' };
    }
};

const updateStoredConfig = (projectId, partialConfig) => {
    if (!projectId) return;
    try {
        const raw = localStorage.getItem(PROJECT_CONFIG_STORAGE_KEY(projectId));
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem(PROJECT_CONFIG_STORAGE_KEY(projectId), JSON.stringify({ ...prev, ...partialConfig }));
    } catch (e) {
        console.warn('Failed to save project config', e);
    }
};

function ContextConfig() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isOwner = useSelector((state) => state.project?.owned ?? false);
    const projectInfo = useSelector((state) => state.project?.info);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [projectId, setProjectId] = useState(null);
    const [companyContext, setCompanyContext] = useState('');
    const [originalContext, setOriginalContext] = useState('');
    const [isEditingContext, setIsEditingContext] = useState(false);
    const [companyContextLoading, setCompanyContextLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        if (projectInfo === null && dispatch) {
            dispatch(fetchProjectInfo());
        }
    }, [dispatch, projectInfo]);

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            setIsLoading(false);
            return;
        }
        try {
            const parsed = JSON.parse(userData);
            const id = parsed?.selected_project_id || parsed?.projects?.list?.[0]?.project_id || '';
            setProjectId(id);
            if (id) {
                const storedConfig = getStoredConfig(id);
                setCompanyContext(storedConfig.companyContext);
                setOriginalContext(storedConfig.companyContext);
            }
        } catch (_) { }
        setIsLoading(false);
    }, []);

    // Fetch context from server
    useEffect(() => {
        if (!projectId || !isOwner) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        const fetchSettings = async () => {
            const userDataRaw = localStorage.getItem('userData');
            let token = '';
            let username = '';
            try {
                const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
                token = parsed?.token || '';
                username = parsed?.username || '';
            } catch (_) { }
            if (!token || !username) {
                setIsLoading(false);
                return;
            }
            try {
                const payload = { project_id: projectId };
                const { data, key } = Encrypt(payload);
                const response = await axios.post(
                    `${API_BASE_URL}/bot-reply/get-settings`,
                    JSON.stringify({ data, key }),
                    {
                        headers: {
                            token,
                            username,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                if (cancelled) return;
                if (response?.data?.error) {
                    const stored = getStoredConfig(projectId);
                    setCompanyContext(stored.companyContext);
                    setOriginalContext(stored.companyContext);
                    return;
                }
                const responseData = response?.data?.data || {};
                const ctx = responseData.context || '';
                setCompanyContext(ctx);
                setOriginalContext(ctx);
                updateStoredConfig(projectId, { companyContext: ctx });
            } catch (_) {
                if (!cancelled) {
                    const stored = getStoredConfig(projectId);
                    setCompanyContext(stored.companyContext);
                    setOriginalContext(stored.companyContext);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchSettings();
        return () => { cancelled = true; };
    }, [projectId, isOwner]);

    const handleUpdateContext = async () => {
        if (!projectId) return;
        const userDataRaw = localStorage.getItem('userData');
        let token = '';
        let username = '';
        try {
            const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
            token = parsed?.token || '';
            username = parsed?.username || '';
        } catch (_) { }
        if (!token || !username) {
            toast.error('Session expired. Please log in again.');
            return;
        }
        setCompanyContextLoading(true);
        try {
            const payload = {
                project_id: projectId,
                context: companyContext
            };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/update-context`,
                JSON.stringify({ data, key }),
                {
                    headers: {
                        token,
                        username,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response?.data?.error) {
                const errMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to update company context';
                toast.error(errMsg);
                return;
            }
            updateStoredConfig(projectId, { companyContext });
            setOriginalContext(companyContext);
            setIsEditingContext(false);
            toast.success(response?.data?.msg ?? 'Company context updated successfully');
        } catch (error) {
            toast.error(error?.response?.data?.error ?? 'Failed to update company context. Please try again.');
        } finally {
            setCompanyContextLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setCompanyContext(originalContext);
        setIsEditingContext(false);
    };

    const handleStartEdit = () => {
        setOriginalContext(companyContext);
        setIsEditingContext(true);
    };

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
                <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
                <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                        <div className="max-w-2xl mx-auto mt-12 rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                            <FiLock className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Access denied</h2>
                            <p className="text-slate-600 mb-6">Only the project admin can access project configuration.</p>
                            <button
                                type="button"
                                onClick={() => navigate('/project-config')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Back to Project Config
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
            <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    {/* Back button + header */}
                    <div className="mb-8">
                        <button
                            type="button"
                            onClick={() => navigate('/project-config')}
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            Back to Project Config
                        </button>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <FiShield className="w-7 h-7 text-sky-600" />
                                    Company Context
                                </h1>
                                <p className="mt-1 text-slate-600">
                                    Update the company context used by the bot to answer FAQs and support queries.
                                </p>
                            </div>
                            {!isEditingContext && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleStartEdit}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 flex-shrink-0"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                    Edit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Context content */}
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <span className="inline-block h-6 w-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                    <span className="ml-3 text-sm text-slate-500">Loading context...</span>
                                </div>
                            ) : isEditingContext ? (
                                <>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Company Context
                                    </label>
                                    <textarea
                                        value={companyContext}
                                        onChange={(e) => setCompanyContext(e.target.value)}
                                        rows={12}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 resize-y"
                                        placeholder={"Q: What are your working hours?\nA: We work 9am to 6pm IST.\n\nQ: How can I contact support?\nA: Email us at support@company.com"}
                                    />
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleUpdateContext}
                                            disabled={companyContextLoading || !companyContext.trim()}
                                            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {companyContextLoading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={companyContextLoading}
                                            className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 min-h-[200px] max-h-[500px] overflow-y-auto">
                                    {companyContext ? (
                                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                                            {companyContext}
                                        </pre>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-400">
                                            <FiShield className="w-10 h-10 mb-3 text-slate-300" />
                                            <p className="text-sm italic">No company context has been provided yet.</p>
                                            <p className="text-xs mt-1">Click "Edit" to add your company's FAQ and context.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContextConfig;
