import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import { getProjectMetaDetails } from '../api/auth'; // Assuming updateProfile exists, otherwise mock it
import {
    FiArrowLeft, FiSave, FiX, FiEdit2, FiGlobe, FiInfo,
    FiCheckCircle, FiAlertCircle, FiTrash2, FiPlus, FiCamera
} from 'react-icons/fi';

const ProjectDetails = () => {
    // --- Routing & UI State ---
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });
    
    // --- Data State ---
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    // --- Editing State ---
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        about: '',
        description: '',
        vertical: '',
        profile_picture_url: '',
        websites: []
    });

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Prevent background scrolling when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Logic to get ID (kept from your original code)
            const activeId = projectId || JSON.parse(localStorage.getItem('userData'))?.selected_project_id;
            
            if (!activeId) throw new Error("Project ID missing");

            const response = await getProjectMetaDetails({ project_id: activeId });
            
            if (response?.data) {
                setData(response.data);
                // Initialize form with fetched data
                setEditForm({
                    about: response.data.profile?.about || '',
                    description: response.data.profile?.description || '',
                    vertical: response.data.profile?.vertical || '',
                    profile_picture_url: response.data.profile?.profile_picture_url || '',
                    websites: response.data.profile?.websites || []
                });
            } else {
                setError(response.msg || "Failed to load data");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleSave = async () => {
        // Here you would call your update API
        console.log("Saving payload:", editForm);
        
        // Mocking an update for UI feedback
        setData(prev => ({
            ...prev,
            profile: { ...prev.profile, ...editForm }
        }));
        setIsEditing(false);
        // Add toast notification logic here
    };

    const handleWebsiteChange = (index, value) => {
        const newWebsites = [...editForm.websites];
        newWebsites[index] = value;
        setEditForm({ ...editForm, websites: newWebsites });
    };

    const addWebsite = () => setEditForm({ ...editForm, websites: [...editForm.websites, ''] });
    
    const removeWebsite = (index) => {
        const newWebsites = editForm.websites.filter((_, i) => i !== index);
        setEditForm({ ...editForm, websites: newWebsites });
    };

    // --- Sub-Components ---

    const StatusBadge = ({ status }) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border-green-200',
            green: 'bg-green-100 text-green-800 border-green-200',
            approved: 'bg-blue-100 text-blue-800 border-blue-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        const key = status?.toLowerCase();
        const style = colors[key] || 'bg-gray-100 text-gray-800 border-gray-200';

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} uppercase tracking-wide`}>
                {status}
            </span>
        );
    };

    const ReadOnlyField = ({ label, value }) => (
        <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || '-'}</dd>
        </div>
    );

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

            {/* Main content */}
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2"><FiAlertCircle /> {error}</div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* Page Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Profile</h1>
                                    <p className="text-sm text-gray-500">Manage your WhatsApp Business presence and settings.</p>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                                            >
                                                <FiSave /> Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-2"
                                        >
                                            <FiEdit2 /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* LEFT COL: Editable Profile Info */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        
                                        {/* Banner/Header of Card */}
                                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                                        <div className="px-6 pb-6">
                                            <div className="relative flex items-end -mt-12 mb-6">
                                                <div className="relative group">
                                                    <img 
                                                        src={isEditing ? editForm.profile_picture_url : data.profile.profile_picture_url} 
                                                        alt="Profile" 
                                                        className="h-24 w-24 rounded-xl border-4 border-white dark:border-gray-800 shadow-md object-cover bg-gray-200"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                                                    />
                                                    {isEditing && (
                                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                                            <FiCamera />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 mb-1">
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.project.wa_display_name}</h2>
                                                    <p className="text-sm text-gray-500">{data.profile.vertical}</p>
                                                </div>
                                            </div>

                                            {/* Form Inputs */}
                                            <div className="space-y-5">

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry / Vertical</label>
                                                        {isEditing ? (
                                                            <input 
                                                                type="text"
                                                                value={editForm.vertical}
                                                                onChange={(e) => setEditForm({...editForm, vertical: e.target.value})}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                        ) : (
                                                            <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile.vertical}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Text</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            maxLength={139} // WA Limit
                                                            value={editForm.about}
                                                            onChange={(e) => setEditForm({...editForm, about: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    ) : (
                                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile.about}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Description</label>
                                                    {isEditing ? (
                                                        <textarea 
                                                            rows={3}
                                                            value={editForm.description}
                                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    ) : (
                                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile.description}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Websites</label>
                                                    <div className="space-y-2">
                                                        {(isEditing ? editForm.websites : data.profile.websites).map((site, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <div className="relative flex-1">
                                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiGlobe /></div>
                                                                            <input 
                                                                                type="url"
                                                                                value={site}
                                                                                onChange={(e) => handleWebsiteChange(idx, e.target.value)}
                                                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                                            />
                                                                        </div>
                                                                        <button onClick={() => removeWebsite(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                                                                    </>
                                                                ) : (
                                                                    <a href={site} target="_blank" rel="noreferrer" className="flex items-center text-indigo-600 hover:underline">
                                                                        <FiGlobe className="mr-2" /> {site}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {isEditing && (
                                                            <button onClick={addWebsite} className="text-sm text-indigo-600 font-medium flex items-center gap-1 mt-2 hover:text-indigo-800">
                                                                <FiPlus /> Add Website
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COL: Read-Only Meta Data */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiInfo className="text-indigo-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Account Status</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-sm text-gray-500">Project Status</span>
                                                <StatusBadge status={data.project.status} />
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-sm text-gray-500">Quality Rating</span>
                                                <StatusBadge status={data.project.wa_quality_rating} />
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-sm text-gray-500">Display Name</span>
                                                <StatusBadge status={data.project.wa_display_name_status} />
                                            </div>
                                            <ReadOnlyField label="Messaging Tier" value={data.project.wa_messaging_tier} />
                                            <ReadOnlyField label="Daily Limit" value={data.project.daily_template_limit} />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiCheckCircle className="text-indigo-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Verification</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <ReadOnlyField label="WhatsApp Number" value={data.project.wa_number} />
                                            <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Business Manager</dt>
                                                <dd className="mt-1"><StatusBadge status={data.project.fb_business_manager_status} /></dd>
                                            </div>
                                            <div className="py-3">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">WA Official Account</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {data.project.is_whatsapp_verified ? (
                                                        <span className="flex items-center text-green-600"><FiCheckCircle className="mr-1"/> Verified</span>
                                                    ) : "Unverified"}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;