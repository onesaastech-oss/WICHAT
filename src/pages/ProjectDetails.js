import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import { getProjectMetaDetails, updateWabaProfilePicture, updateWabaProfileDetails, getEmbedSignupLink } from '../api/auth';
import axios from 'axios';
import {
    FiArrowLeft, FiSave, FiX, FiEdit2, FiGlobe, FiInfo,
    FiCheckCircle, FiAlertCircle, FiTrash2, FiPlus, FiCamera, FiExternalLink, FiRefreshCw
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
    const [successMessage, setSuccessMessage] = useState(null);
    const [isWabaConnected, setIsWabaConnected] = useState(true);
    const [isLoadingSignupLink, setIsLoadingSignupLink] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showManualRefresh, setShowManualRefresh] = useState(false);
    const syncIntervalRef = useRef(null);
    const pollCountRef = useRef(0);

    // --- Editing State ---
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const fileInputRef = useRef(null);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [originalProfilePictureUrl, setOriginalProfilePictureUrl] = useState('');
    const [editForm, setEditForm] = useState({
        about: '',
        description: '',
        vertical: '',
        address: '',
        email: '',
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

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Logic to get ID (kept from your original code)
            const activeId = projectId || JSON.parse(localStorage.getItem('userData'))?.selected_project_id;
            
            if (!activeId) throw new Error("Project ID missing");

            const response = await getProjectMetaDetails({ project_id: activeId });
            
            if (response?.data) {
                setData(response.data);
                // Check if WABA is connected
                const wabaConnected = response.data.is_waba_connected !== false;
                setIsWabaConnected(wabaConnected);
                
                // Only initialize form if profile exists (WABA is connected)
                if (wabaConnected && response.data.profile) {
                    const profilePictureUrl = response.data.profile?.profile_picture_url || '';
                    // Initialize form with fetched data
                    setEditForm({
                        about: response.data.profile?.about || '',
                        description: response.data.profile?.description || '',
                        vertical: response.data.profile?.vertical || '',
                        address: response.data.profile?.address || '',
                        email: response.data.profile?.email || '',
                        profile_picture_url: profilePictureUrl,
                        websites: response.data.profile?.websites || []
                    });
                    setOriginalProfilePictureUrl(profilePictureUrl);
                }
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
    const handleProfilePictureClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setIsUploadingPicture(true);
        setError(null);

        try {
            // Load tokens
            const stored = localStorage.getItem('userData');
            const parsed = stored ? JSON.parse(stored) : null;
            const token = parsed?.token;
            const username = parsed?.username;

            if (!token || !username) {
                throw new Error('Session expired ddd');
            }

            // Upload file first
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await axios.post(
                'https://api.w1chat.com/upload/upload-media',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'token': token,
                        'username': username
                    }
                }
            );

            if (uploadResponse?.data?.error) {
                throw new Error(uploadResponse.data.msg || 'Failed to upload image');
            }

            const imageUrl = uploadResponse?.data?.link;
            if (!imageUrl) {
                throw new Error('No image URL returned from upload');
            }

            // Update form with new image URL
            setEditForm(prev => ({
                ...prev,
                profile_picture_url: imageUrl
            }));
            setProfilePictureFile(file);

        } catch (err) {
            console.error('Error uploading profile picture:', err);
            setError(err.message || 'Failed to upload profile picture');
        } finally {
            setIsUploadingPicture(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const activeId = projectId || JSON.parse(localStorage.getItem('userData'))?.selected_project_id;
            if (!activeId) {
                throw new Error("Project ID missing");
            }

            // Get the latest profile data to ensure we have all current values
            const currentProfile = data?.profile || {};
            
            // Step 1: Update profile picture first if it has changed
            const profilePictureChanged = editForm.profile_picture_url !== originalProfilePictureUrl;
            if (profilePictureChanged && editForm.profile_picture_url) {
                try {
                    const pictureResponse = await updateWabaProfilePicture({
                        project_id: activeId,
                        profile_picture: editForm.profile_picture_url
                    });

                    if (pictureResponse?.error) {
                        throw new Error(pictureResponse.msg || 'Failed to update profile picture');
                    }
                } catch (err) {
                    console.error('Error updating profile picture:', err);
                    throw new Error(err.message || 'Failed to update profile picture');
                }
            }

            // Step 2: Update profile details
            // Always use current profile data as base, then override with editForm values if they're non-empty
            // This ensures all mandatory fields are provided even when updating just one field
            const payload = {
                project_id: activeId,
                // Use editForm value if it's a non-empty string, otherwise use current profile value
                // This allows updating one field while keeping others with their current values
                about: (editForm.about && editForm.about.trim() !== '') 
                    ? editForm.about 
                    : (currentProfile.about || ''),
                address: (editForm.address && editForm.address.trim() !== '') 
                    ? editForm.address 
                    : (currentProfile.address || ''),
                vertical: (editForm.vertical && editForm.vertical.trim() !== '') 
                    ? editForm.vertical 
                    : (currentProfile.vertical || ''),
                email: (editForm.email && editForm.email.trim() !== '') 
                    ? editForm.email 
                    : (currentProfile.email || ''),
                websites: (Array.isArray(editForm.websites) && editForm.websites.length > 0) 
                    ? editForm.websites 
                    : (Array.isArray(currentProfile.websites) ? currentProfile.websites : []),
                description: (editForm.description && editForm.description.trim() !== '') 
                    ? editForm.description 
                    : (currentProfile.description || '')
            };

            // Log payload for debugging
            console.log('Profile update payload:', payload);
            console.log('Current profile data:', currentProfile);
            console.log('Edit form data:', editForm);

            const detailsResponse = await updateWabaProfileDetails(payload);

            if (detailsResponse?.error) {
                throw new Error(detailsResponse.msg || 'Failed to update profile details');
            }

            // Update local state
            setData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    about: editForm.about,
                    description: editForm.description,
                    vertical: editForm.vertical,
                    address: editForm.address,
                    email: editForm.email,
                    profile_picture_url: editForm.profile_picture_url,
                    websites: editForm.websites
                }
            }));

            setOriginalProfilePictureUrl(editForm.profile_picture_url);
            setProfilePictureFile(null);
            setIsEditing(false);
            setSuccessMessage('Profile updated successfully');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (err) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setIsSaving(false);
        }
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

    const handleCancel = () => {
        // Reset form to original data
        if (data?.profile) {
            setEditForm({
                about: data.profile?.about || '',
                description: data.profile?.description || '',
                vertical: data.profile?.vertical || '',
                address: data.profile?.address || '',
                email: data.profile?.email || '',
                profile_picture_url: originalProfilePictureUrl,
                websites: data.profile?.websites || []
            });
        }
        setProfilePictureFile(null);
        setError(null);
        setSuccessMessage(null);
        setIsEditing(false);
    };

    const handleGetSignupLink = async () => {
        try {
            setIsLoadingSignupLink(true);
            setError(null);
            
            const activeId = projectId || JSON.parse(localStorage.getItem('userData'))?.selected_project_id;
            if (!activeId) {
                throw new Error("Project ID missing");
            }

            const response = await getEmbedSignupLink({ project_id: activeId });
            
            if (!response?.error && response?.url) {
                // Open the signup link in a new tab
                window.open(response.url, '_blank');
                
                // Start syncing after opening the link
                setIsSyncing(true);
                setIsLoadingSignupLink(false);
                setShowManualRefresh(false);
                
                // Reset poll count
                pollCountRef.current = 0;
                const maxPolls = 60; // 1 minute = 60 seconds / 3 seconds = 20 polls
                
                const pollConnectionStatus = async () => {
                    try {
                        const statusResponse = await getProjectMetaDetails({ project_id: activeId });
                        
                        if (statusResponse?.data) {
                            const wabaConnected = statusResponse.data.is_waba_connected !== false;
                            setIsWabaConnected(wabaConnected);
                            
                            // Update data if connected
                            if (wabaConnected) {
                                setData(statusResponse.data);
                                // Initialize form if profile exists
                                if (statusResponse.data.profile) {
                                    const profilePictureUrl = statusResponse.data.profile?.profile_picture_url || '';
                                    setEditForm({
                                        about: statusResponse.data.profile?.about || '',
                                        description: statusResponse.data.profile?.description || '',
                                        vertical: statusResponse.data.profile?.vertical || '',
                                        address: statusResponse.data.profile?.address || '',
                                        email: statusResponse.data.profile?.email || '',
                                        profile_picture_url: profilePictureUrl,
                                        websites: statusResponse.data.profile?.websites || []
                                    });
                                    setOriginalProfilePictureUrl(profilePictureUrl);
                                }
                                // Stop polling if connected
                                if (syncIntervalRef.current) {
                                    clearInterval(syncIntervalRef.current);
                                    syncIntervalRef.current = null;
                                }
                                setIsSyncing(false);
                                setShowManualRefresh(false);
                                setSuccessMessage('WhatsApp Business Account connected successfully!');
                                setTimeout(() => setSuccessMessage(null), 3000);
                                return;
                            }
                        }
                        
                        pollCountRef.current++;
                        
                        // Stop after 1 minute (20 polls)
                        if (pollCountRef.current >= maxPolls) {
                            if (syncIntervalRef.current) {
                                clearInterval(syncIntervalRef.current);
                                syncIntervalRef.current = null;
                            }
                            setIsSyncing(false);
                            setShowManualRefresh(true);
                        }
                    } catch (err) {
                        console.error('Error polling connection status:', err);
                        // Continue polling even if one request fails
                        pollCountRef.current++;
                        if (pollCountRef.current >= maxPolls) {
                            if (syncIntervalRef.current) {
                                clearInterval(syncIntervalRef.current);
                                syncIntervalRef.current = null;
                            }
                            setIsSyncing(false);
                            setShowManualRefresh(true);
                        }
                    }
                };
                
                // Start polling every 3 seconds
                syncIntervalRef.current = setInterval(pollConnectionStatus, 3000);
                // Also call immediately
                pollConnectionStatus();
            } else {
                throw new Error(response?.msg || 'Failed to get signup link');
            }
        } catch (err) {
            console.error('Error getting signup link:', err);
            setError(err.message || 'Failed to get signup link');
            setIsLoadingSignupLink(false);
            setIsSyncing(false);
        }
    };

    const handleManualRefresh = async () => {
        try {
            setIsSyncing(true);
            setShowManualRefresh(false);
            setError(null);
            
            const activeId = projectId || JSON.parse(localStorage.getItem('userData'))?.selected_project_id;
            if (!activeId) {
                throw new Error("Project ID missing");
            }

            const statusResponse = await getProjectMetaDetails({ project_id: activeId });
            
            if (statusResponse?.data) {
                const wabaConnected = statusResponse.data.is_waba_connected !== false;
                setIsWabaConnected(wabaConnected);
                
                // Update data if connected
                if (wabaConnected) {
                    setData(statusResponse.data);
                    // Initialize form if profile exists
                    if (statusResponse.data.profile) {
                        const profilePictureUrl = statusResponse.data.profile?.profile_picture_url || '';
                        setEditForm({
                            about: statusResponse.data.profile?.about || '',
                            description: statusResponse.data.profile?.description || '',
                            vertical: statusResponse.data.profile?.vertical || '',
                            address: statusResponse.data.profile?.address || '',
                            email: statusResponse.data.profile?.email || '',
                            profile_picture_url: profilePictureUrl,
                            websites: statusResponse.data.profile?.websites || []
                        });
                        setOriginalProfilePictureUrl(profilePictureUrl);
                    }
                    setIsSyncing(false);
                    setShowManualRefresh(false);
                    setSuccessMessage('WhatsApp Business Account connected successfully!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                } else {
                    setIsSyncing(false);
                    setShowManualRefresh(true);
                }
            } else {
                setIsSyncing(false);
                setShowManualRefresh(true);
            }
        } catch (err) {
            console.error('Error refreshing connection status:', err);
            setError(err.message || 'Failed to refresh connection status');
            setIsSyncing(false);
            setShowManualRefresh(true);
        }
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
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2"><FiAlertCircle /> {error}</div>
                    ) : successMessage ? (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-2"><FiCheckCircle /> {successMessage}</div>
                    ) : !isWabaConnected ? (
                        // WABA Not Connected - Show Signup Button
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Profile</h1>
                                    <p className="text-sm text-gray-500">Connect your WhatsApp Business Account to get started.</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="mb-6">
                                        <div className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                            <FiAlertCircle className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Business Account Not Connected</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            You need to connect your WhatsApp Business Account to manage your business profile and settings.
                                        </p>
                                    </div>
                                    
                                    {isSyncing ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <button
                                                disabled
                                                className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg disabled:opacity-100"
                                            >
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                            </button>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Updating/Syncing...
                                            </p>
                                        </div>
                                    ) : showManualRefresh ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                                                Connection status not updated. Please try refreshing manually.
                                            </p>
                                            <button
                                                onClick={handleManualRefresh}
                                                disabled={isSyncing}
                                                className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isSyncing ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Refreshing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiRefreshCw /> Refresh Status
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleGetSignupLink}
                                            disabled={isLoadingSignupLink}
                                            className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isLoadingSignupLink ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Getting Signup Link...
                                                </>
                                            ) : (
                                                <>
                                                    <FiExternalLink /> Get Signup Link
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Show project info even when WABA is not connected */}
                            {data?.project && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FiInfo className="text-indigo-500" />
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Project Information</h3>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-sm text-gray-500">Project Status</span>
                                            <StatusBadge status={data.project.status} />
                                        </div>
                                        <ReadOnlyField label="Project Name" value={data.project.name} />
                                        <ReadOnlyField label="Messaging Tier" value={data.project.wa_messaging_tier} />
                                        <ReadOnlyField label="Daily Limit" value={data.project.daily_template_limit} />
                                    </div>
                                </div>
                            )}
                        </div>
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
                                                onClick={handleCancel}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiSave /> Save Changes
                                                    </>
                                                )}
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
                                                        src={isEditing ? editForm.profile_picture_url : data.profile?.profile_picture_url || ''} 
                                                        alt="Profile" 
                                                        className="h-24 w-24 rounded-xl border-4 border-white dark:border-gray-800 shadow-md object-cover bg-gray-200"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                                                    />
                                                    {isEditing && (
                                                        <>
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleProfilePictureChange}
                                                                className="hidden"
                                                            />
                                                            <div 
                                                                onClick={handleProfilePictureClick}
                                                                className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                                            >
                                                                {isUploadingPicture ? (
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                                ) : (
                                                                    <FiCamera />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="ml-4 mb-1">
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.project?.wa_display_name || data.project?.name || 'Business Profile'}</h2>
                                                    <p className="text-sm text-gray-500">{data.profile?.vertical || '-'}</p>
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
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            />
                                                        ) : (
                                                            <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile?.vertical || '-'}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                                        {isEditing ? (
                                                            <input 
                                                                type="email"
                                                                value={editForm.email}
                                                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            />
                                                        ) : (
                                                            <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile?.email || '-'}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            value={editForm.address}
                                                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                        />
                                                    ) : (
                                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile?.address || '-'}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Text</label>
                                                    {isEditing ? (
                                                        <input 
                                                            type="text"
                                                            maxLength={139} // WA Limit
                                                            value={editForm.about}
                                                            onChange={(e) => setEditForm({...editForm, about: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            placeholder="About text (max 139 characters)"
                                                        />
                                                    ) : (
                                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile?.about || '-'}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Description</label>
                                                    {isEditing ? (
                                                        <textarea 
                                                            rows={3}
                                                            value={editForm.description}
                                                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            placeholder="Business description"
                                                        />
                                                    ) : (
                                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-800 dark:text-gray-200">{data.profile?.description || '-'}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Websites</label>
                                                    <div className="space-y-2">
                                                        {(isEditing ? editForm.websites : (data.profile?.websites || [])).map((site, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <div className="relative flex-1">
                                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><FiGlobe /></div>
                                                                            <input 
                                                                                type="url"
                                                                                value={site}
                                                                                onChange={(e) => handleWebsiteChange(idx, e.target.value)}
                                                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                                                placeholder="https://example.com"
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
                                                <StatusBadge status={data.project?.status} />
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-sm text-gray-500">Quality Rating</span>
                                                <StatusBadge status={data.project?.wa_quality_rating} />
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-sm text-gray-500">Display Name</span>
                                                <StatusBadge status={data.project?.wa_display_name_status} />
                                            </div>
                                            <ReadOnlyField label="Messaging Tier" value={data.project?.wa_messaging_tier} />
                                            <ReadOnlyField label="Daily Limit" value={data.project?.daily_template_limit} />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiCheckCircle className="text-indigo-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Verification</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <ReadOnlyField label="WhatsApp Number" value={data.profile?.wa_number} />
                                            <div className="py-3 border-b border-gray-100 dark:border-gray-700">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Business Manager</dt>
                                                <dd className="mt-1"><StatusBadge status={data.project?.fb_business_manager_status} /></dd>
                                            </div>
                                            <div className="py-3">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">WA Official Account</dt>
                                                <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {data.project?.is_whatsapp_verified ? (
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