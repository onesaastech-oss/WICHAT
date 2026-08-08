import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { Header, Sidebar } from '../component/Menu';
import { fetchProjectInfo } from '../store/projectSlice';
import { Encrypt } from './encryption/payload-encryption';
import {
    FiArrowLeft, FiShield, FiLock, FiEdit2, FiPlus, FiTrash2,
    FiChevronDown, FiChevronUp, FiMessageSquare, FiInfo, FiFileText, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ─── Helpers ─────────────────────────────────────────────── */

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const SECTION_TYPES = [
    { value: 'qa', label: 'Q & A', icon: FiMessageSquare, color: 'emerald', description: 'Question and Answer pairs' },
    { value: 'info', label: 'Key-Value', icon: FiInfo, color: 'blue', description: 'Label and value pairs' },
    { value: 'text', label: 'Free Text', icon: FiFileText, color: 'amber', description: 'Free-form text content' }
];

const TYPE_COLORS = {
    qa: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', light: 'bg-emerald-50' },
    info: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
    text: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' }
};

const createEmptyItem = (type) => {
    const id = generateId();
    switch (type) {
        case 'qa': return { id, question: '', answer: '' };
        case 'info': return { id, label: '', value: '' };
        case 'text': return { id, content: '' };
        default: return { id, question: '', answer: '' };
    }
};

const createEmptySection = (type = 'qa') => ({
    id: generateId(),
    title: '',
    type,
    items: [createEmptyItem(type)],
    collapsed: false
});

/** Parse a context string (JSON or legacy plain text) into sections array */
const parseContextToSections = (contextStr) => {
    if (!contextStr) return [];
    try {
        const parsed = JSON.parse(contextStr);
        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            return parsed.sections.map(s => ({ ...s, collapsed: false }));
        }
    } catch (_) { }
    // Legacy plain text fallback — wrap in a single text section
    return [{
        id: generateId(),
        title: 'General Context',
        type: 'text',
        items: [{ id: generateId(), content: contextStr }],
        collapsed: false
    }];
};

/** Serialize sections array to a JSON string for storage */
const serializeSectionsToJSON = (sections) => {
    // Strip UI-only fields (collapsed) before persisting
    const clean = sections.map(({ collapsed, ...rest }) => rest);
    return JSON.stringify({ sections: clean });
};

/* ─── Local-storage helpers (reuse ProjectConfig key) ───── */

const PROJECT_CONFIG_STORAGE_KEY = (projectId) => `project_config_${projectId}`;

