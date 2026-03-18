import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header, Sidebar } from '../component/Menu';
import { Encrypt } from './encryption/payload-encryption';
import Pagination from '../component/Pagination';
import { FiAlertCircle, FiHash, FiPhone, FiFileText, FiUser, FiSearch, FiEye, FiEdit2, FiX, FiPlus } from 'react-icons/fi';

function OpenCaseList() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [casesByNumber, setCasesByNumber] = useState([]);
    const [pageNo, setPageNo] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPage, setTotalPage] = useState(1);
    const [search, setSearch] = useState('');

    // Case list modal state (shared structure with Conversation.js)
    const [showCaseListModal, setShowCaseListModal] = useState(false);
    const [caseModalNumber, setCaseModalNumber] = useState(null);
    const [caseModalContact, setCaseModalContact] = useState(null);
    const [caseList, setCaseList] = useState([]);
    const [caseListLoading, setCaseListLoading] = useState(false);
    const [caseListError, setCaseListError] = useState('');
    const [caseListPageNo, setCaseListPageNo] = useState(1);
    const [caseListLimit, setCaseListLimit] = useState(10);
    const [caseListTotal, setCaseListTotal] = useState(0);
    const [caseListTotalPage, setCaseListTotalPage] = useState(1);
    const [caseListSearch, setCaseListSearch] = useState('');
    const [caseListStatusFilter, setCaseListStatusFilter] = useState(''); // '' | 'open' | 'closed'

    // Edit case state (mirrors Conversation.js)
    const [showCaseEditModal, setShowCaseEditModal] = useState(false);
    const [caseEditRow, setCaseEditRow] = useState(null);
    const [caseEditName, setCaseEditName] = useState('');
    const [caseEditRemark, setCaseEditRemark] = useState('');
    const [caseEditStatus, setCaseEditStatus] = useState('open');
    const [caseEditLoading, setCaseEditLoading] = useState(false);
    const [caseEditError, setCaseEditError] = useState('');

    // Create case (with contact picker) state
    const [showCaseCreateModal, setShowCaseCreateModal] = useState(false);
    const [caseCreateSelectedContact, setCaseCreateSelectedContact] = useState(null); // { id, name, number, ... }
    const [caseCreateName, setCaseCreateName] = useState('');
    const [caseCreateRemark, setCaseCreateRemark] = useState('');
    const [caseCreateStatus, setCaseCreateStatus] = useState('open');
    const [caseCreateLoading, setCaseCreateLoading] = useState(false);
    const [caseCreateError, setCaseCreateError] = useState('');

    const [caseCreateContacts, setCaseCreateContacts] = useState([]);
    const [caseCreateContactsLoading, setCaseCreateContactsLoading] = useState(false);
    const [caseCreateContactsQuery, setCaseCreateContactsQuery] = useState('');
    const [caseCreateContactsPage, setCaseCreateContactsPage] = useState(1);
    const [caseCreateContactsTotalPages, setCaseCreateContactsTotalPages] = useState(1);

    const navigate = useNavigate();

    const formatShortDateTime = (value) => {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatOpenSince = (value) => {
        if (!value) return '-';
        const created = new Date(value);
        if (Number.isNaN(created.getTime())) return '-';
        const diffMs = Date.now() - created.getTime();
        if (diffMs < 0) return '0m';
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            setTokens(JSON.parse(userData));
        }
    }, []);

    const fetchOpenCases = useCallback(async (page = 1, overrides = {}) => {
        if (!tokens?.token || !tokens?.username) return;

        const selectedProjectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id;
        if (!selectedProjectId) {
            setError('No project selected. Please select a project to view cases.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const effectiveSearch = overrides.search !== undefined ? overrides.search : search;

            const payload = {
                project_id: selectedProjectId,
                page_no: page,
                limit
            };

            if (effectiveSearch && String(effectiveSearch).trim()) {
                payload.search = String(effectiveSearch).trim();
            }

            const { data, key } = Encrypt(payload);
            const response = await axios.post(
                'https://api.w1chat.com/message/open-case-list',
                JSON.stringify({ data, key }),
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response?.data?.error) {
                const err = response.data.error;
                if (typeof err === 'string') {
                    setError(err);
                } else {
                    setError(response.data.msg || 'Failed to get open case list');
                }
                setCasesByNumber([]);
                setTotal(0);
                setTotalPage(1);
                return;
            }

            const list = Array.isArray(response?.data?.data) ? response.data.data : [];
            const meta = response?.data?.meta || {};

            setCasesByNumber(list);
            setPageNo(meta.page_no || page);
            setTotal(Number(meta.total) || 0);
            setTotalPage(Number(meta.total_page) || 1);
        } catch (err) {
            setError('Failed to get open case list');
            setCasesByNumber([]);
            setTotal(0);
            setTotalPage(1);
        } finally {
            setLoading(false);
        }
    }, [tokens, limit, search]);

    // ----- Create case (contact picker + create form) -----
    const openCaseCreateModal = useCallback(() => {
        setCaseCreateSelectedContact(null);
        setCaseCreateName('');
        setCaseCreateRemark('');
        setCaseCreateStatus('open');
        setCaseCreateError('');
        setCaseCreateContacts([]);
        setCaseCreateContactsQuery('');
        setCaseCreateContactsPage(1);
        setCaseCreateContactsTotalPages(1);
        setShowCaseCreateModal(true);
    }, []);

    const closeCaseCreateModal = useCallback(() => {
        setShowCaseCreateModal(false);
        setCaseCreateSelectedContact(null);
        setCaseCreateName('');
        setCaseCreateRemark('');
        setCaseCreateStatus('open');
        setCaseCreateError('');
    }, []);

    const fetchContactsForCaseCreate = useCallback(async (page = 1, queryOverride) => {
        if (!tokens?.token || !tokens?.username) return;
        const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id;
        if (!projectId) return;

        setCaseCreateContactsLoading(true);
        try {
            const query = (queryOverride !== undefined ? queryOverride : caseCreateContactsQuery) || '';
            const payload = {
                project_id: projectId,
                page_no: page,
                limit: 10,
                query
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });
            const response = await axios.post(
                'https://api.w1chat.com/contact/contact-list',
                data_pass,
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response?.data?.error) {
                toast.error(response?.data?.message || response?.data?.error || 'Failed to load contacts');
                setCaseCreateContacts([]);
                setCaseCreateContactsTotalPages(1);
                return;
            }

            const list = response?.data?.data || [];
            const meta = response?.data?.meta || null;
            const mapped = list.map((c) => ({
                id: c.contact_id,
                name: c.name,
                number: c.number,
                firm_name: c.firm_name
            }));

            setCaseCreateContacts(mapped);
            setCaseCreateContactsPage(meta?.page_no ?? page);
            setCaseCreateContactsTotalPages(meta?.total_pages ?? 1);
        } catch (e) {
            toast.error('Failed to load contacts. Please try again.');
            setCaseCreateContacts([]);
            setCaseCreateContactsTotalPages(1);
        } finally {
            setCaseCreateContactsLoading(false);
        }
    }, [tokens?.token, tokens?.username, tokens?.selected_project_id, tokens?.projects, caseCreateContactsQuery]);

    useEffect(() => {
        if (!showCaseCreateModal) return;
        const t = setTimeout(() => {
            fetchContactsForCaseCreate(1);
        }, 250);
        return () => clearTimeout(t);
    }, [showCaseCreateModal, caseCreateContactsQuery, fetchContactsForCaseCreate]);

    const fetchCreateCase = useCallback(async () => {
        if (!tokens?.token || !tokens?.username) return;
        const projectId = tokens.selected_project_id || tokens.projects?.[0]?.project_id;
        const number = caseCreateSelectedContact?.number;

        if (!projectId || !number) {
            setCaseCreateError('Please select a contact');
            return;
        }

        const name = String(caseCreateName ?? '').trim();
        if (!name) {
            setCaseCreateError('Case name is required');
            return;
        }

        setCaseCreateLoading(true);
        setCaseCreateError('');
        try {
            const payload = {
                project_id: projectId,
                number,
                name,
                remark: String(caseCreateRemark ?? '').trim(),
                status: caseCreateStatus === 'closed' ? 'closed' : 'open'
            };
            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });
            const response = await axios.post(
                'https://api.w1chat.com/message/case-create',
                data_pass,
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response?.data?.error) {
                const errMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to create case';
                setCaseCreateError(errMsg);
                return;
            }
            toast.success(response?.data?.msg ?? 'Case created successfully');
            closeCaseCreateModal();
            fetchOpenCases(1, { search });
        } catch (error) {
            setCaseCreateError(error?.response?.data?.error ?? 'Failed to create case. Please try again.');
        } finally {
            setCaseCreateLoading(false);
        }
    }, [tokens?.token, tokens?.username, tokens?.selected_project_id, tokens?.projects, caseCreateSelectedContact, caseCreateName, caseCreateRemark, caseCreateStatus, closeCaseCreateModal, fetchOpenCases, search]);

    useEffect(() => {
        if (tokens) {
            fetchOpenCases(1);
        }
    }, [tokens, fetchOpenCases]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPage || newPage === pageNo) return;
        setPageNo(newPage);
        fetchOpenCases(newPage);
    };

    const getOpenCaseCount = (item) => {
        if (!Array.isArray(item?.cases)) return 0;
        return item.cases.filter(c => c.status === true || c.status === '0' || c.status === 0).length;
    };

    const fetchCaseListForNumber = useCallback(async (number, page = 1, overrides = {}) => {
        if (!tokens?.token || !tokens?.username || !tokens?.selected_project_id) return;
        if (!number) return;

        setCaseListLoading(true);
        setCaseListError('');

        try {
            const effectiveSearch = overrides.search !== undefined ? overrides.search : caseListSearch;
            const effectiveStatus = overrides.status !== undefined ? overrides.status : caseListStatusFilter;

            const payload = {
                project_id: tokens.selected_project_id || '',
                page_no: page,
                limit: Math.min(Math.max(caseListLimit, 1), 100),
                number: String(number).trim()
            };

            if (effectiveSearch && String(effectiveSearch).trim()) {
                payload.search = String(effectiveSearch).trim();
            }
            if (effectiveStatus === 'open' || effectiveStatus === 'closed') {
                payload.status = effectiveStatus;
            }

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });
            const response = await axios.post(
                'https://api.w1chat.com/message/case-list',
                data_pass,
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response?.data?.error) {
                setCaseListError(typeof response.data.error === 'string' ? response.data.error : (response.data.message || 'Failed to fetch case list'));
                setCaseList([]);
                setCaseListTotal(0);
                setCaseListTotalPage(1);
                return;
            }

            const list = response?.data?.data ?? [];
            const meta = response?.data?.meta ?? {};
            setCaseList(Array.isArray(list) ? list : []);
            setCaseListPageNo(meta.page_no ?? page);
            setCaseListTotal(Number(meta.total) || 0);
            setCaseListTotalPage(Number(meta.total_page) || 1);
        } catch (err) {
            setCaseListError('Failed to fetch case list. Please try again.');
            setCaseList([]);
            setCaseListTotal(0);
            setCaseListTotalPage(1);
        } finally {
            setCaseListLoading(false);
        }
    }, [tokens, caseListLimit, caseListSearch, caseListStatusFilter]);

    const openCaseModal = (item) => {
        setCaseModalNumber(item.number || '');
        setCaseModalContact(item.contact || null);
        setCaseList([]);
        setCaseListError('');
        setCaseListPageNo(1);
        setCaseListTotal(0);
        setCaseListTotalPage(1);
        setCaseListSearch('');
        setCaseListStatusFilter('');
        setShowCaseListModal(true);
        fetchCaseListForNumber(item.number, 1);
    };

    const closeCaseModal = () => {
        setShowCaseListModal(false);
    };

    const handleCaseListPageChange = (newPage) => {
        if (newPage < 1 || newPage > caseListTotalPage || newPage === caseListPageNo) return;
        setCaseListPageNo(newPage);
        fetchCaseListForNumber(caseModalNumber, newPage);
    };

    const handleCaseListPageSizeChange = (newSize) => {
        const size = Math.min(Math.max(newSize, 1), 100);
        setCaseListLimit(size);
        setCaseListPageNo(1);
        fetchCaseListForNumber(caseModalNumber, 1);
    };

    const openCaseEditModal = (row) => {
        setCaseEditRow(row);
        setCaseEditName(row?.name ?? '');
        setCaseEditRemark(row?.remark ?? '');
        setCaseEditStatus(row?.status === true || row?.status === '1' ? 'open' : 'closed');
        setCaseEditError('');
        setShowCaseEditModal(true);
    };

    const closeCaseEditModal = () => {
        setShowCaseEditModal(false);
        setCaseEditRow(null);
        setCaseEditName('');
        setCaseEditRemark('');
        setCaseEditError('');
    };

    const fetchEditCase = useCallback(async () => {
        if (!tokens?.token || !tokens?.username || !tokens?.selected_project_id || !caseEditRow) return;
        const caseId = caseEditRow.case_id ?? caseEditRow.id;
        if (!caseId) return;
        setCaseEditLoading(true);
        setCaseEditError('');
        try {
            const payload = {
                project_id: tokens.selected_project_id || '',
                case_id: caseId,
                name: String(caseEditName ?? '').trim(),
                remark: String(caseEditRemark ?? '').trim(),
                status: caseEditStatus === 'closed' ? 'closed' : 'open'
            };
            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });
            const response = await axios.post(
                'https://api.w1chat.com/message/case-edit',
                data_pass,
                {
                    headers: {
                        token: tokens.token,
                        username: tokens.username,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (response?.data?.error) {
                const errMsg = typeof response.data.error === 'string' ? response.data.error : 'Failed to update case';
                setCaseEditError(errMsg);
                return;
            }
            toast.success(response?.data?.msg ?? 'Case updated successfully');
            closeCaseEditModal();
            fetchCaseListForNumber(caseModalNumber, caseListPageNo);
        } catch (error) {
            setCaseEditError(error?.response?.data?.error ?? 'Failed to update case. Please try again.');
        } finally {
            setCaseEditLoading(false);
        }
    }, [tokens?.token, tokens?.username, tokens?.selected_project_id, caseEditRow, caseEditName, caseEditRemark, caseEditStatus, closeCaseEditModal, fetchCaseListForNumber, caseModalNumber, caseListPageNo]);

    return (
        <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-900">
            <Header
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            <main
                className={`pt-16 flex-1 overflow-auto transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'
                    } bg-slate-50 dark:bg-gray-900`}
            >
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                    Open Cases
                                </h1>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    List of numbers with at least one open case.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openCaseCreateModal}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                >
                                    <FiPlus className="h-4 w-4" />
                                    Create Case
                                </button>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Total Numbers with Open Cases:</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="relative w-full md:max-w-xs">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearch(value);
                                        setPageNo(1);
                                        fetchOpenCases(1, { search: value });
                                    }}
                                    placeholder="Search by number or contact name..."
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            <FiAlertCircle className="mt-0.5 h-4 w-4" />
                            <div>{error}</div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                        {/* Desktop style table similar to Transactions */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
                            <table className="w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-700/60">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <FiHash className="w-3.5 h-3.5 text-gray-400" />
                                                <div>S.No</div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-700/60">
                                            <div className="flex items-center gap-2">
                                                <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                                                <div>Number &amp; Contact</div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-700/60">
                                            <div className="flex items-center gap-2">
                                                <FiFileText className="w-3.5 h-3.5 text-gray-400" />
                                                <div>Cases</div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                            <div className="flex items-center justify-center gap-2">
                                                <FiEye className="w-3.5 h-3.5 text-gray-400" />
                                                <div>Actions</div>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 animate-spin border-t-transparent"></div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading open cases...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : casesByNumber.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-300 font-medium">No open cases found</p>
                                                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Open cases will appear here once available.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        casesByNumber.map((item, index) => {
                                            const sortedCases = Array.isArray(item.cases) && item.cases.length > 0
                                                ? [...item.cases].sort((a, b) => new Date(b.modify_date || b.create_date) - new Date(a.modify_date || a.create_date))
                                                : [];
                                            const contactName = (item?.contact?.name || '').toString().trim();
                                            const numberValue = (item?.number || '').toString().trim();
                                            const primaryTitle = contactName || numberValue || '-';
                                            const secondaryLine = contactName ? (numberValue || '-') : '';

                                            return (
                                                <tr
                                                    key={item.number || index}
                                                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all duration-150 group"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 text-center align-middle">
                                                        <div className="flex items-center justify-center">
                                                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 text-sm font-semibold">
                                                                {(pageNo - 1) * limit + index + 1}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/live-chat/${item.number || ''}`)}
                                                            className="flex items-center gap-3 text-left group cursor-pointer"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-wide">
                                                                    {primaryTitle}
                                                                </span>
                                                                {secondaryLine ? (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                        {secondaryLine}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-800 align-middle">
                                                        {sortedCases.length === 0 ? (
                                                            <div className="text-sm text-gray-700 dark:text-gray-200">-</div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                                {sortedCases.map((c, idx) => {
                                                                    const caseCreateDate = c?.create_date || c?.created_at || c?.createdAt || c?.created_date;
                                                                    return (
                                                                        <div
                                                                            key={c?.case_id || c?.id || `${item.number || 'n'}-${idx}`}
                                                                            className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 px-3 py-2"
                                                                        >
                                                                            <div className="text-sm text-gray-800 dark:text-gray-100 font-semibold">
                                                                                {c?.name || '-'}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                <span className="font-medium text-gray-600 dark:text-gray-300">Open since:</span>{' '}
                                                                                {formatOpenSince(caseCreateDate)}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                <span className="font-medium text-gray-600 dark:text-gray-300">Created:</span>{' '}
                                                                                {formatShortDateTime(caseCreateDate)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => openCaseModal(item)}
                                                            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-700 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-900/40 hover:bg-indigo-100 hover:border-indigo-300 dark:hover:bg-indigo-900/70 transition-colors"
                                                        >
                                                            <FiEye className="w-3.5 h-3.5" />
                                                            <span>View Cases</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Simple mobile fallback list */}
                        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            {loading ? (
                                <div className="p-4">
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2 animate-pulse" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-1 animate-pulse" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
                                </div>
                            ) : casesByNumber.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No open cases found.
                                </div>
                            ) : (
                                casesByNumber.map((item, index) => {
                                    const sortedCases = Array.isArray(item.cases) && item.cases.length > 0
                                        ? [...item.cases].sort((a, b) => new Date(b.modify_date || b.create_date) - new Date(a.modify_date || a.create_date))
                                        : [];
                                    const contactName = (item?.contact?.name || '').toString().trim();
                                    const numberValue = (item?.number || '').toString().trim();
                                    const primaryTitle = contactName || numberValue || '-';
                                    const secondaryLine = contactName ? (numberValue || '-') : '';

                                    return (
                                        <div key={item.number || index} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-100">
                                                        {(pageNo - 1) * limit + index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {primaryTitle}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {secondaryLine || (sortedCases?.[0]?.name || 'No case name')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {sortedCases.length === 0 ? (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">No cases</div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {sortedCases.map((c, idx) => {
                                                        const caseCreateDate = c?.create_date || c?.created_at || c?.createdAt || c?.created_date;
                                                        return (
                                                            <div
                                                                key={c?.case_id || c?.id || `${item.number || 'n'}-${idx}`}
                                                                className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 px-3 py-2"
                                                            >
                                                                <div className="text-sm text-gray-800 dark:text-gray-100 font-semibold">
                                                                    {c?.name || '-'}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="font-medium text-gray-600 dark:text-gray-300">Open since:</span>{' '}
                                                                    {formatOpenSince(caseCreateDate)}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="font-medium text-gray-600 dark:text-gray-300">Created:</span>{' '}
                                                                    {formatShortDateTime(caseCreateDate)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => openCaseModal(item)}
                                                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-700 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-900/40 hover:bg-indigo-100 hover:border-indigo-300 dark:hover:bg-indigo-900/70 transition-colors"
                                            >
                                                <FiEye className="w-3.5 h-3.5" />
                                                <span>View Cases</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination - Show only when not loading and has data */}
                        {!loading && !error && casesByNumber.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-gray-700 px-4 py-3 bg-slate-50/60 dark:bg-gray-900/40 flex items-center justify-between">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Page {pageNo} of {Math.max(totalPage, 1)} &middot; Total numbers: {total}
                                </div>
                                <Pagination
                                    currentPage={pageNo}
                                    totalPages={Math.max(totalPage, 1)}
                                    totalRecords={total}
                                    pageSize={limit}
                                    onPageChange={handlePageChange}
                                    showPageSizeSelector={false}
                                    showGoToPage={true}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Case Modal (contact picker + create form) */}
                {showCaseCreateModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create case</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Select a contact and create a new case.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeCaseCreateModal}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label="Close"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact picker */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Select contact</div>
                                        {caseCreateSelectedContact?.number && (
                                            <button
                                                type="button"
                                                onClick={() => setCaseCreateSelectedContact(null)}
                                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                                            >
                                                Change
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={caseCreateContactsQuery}
                                            onChange={(e) => {
                                                setCaseCreateContactsQuery(e.target.value);
                                                setCaseCreateContactsPage(1);
                                            }}
                                            placeholder="Search contacts..."
                                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 shadow-sm"
                                        />
                                    </div>

                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                        <div className="max-h-72 overflow-y-auto bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                            {caseCreateContactsLoading ? (
                                                <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading contacts...</div>
                                            ) : caseCreateContacts.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No contacts found.</div>
                                            ) : (
                                                caseCreateContacts.map((c) => {
                                                    const active = caseCreateSelectedContact?.id === c.id;
                                                    return (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => setCaseCreateSelectedContact(c)}
                                                            className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                                                active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                                            }`}
                                                        >
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {c?.name || c?.number || '-'}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {c?.name ? (c?.number || '-') : (c?.firm_name || '')}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                type="button"
                                                disabled={caseCreateContactsLoading || caseCreateContactsPage <= 1}
                                                onClick={() => {
                                                    const next = Math.max(1, (caseCreateContactsPage || 1) - 1);
                                                    setCaseCreateContactsPage(next);
                                                    fetchContactsForCaseCreate(next);
                                                }}
                                                className="text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                            >
                                                Prev
                                            </button>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Page {caseCreateContactsPage} / {Math.max(caseCreateContactsTotalPages, 1)}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={caseCreateContactsLoading || caseCreateContactsPage >= caseCreateContactsTotalPages}
                                                onClick={() => {
                                                    const next = Math.min(caseCreateContactsTotalPages, (caseCreateContactsPage || 1) + 1);
                                                    setCaseCreateContactsPage(next);
                                                    fetchContactsForCaseCreate(next);
                                                }}
                                                className="text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>

                                    {caseCreateSelectedContact?.number && (
                                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/20 px-3 py-2">
                                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Selected</div>
                                            <div className="text-sm text-emerald-900 dark:text-emerald-100 font-semibold">
                                                {caseCreateSelectedContact?.name || caseCreateSelectedContact?.number}
                                            </div>
                                            <div className="text-xs text-emerald-700 dark:text-emerald-300">
                                                {caseCreateSelectedContact?.number}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Create form (same structure as Conversation.js create case modal) */}
                                <div className="space-y-4">
                                    {caseCreateError && (
                                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                            {caseCreateError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={caseCreateName}
                                            onChange={(e) => setCaseCreateName(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Case name"
                                            disabled={caseCreateLoading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remark</label>
                                        <textarea
                                            value={caseCreateRemark}
                                            onChange={(e) => setCaseCreateRemark(e.target.value)}
                                            rows={3}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                            placeholder="Remark"
                                            disabled={caseCreateLoading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                            <button
                                                type="button"
                                                onClick={() => setCaseCreateStatus('open')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    caseCreateStatus === 'open'
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                                disabled={caseCreateLoading}
                                            >
                                                Open
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCaseCreateStatus('closed')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    caseCreateStatus === 'closed'
                                                        ? 'bg-green-500 text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                                disabled={caseCreateLoading}
                                            >
                                                Closed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeCaseCreateModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                                    disabled={caseCreateLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={fetchCreateCase}
                                    disabled={caseCreateLoading || !caseCreateSelectedContact?.number}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {caseCreateLoading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        'Create'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Case List Modal - table + pagination (mirrors Conversation.js) */}
                {showCaseListModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FiFileText className="w-4 h-4 text-indigo-500" />
                                        Case List
                                    </h3>
                                    {caseModalNumber && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Number: <span className="font-mono">{caseModalNumber}</span>
                                        </p>
                                    )}
                                    {caseModalContact?.name && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                            <FiUser className="w-3 h-3" />
                                            <span>{caseModalContact.name}</span>
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={closeCaseModal}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label="Close"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-gray-700">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={caseListSearch}
                                    onChange={(e) => setCaseListSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchCaseListForNumber(caseModalNumber, 1, { search: caseListSearch, status: caseListStatusFilter })}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
                                />
                                <select
                                    value={caseListStatusFilter}
                                    onChange={(e) => {
                                        setCaseListStatusFilter(e.target.value);
                                        fetchCaseListForNumber(caseModalNumber, 1, { search: caseListSearch, status: e.target.value });
                                    }}
                                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All status</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => fetchCaseListForNumber(caseModalNumber, 1, { search: caseListSearch, status: caseListStatusFilter })}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    Search
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto min-h-0">
                                {caseListError && (
                                    <div className="px-6 py-4 text-sm text-red-600 dark:text-red-400">{caseListError}</div>
                                )}
                                {caseListLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full divide-y divide-gray-200 dark:divide-gray-600">
                                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30">
                                                <tr>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600">
                                                        #
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600">
                                                        Create date
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600">
                                                        Remark
                                                    </th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200/50 dark:border-gray-600">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                        Edit
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                                {caseList.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-3">
                                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No cases found</p>
                                                                <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting filters or search.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    caseList.map((row, index) => {
                                                        const createDate = row.created_at ?? row.create_date ?? row.created_date ?? row.createdAt;
                                                        const createDateStr = createDate
                                                            ? (typeof createDate === 'string'
                                                                ? new Date(createDate)
                                                                : new Date(createDate)
                                                            ).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })
                                                            : '—';
                                                        return (
                                                            <tr key={row.id ?? row.case_id ?? index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-700 text-center text-sm text-gray-700 dark:text-gray-300">
                                                                    {(caseListPageNo - 1) * caseListLimit + index + 1}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white">
                                                                    {row.name ?? '—'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                                                                    {createDateStr}
                                                                </td>
                                                                <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={row.remark ?? ''}>
                                                                    {row.remark ?? '—'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100 dark:border-gray-700 text-center">
                                                                    <span
                                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${row.status === true || row.status === '1'
                                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                                                                            : 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                                                        }`}
                                                                    >
                                                                        {row.status === true || row.status === '1' ? 'Open' : 'Closed'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCaseEditModal(row)}
                                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-medium text-sm transition-colors"
                                                                        title="Edit case"
                                                                    >
                                                                        <FiEdit2 className="w-4 h-4" />
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Pagination - same behavior as in Conversation.js */}
                            {!caseListLoading && caseList.length > 0 && (
                                <Pagination
                                    currentPage={caseListPageNo}
                                    totalPages={caseListTotalPage}
                                    totalRecords={caseListTotal}
                                    pageSize={caseListLimit}
                                    onPageChange={handleCaseListPageChange}
                                    onPageSizeChange={handleCaseListPageSizeChange}
                                    pageSizeOptions={[10, 20, 50]}
                                    showPageSizeSelector={true}
                                    showGoToPage={true}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Edit Case Modal - same structure as Conversation.js */}
                {showCaseEditModal && caseEditRow && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit case</h3>
                                <button
                                    type="button"
                                    onClick={closeCaseEditModal}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    aria-label="Close"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                {caseEditError && (
                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                        {caseEditError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={caseEditName}
                                        onChange={(e) => setCaseEditName(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Case name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Remark
                                    </label>
                                    <textarea
                                        value={caseEditRemark}
                                        onChange={(e) => setCaseEditRemark(e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="Remark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                        <button
                                            type="button"
                                            onClick={() => setCaseEditStatus('open')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${caseEditStatus === 'open'
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCaseEditStatus('closed')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${caseEditStatus === 'closed'
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            Closed
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeCaseEditModal}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={fetchEditCase}
                                    disabled={caseEditLoading}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {caseEditLoading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </span>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default OpenCaseList;

