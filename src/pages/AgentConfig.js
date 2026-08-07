import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Header, Sidebar } from '../component/Menu';
import { fetchProjectInfo } from '../store/projectSlice';
import { Encrypt } from './encryption/payload-encryption';
import { FiArrowLeft, FiShield, FiLock, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

function AgentConfig() {
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
    const [isLoading, setIsLoading] = useState(true);
    
    const [agentUsePersonalKey, setAgentUsePersonalKey] = useState(true);
    const [apiKeys, setApiKeys] = useState([]);
    
    const [agentProvider, setAgentProvider] = useState('gemini');
    const [agentModel, setAgentModel] = useState('gemini-1.5-flash');
    const [agentApiKey, setAgentApiKey] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);

    const agentModelsByProvider = {
        gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-mini', 'gemini-1.0'],
        claude: ['claude-3-5-sonnet-latest', 'claude-3-5-mini', 'claude-4-1', 'claude-4o'],
        openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-3.5-turbo'],
        groq: ['groq-1', 'groq-2', 'groq-2-small', 'groq-1.5']
    };

    const availableAgentProviders = [
        { value: 'gemini', label: 'Gemini' },
        { value: 'claude', label: 'Claude' },
        { value: 'openai', label: 'OpenAI' },
        { value: 'groq', label: 'Groq' }
    ];

    const getModelOptions = agentModelsByProvider[agentProvider] || agentModelsByProvider.gemini;

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
        } catch (_) { }
    }, []);

    const getAuthHeaders = () => {
        const userDataRaw = localStorage.getItem('userData');
        try {
            const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
            if (parsed?.token && parsed?.username) {
                return { token: parsed.token, username: parsed.username };
            }
        } catch (_) { }
        return null;
    };

    const fetchApiKeys = async () => {
        if (!projectId || !isOwner) return;
        const auth = getAuthHeaders();
        if (!auth) {
            setIsLoading(false);
            return;
        }

        try {
            const payload = { project_id: projectId };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/list-api-keys`,
                JSON.stringify({ data, key }),
                { headers: { ...auth, 'Content-Type': 'application/json' } }
            );

            if (!response?.data?.error && response?.data?.data) {
                setAgentUsePersonalKey(Boolean(response.data.data.agent_use_personal_key));
                setApiKeys(response.data.data.keys || []);
            }
        } catch (error) {
            console.error('Failed to fetch api keys', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectId && isOwner) {
            fetchApiKeys();
        } else if (!isOwner) {
            setIsLoading(false);
        }
    }, [projectId, isOwner]);

    const handleTogglePersonalKey = async (usePersonal) => {
        if (!projectId) return;
        const auth = getAuthHeaders();
        if (!auth) {
            toast.error('Session expired. Please log in again.');
            return;
        }

        try {
            const payload = { project_id: projectId, agent_use_personal_key: usePersonal };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/toggle-personal-key`,
                JSON.stringify({ data, key }),
                { headers: { ...auth, 'Content-Type': 'application/json' } }
            );

            if (response?.data?.error) {
                toast.error(typeof response.data.error === 'string' ? response.data.error : 'Failed to update setting');
                return;
            }
            
            setAgentUsePersonalKey(usePersonal);
            toast.success(response?.data?.msg || 'Updated successfully');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to update setting');
        }
    };

    const handleSaveApiKey = async () => {
        if (!projectId || !agentApiKey.trim()) return;
        const auth = getAuthHeaders();
        if (!auth) {
            toast.error('Session expired. Please log in again.');
            return;
        }

        setIsSavingKey(true);
        try {
            const payload = {
                project_id: projectId,
                api_provider: agentProvider,
                api_model: agentModel,
                api_key: agentApiKey
            };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/save-api-key`,
                JSON.stringify({ data, key }),
                { headers: { ...auth, 'Content-Type': 'application/json' } }
            );

            if (response?.data?.error) {
                toast.error(typeof response.data.error === 'string' ? response.data.error : 'Failed to save API key');
                return;
            }
            
            toast.success('API key saved successfully');
            setAgentApiKey(''); // reset input
            fetchApiKeys(); // refresh list
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save API key');
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleDeleteApiKey = async (keyUniqueId) => {
        if (!projectId || !keyUniqueId) return;
        const auth = getAuthHeaders();
        if (!auth) {
            toast.error('Session expired. Please log in again.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this API key?')) return;

        try {
            const payload = { project_id: projectId, key_unique_id: keyUniqueId };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/delete-api-key`,
                JSON.stringify({ data, key }),
                { headers: { ...auth, 'Content-Type': 'application/json' } }
            );

            if (response?.data?.error) {
                toast.error(typeof response.data.error === 'string' ? response.data.error : 'Failed to delete API key');
                return;
            }
            
            toast.success('API key deleted successfully');
            fetchApiKeys(); // refresh list
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to delete API key');
        }
    };

    // Ensure model resets if switching provider
    useEffect(() => {
        if (!getModelOptions.includes(agentModel)) {
            setAgentModel(getModelOptions[0]);
        }
    }, [agentProvider, getModelOptions, agentModel]);

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
                            <p className="text-slate-600 mb-6">Only the project admin can access agent configuration.</p>
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
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate('/project-config')}
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                Back to Project Config
                            </button>
                            <h1 className="text-2xl font-bold text-slate-800 mt-4">Agent Configuration</h1>
                            <p className="mt-1 text-slate-600">Configure the auto-reply agent provider and personal key settings.</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
                                        <FiShield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">Agent provider and key settings</h2>
                                        <p className="text-sm text-slate-500">Choose your provider and whether to use a personal API key.</p>
                                    </div>
                                </div>
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <span className="inline-block h-5 w-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePersonalKey(false)}
                                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${!agentUsePersonalKey ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        OneChat's
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePersonalKey(true)}
                                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${agentUsePersonalKey ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Personal
                                    </button>
                                </div>
                            </div>

                            {agentUsePersonalKey ? (
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <h3 className="text-md font-semibold text-slate-800 mb-4">Saved API Keys</h3>
                                    
                                    {apiKeys.length === 0 ? (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 mb-6 text-center">
                                            No personal API keys saved. Add one below to get started.
                                        </div>
                                    ) : (
                                        <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Provider</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Model</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">API Key</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-200">
                                                    {apiKeys.map((keyObj) => (
                                                        <tr key={keyObj.unique_id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 capitalize">
                                                                {keyObj.api_provider}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                                {keyObj.api_model}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                                {keyObj.api_key_masked}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => handleDeleteApiKey(keyObj.unique_id)}
                                                                    className="text-red-500 hover:text-red-700 transition p-1"
                                                                    title="Delete Key"
                                                                >
                                                                    <FiTrash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <h3 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <FiPlus className="w-4 h-4" /> Add New Key
                                    </h3>
                                    <div className="grid gap-6 md:grid-cols-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Provider</label>
                                            <select
                                                value={agentProvider}
                                                onChange={(e) => setAgentProvider(e.target.value)}
                                                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            >
                                                {availableAgentProviders.map((p) => (
                                                    <option key={p.value} value={p.value}>{p.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Model</label>
                                            <select
                                                value={agentModel}
                                                onChange={(e) => setAgentModel(e.target.value)}
                                                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            >
                                                {getModelOptions.map((modelOption) => (
                                                    <option key={modelOption} value={modelOption}>{modelOption}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">API Key</label>
                                            <input
                                                type="password"
                                                value={agentApiKey}
                                                onChange={(e) => setAgentApiKey(e.target.value)}
                                                placeholder="Enter your provider API key"
                                                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSaveApiKey}
                                            disabled={isSavingKey || !agentApiKey.trim()}
                                            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {isSavingKey ? 'Saving...' : 'Add API Key'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    OneChat will use its managed provider and default model for this agent. No model or provider key selection is required.
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AgentConfig;
