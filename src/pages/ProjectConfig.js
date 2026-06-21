import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Header, Sidebar } from '../component/Menu';
import { fetchProjectInfo } from '../store/projectSlice';
import { Encrypt } from './encryption/payload-encryption';
import { FiSettings, FiLock, FiZap, FiMessageSquare, FiBell, FiShield, FiBarChart2, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PROJECT_CONFIG_STORAGE_KEY = (projectId) => `project_config_${projectId}`;

const getStoredConfig = (projectId) => {
    try {
        const raw = localStorage.getItem(PROJECT_CONFIG_STORAGE_KEY(projectId));
        if (!raw) return { autoCaseCreate: false };
        const parsed = JSON.parse(raw);
        return {
            autoCaseCreate: Boolean(parsed?.autoCaseCreate ?? false)
        };
    } catch {
        return { autoCaseCreate: false };
    }
};

const setStoredConfig = (projectId, config) => {
    try {
        localStorage.setItem(PROJECT_CONFIG_STORAGE_KEY(projectId), JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save project config', e);
    }
};

function ProjectConfig() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isOwner = useSelector((state) => state.project?.owned ?? false);
    const projectInfo = useSelector((state) => state.project?.info);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [autoCaseCreate, setAutoCaseCreate] = useState(false);
    const [projectId, setProjectId] = useState(null);
    const [autoCaseCreateLoading, setAutoCaseCreateLoading] = useState(false);
    const [autoCaseCreateStatusLoading, setAutoCaseCreateStatusLoading] = useState(true);

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
        if (!userData) return;
        try {
            const parsed = JSON.parse(userData);
            const id = parsed?.selected_project_id || parsed?.projects?.list?.[0]?.project_id || '';
            setProjectId(id);
            if (id) setAutoCaseCreate(getStoredConfig(id).autoCaseCreate);
        } catch (_) { }
    }, []);

    useEffect(() => {
        if (!projectId || !isOwner) {
            setAutoCaseCreateStatusLoading(false);
            return;
        }
        let cancelled = false;
        const fetchStatus = async () => {
            const userDataRaw = localStorage.getItem('userData');
            let token = '';
            let username = '';
            try {
                const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
                token = parsed?.token || '';
                username = parsed?.username || '';
            } catch (_) { }
            if (!token || !username) {
                setAutoCaseCreateStatusLoading(false);
                return;
            }
            try {
                const payload = { project_id: projectId };
                const { data, key } = Encrypt(payload);
                const response = await axios.post(
                    `${API_BASE_URL}/project/auto-case-create-status`,
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
                    setAutoCaseCreate(getStoredConfig(projectId).autoCaseCreate);
                    return;
                }
                const status = Boolean(response?.data?.status);
                setAutoCaseCreate(status);
                setStoredConfig(projectId, { ...getStoredConfig(projectId), autoCaseCreate: status });
            } catch (_) {
                if (!cancelled) setAutoCaseCreate(getStoredConfig(projectId).autoCaseCreate);
            } finally {
                if (!cancelled) setAutoCaseCreateStatusLoading(false);
            }
        };
        fetchStatus();
        return () => { cancelled = true; };
    }, [projectId, isOwner]);

    const handleAutoCaseCreateChange = async (checked) => {
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
        setAutoCaseCreateLoading(true);
        try {
            const payload = {
                project_id: projectId,
                action: checked ? 'active' : 'deactive'
            };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/project/update-auto-case-create`,
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
                const errMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to update';
                toast.error(errMsg);
                return;
            }
            setAutoCaseCreate(checked);
            const prev = getStoredConfig(projectId);
            setStoredConfig(projectId, { ...prev, autoCaseCreate: checked });
            toast.success(response?.data?.msg ?? 'Auto case create updated successfully');
        } catch (error) {
            toast.error(error?.response?.data?.error ?? 'Failed to update. Please try again.');
        } finally {
            setAutoCaseCreateLoading(false);
        }
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
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Back to Dashboard
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
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FiSettings className="w-7 h-7 text-indigo-600" />
                            Project Configuration
                        </h1>
                        <p className="mt-1 text-slate-600">Manage settings for the selected project.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Auto Case Create - active card */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                                        <FiZap className="w-6 h-6" />
                                    </div>
                                    {autoCaseCreateStatusLoading ? (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <span className="inline-block h-5 w-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm font-medium">Loading...</span>
                                        </div>
                                    ) : (
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={autoCaseCreate}
                                                disabled={autoCaseCreateLoading}
                                                onChange={(e) => handleAutoCaseCreateChange(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-60" />
                                            <span className="ms-3 text-sm font-medium text-slate-700">{autoCaseCreateLoading ? '...' : (autoCaseCreate ? 'On' : 'Off')}</span>
                                        </label>
                                    )}
                                </div>
                                <h3 className="font-semibold text-slate-800 mt-4">Auto Case Create</h3>
                                <p className="text-sm text-slate-600 mt-1.5">Create a new case automatically based on your project rules.</p>
                            </div>
                        </div>

                        {/* Coming soon cards */}
                        {[
                            { icon: FiBell, title: 'Notification Preferences', desc: 'Choose how and when you get notified for new messages.' },
                            { icon: FiBarChart2, title: 'Analytics & Reports', desc: 'Enable dashboards and scheduled reports.' },
                            { icon: FiUserCheck, title: 'Agent Assignment Rules', desc: 'Auto-assign chats to agents by rules.' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden flex flex-col opacity-75 pointer-events-none">
                                    <div className="p-5 flex-1 relative">
                                        <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                                            Coming soon
                                        </span>
                                        <div className="p-2.5 rounded-xl bg-slate-200 text-slate-500">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-slate-700 mt-4">{item.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1.5">{item.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectConfig;