const getStoredConfig = (projectId) => {
    try {
        const raw = localStorage.getItem(PROJECT_CONFIG_STORAGE_KEY(projectId));
        if (!raw) return { companyContext: '' };
        const parsed = JSON.parse(raw);
        return { companyContext: parsed?.companyContext || '' };
    } catch { return { companyContext: '' }; }
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

/* ─── Component ───────────────────────────────────────────── */

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
    const [sections, setSections] = useState([]);
    const [originalSections, setOriginalSections] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
        if (!userData) { setIsLoading(false); return; }
        try {
            const parsed = JSON.parse(userData);
            const id = parsed?.selected_project_id || parsed?.projects?.list?.[0]?.project_id || '';
            setProjectId(id);
            if (id) {
                const stored = getStoredConfig(id);
                const parsed2 = parseContextToSections(stored.companyContext);
                setSections(parsed2);
                setOriginalSections(JSON.parse(JSON.stringify(parsed2)));
            }
        } catch (_) { }
        setIsLoading(false);
    }, []);

    // Fetch context from server
    useEffect(() => {
        if (!projectId || !isOwner) { setIsLoading(false); return; }
        let cancelled = false;
        const fetchSettings = async () => {
            const userDataRaw = localStorage.getItem('userData');
            let token = '', username = '';
            try {
                const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
                token = parsed?.token || '';
                username = parsed?.username || '';
            } catch (_) { }
            if (!token || !username) { setIsLoading(false); return; }
            try {
                const payload = { project_id: projectId };
                const { data, key } = Encrypt(payload);
                const response = await axios.post(
                    `${API_BASE_URL}/bot-reply/get-settings`,
                    JSON.stringify({ data, key }),
                    { headers: { token, username, 'Content-Type': 'application/json' } }
                );
                if (cancelled) return;
                if (response?.data?.error) {
                    const stored = getStoredConfig(projectId);
                    const p = parseContextToSections(stored.companyContext);
                    setSections(p);
                    setOriginalSections(JSON.parse(JSON.stringify(p)));
                    return;
                }
                const ctx = response?.data?.data?.context || '';
                const p = parseContextToSections(ctx);
                setSections(p);
                setOriginalSections(JSON.parse(JSON.stringify(p)));
                updateStoredConfig(projectId, { companyContext: ctx });
            } catch (_) {
                if (!cancelled) {
                    const stored = getStoredConfig(projectId);
                    const p = parseContextToSections(stored.companyContext);
                    setSections(p);
                    setOriginalSections(JSON.parse(JSON.stringify(p)));
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        fetchSettings();
        return () => { cancelled = true; };
    }, [projectId, isOwner]);

    /* ─── Section & Item CRUD ─────────────────────────── */

    const addSection = useCallback((type = 'qa') => {
        setSections(prev => [...prev, createEmptySection(type)]);
    }, []);

    const removeSection = useCallback((sectionId) => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
    }, []);

    const updateSectionField = useCallback((sectionId, field, value) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
    }, []);

    const changeSectionType = useCallback((sectionId, newType) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, type: newType, items: [createEmptyItem(newType)] };
        }));
    }, []);

    const toggleSectionCollapse = useCallback((sectionId) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s));
    }, []);

    const addItem = useCallback((sectionId, type) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, items: [...s.items, createEmptyItem(type)] };
        }));
    }, []);

    const removeItem = useCallback((sectionId, itemId) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const filtered = s.items.filter(i => i.id !== itemId);
            return { ...s, items: filtered.length > 0 ? filtered : [createEmptyItem(s.type)] };
        }));
    }, []);

    const updateItemField = useCallback((sectionId, itemId, field, value) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
            };
        }));
    }, []);

    /* ─── Save / Cancel ───────────────────────────────── */

    const handleSave = async () => {
        if (!projectId) return;
        const userDataRaw = localStorage.getItem('userData');
        let token = '', username = '';
        try {
            const parsed = userDataRaw ? JSON.parse(userDataRaw) : null;
            token = parsed?.token || '';
            username = parsed?.username || '';
        } catch (_) { }
        if (!token || !username) {
            toast.error('Session expired. Please log in again.');
            return;
        }
        setIsSaving(true);
        try {
            const contextJSON = serializeSectionsToJSON(sections);
            const payload = { project_id: projectId, context: contextJSON };
            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                `${API_BASE_URL}/bot-reply/update-context`,
                JSON.stringify({ data, key }),
                { headers: { token, username, 'Content-Type': 'application/json' } }
            );
            if (response?.data?.error) {
                const errMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to update company context';
                toast.error(errMsg);
                return;
            }
            updateStoredConfig(projectId, { companyContext: contextJSON });
            setOriginalSections(JSON.parse(JSON.stringify(sections)));
            setIsEditing(false);
            toast.success(response?.data?.msg ?? 'Company context updated successfully');
        } catch (error) {
            toast.error(error?.response?.data?.error ?? 'Failed to update company context. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setSections(JSON.parse(JSON.stringify(originalSections)));
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setOriginalSections(JSON.parse(JSON.stringify(sections)));
        if (sections.length === 0) {
            setSections([createEmptySection('qa')]);
        }
        setIsEditing(true);
    };

    /* ─── Render helpers ──────────────────────────────── */

    const renderViewSection = (section) => {
        const typeConf = SECTION_TYPES.find(t => t.value === section.type) || SECTION_TYPES[0];
        const colors = TYPE_COLORS[section.type] || TYPE_COLORS.qa;
        const TypeIcon = typeConf.icon;

        return (
            <div key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                        <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{section.title || 'Untitled Section'}</h3>
                        <p className="text-xs text-slate-500">{typeConf.label} · {section.items?.length || 0} {section.items?.length === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>
                {/* Section body */}
                <div className="p-5 space-y-4">
                    {section.type === 'qa' && section.items?.map((item, idx) => (
                        <div key={item.id || idx} className={`rounded-lg ${colors.light} p-4 ${idx > 0 ? '' : ''}`}>
                            <div className="flex items-start gap-2.5 mb-2">
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">Q</span>
                                <p className="text-sm font-medium text-slate-800 leading-relaxed">{item.question || '—'}</p>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="text-xs font-bold text-sky-700 bg-sky-200 px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">A</span>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.answer || '—'}</p>
                            </div>
                        </div>
                    ))}
                    {section.type === 'info' && (
                        <div className="divide-y divide-slate-100">
                            {section.items?.map((item, idx) => (
                                <div key={item.id || idx} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                                    <span className="text-sm font-medium text-slate-500 min-w-[120px] flex-shrink-0">{item.label || '—'}</span>
                                    <span className="text-sm text-slate-800">{item.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {section.type === 'text' && section.items?.map((item, idx) => (
                        <pre key={item.id || idx} className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {item.content || '—'}
                        </pre>
                    ))}
                </div>
            </div>
        );
    };

    const renderEditSection = (section, sectionIdx) => {
        const typeConf = SECTION_TYPES.find(t => t.value === section.type) || SECTION_TYPES[0];
        const colors = TYPE_COLORS[section.type] || TYPE_COLORS.qa;
        const TypeIcon = typeConf.icon;

        return (
            <div key={section.id} className={`rounded-xl border ${colors.border} bg-white shadow-sm overflow-hidden transition-all`}>
                {/* Section header (edit) */}
                <div className={`px-5 py-4 ${colors.light} border-b ${colors.border} flex items-center gap-3`}>
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0`}>
                        <TypeIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
                        placeholder="Section title (e.g. FAQ, Contact Info...)"
                        className="flex-1 min-w-0 bg-white/70 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                    />
                    <select
                        value={section.type}
                        onChange={(e) => changeSectionType(section.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 flex-shrink-0"
                    >
                        {SECTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => toggleSectionCollapse(section.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition flex-shrink-0"
                        title={section.collapsed ? 'Expand' : 'Collapse'}
                    >
                        {section.collapsed ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                        title="Delete section"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Section items (collapsible) */}
                {!section.collapsed && (
                    <div className="p-5 space-y-4">
                        {section.items.map((item, itemIdx) => (
                            <div key={item.id} className="relative group">
                                {/* Remove item button */}
                                {section.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(section.id, item.id)}
                                        className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-white border border-slate-200 text-red-400 hover:text-red-600 hover:border-red-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove item"
                                    >
                                        <FiX className="w-3 h-3" />
                                    </button>
                                )}

                                {/* Q&A item */}
                                {section.type === 'qa' && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full mt-2 flex-shrink-0">Q</span>
                                            <input
                                                type="text"
                                                value={item.question}
                                                onChange={(e) => updateItemField(section.id, item.id, 'question', e.target.value)}
                                                placeholder="Enter question..."
                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                            />
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-xs font-bold text-sky-700 bg-sky-200 px-2 py-0.5 rounded-full mt-2 flex-shrink-0">A</span>
                                            <textarea
                                                value={item.answer}
                                                onChange={(e) => updateItemField(section.id, item.id, 'answer', e.target.value)}
                                                placeholder="Enter answer..."
                                                rows={2}
                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Info item */}
                                {section.type === 'info' && (
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => updateItemField(section.id, item.id, 'label', e.target.value)}
                                            placeholder="Label (e.g. Email)"
                                            className="w-1/3 min-w-[140px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                        />
                                        <input
                                            type="text"
                                            value={item.value}
                                            onChange={(e) => updateItemField(section.id, item.id, 'value', e.target.value)}
                                            placeholder="Value (e.g. support@company.com)"
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                        />
                                    </div>
                                )}

                                {/* Text item */}
                                {section.type === 'text' && (
                                    <textarea
                                        value={item.content}
                                        onChange={(e) => updateItemField(section.id, item.id, 'content', e.target.value)}
                                        placeholder="Enter free-form text content..."
                                        rows={4}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
                                    />
                                )}
                            </div>
                        ))}

                        {/* Add item button */}
                        <button
                            type="button"
                            onClick={() => addItem(section.id, section.type)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${colors.text} hover:underline transition`}
                        >
                            <FiPlus className="w-3.5 h-3.5" />
                            Add {section.type === 'qa' ? 'Q&A pair' : section.type === 'info' ? 'field' : 'text block'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    /* ─── Access denied ────────────────────────────────── */

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

    /* ─── Main render ──────────────────────────────────── */

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
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <FiShield className="w-7 h-7 text-sky-600" />
                                    Company Context
                                </h1>
                                <p className="mt-1 text-slate-600">
                                    Manage structured context sections used by the bot to answer FAQs and support queries.
                                </p>
                            </div>
                            {!isEditing && !isLoading && (
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

                    {/* Loading */}
                    {isLoading ? (
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 flex items-center justify-center">
                            <span className="inline-block h-6 w-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                            <span className="ml-3 text-sm text-slate-500">Loading context...</span>
                        </div>
                    ) : isEditing ? (
                        /* ─── EDIT MODE ─── */
                        <>
                            <div className="space-y-5">
                                {sections.map((section, idx) => renderEditSection(section, idx))}
                            </div>

                            {/* Add section buttons */}
                            <div className="mt-5 flex flex-wrap gap-2">
                                {SECTION_TYPES.map(t => {
                                    const Icon = t.icon;
                                    const colors = TYPE_COLORS[t.value];
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => addSection(t.value)}
                                            className={`inline-flex items-center gap-2 rounded-xl border-2 border-dashed ${colors.border} ${colors.light} px-4 py-2.5 text-sm font-medium ${colors.text} hover:shadow-sm transition`}
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            <Icon className="w-4 h-4" />
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Save / Cancel */}
                            <div className="mt-8 pt-6 border-t border-slate-200 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ─── VIEW MODE ─── */
                        <>
                            {sections.length > 0 ? (
                                <div className="space-y-5">
                                    {sections.map(renderViewSection)}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
                                    <FiShield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-sm text-slate-500 italic">No company context has been provided yet.</p>
                                    <p className="text-xs text-slate-400 mt-1">Click "Edit" to add structured sections for your bot's knowledge base.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContextConfig;
