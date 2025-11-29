import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { fetchUserProfile, updateUserProfile } from '../api/auth';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiLock,
    FiClock,
    FiGlobe,
    FiBell,
    FiShield,
    FiSave
} from 'react-icons/fi';

const MyProfile = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    // Basic profile information
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        countryCode: '91',
        gender: 'male',
        role: 'Owner',
        companyName: '',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Security form (not persisted – you would integrate backend API here)
    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notification preferences (persisted locally)
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('userNotifications');
        return saved
            ? JSON.parse(saved)
            : {
                  inboundMessages: true,
                  campaignEvents: true,
                  billingUpdates: true,
                  weeklySummary: false
              };
    });

    // Persist sidebar minimized state
    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Fetch user profile on component mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const response = await fetchUserProfile();
                if (response && !response.error && response.profile) {
                    const profileData = response.profile;
                    setProfile((prev) => ({
                        ...prev,
                        fullName: profileData.name || '',
                        email: profileData.email || '',
                        phone: profileData.mobile || '',
                        countryCode: profileData.country_code || '91',
                        gender: profileData.gender || 'male'
                    }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Lock body scroll when mobile sidebar is open
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
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
    }, [notifications]);

    const handleProfileChange = (field, value) => {
        setProfile((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNotificationToggle = (field) => {
        setNotifications((prev) => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await updateUserProfile({
                name: profile.fullName,
                email: profile.email,
                country_code: profile.countryCode,
                mobile: profile.phone,
                gender: profile.gender
            });

            if (response && !response.error) {
                // Update local state with the returned profile data
                if (response.profile) {
                    const profileData = response.profile;
                    setProfile((prev) => ({
                        ...prev,
                        fullName: profileData.name || prev.fullName,
                        email: profileData.email || prev.email,
                        phone: profileData.mobile || prev.phone,
                        countryCode: profileData.country_code || prev.countryCode,
                        gender: profileData.gender || prev.gender
                    }));
                }
                alert('Profile updated successfully');
            } else {
                alert(response?.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSecuritySubmit = (e) => {
        e.preventDefault();

        if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (security.newPassword.length < 8) {
            alert('New password should be at least 8 characters');
            return;
        }

        if (security.newPassword !== security.confirmPassword) {
            alert('New password and confirmation do not match');
            return;
        }

        // Here you would call your API to change the password securely.
        alert('Password updated (demo only – connect to backend API)');
        setSecurity({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            <div
                className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
                    isMinimized ? 'lg:ml-16' : 'lg:ml-64'
                }`}
            >
                <Header
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    isMinimized={isMinimized}
                    setIsMinimized={setIsMinimized}
                />

                <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Page header */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        My Profile
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Manage your account details, security and notification preferences
                                    </p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
                            </div>
                        ) : (
                        <>
                        {/* Top summary card */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
                                        {getInitials(profile.fullName)}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {profile.fullName || 'Your name'}
                                            </h2>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {profile.role || 'Owner'} · {profile.companyName || 'Your workspace'}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="inline-flex items-center">
                                                <FiMail className="mr-1 h-3 w-3" />
                                                {profile.email || 'Add email'}
                                            </span>
                                            <span className="inline-flex items-center">
                                                <FiPhone className="mr-1 h-3 w-3" />
                                                {profile.countryCode ? `+${profile.countryCode} ` : ''}{profile.phone || 'Add phone number'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="inline-flex items-center">
                                        <FiClock className="mr-1 h-3 w-3" />
                                        Timezone: {profile.timezone}
                                    </span>
                                    <span className="inline-flex items-center">
                                        <FiGlobe className="mr-1 h-3 w-3" />
                                        Locale: {profile.locale}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main content grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column: profile details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Profile details form */}
                                <form
                                    onSubmit={handleProfileSubmit}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FiUser className="text-indigo-500" />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Account details
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Full name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.fullName}
                                                onChange={(e) =>
                                                    handleProfileChange('fullName', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Role
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.role}
                                                onChange={(e) =>
                                                    handleProfileChange('role', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Owner, Admin, Agent..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email address
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                                    <FiMail className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={(e) =>
                                                        handleProfileChange('email', e.target.value)
                                                    }
                                                    className="block w-full pl-9 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="you@company.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Country Code
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.countryCode}
                                                onChange={(e) =>
                                                    handleProfileChange('countryCode', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="91"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Phone (WhatsApp)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                                    <FiPhone className="h-4 w-4" />
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={profile.phone}
                                                    onChange={(e) =>
                                                        handleProfileChange('phone', e.target.value)
                                                    }
                                                    className="block w-full pl-9 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    placeholder="9876543210"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Gender
                                            </label>
                                            <select
                                                value={profile.gender}
                                                onChange={(e) =>
                                                    handleProfileChange('gender', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="others">Others</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Timezone
                                            </label>
                                            <select
                                                value={profile.timezone}
                                                onChange={(e) =>
                                                    handleProfileChange('timezone', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="Asia/Kolkata">Asia / Kolkata (IST)</option>
                                                <option value="Asia/Dubai">Asia / Dubai</option>
                                                <option value="Europe/London">Europe / London</option>
                                                <option value="America/New_York">
                                                    America / New York
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Locale
                                            </label>
                                            <select
                                                value={profile.locale}
                                                onChange={(e) =>
                                                    handleProfileChange('locale', e.target.value)
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="en-IN">English (India)</option>
                                                <option value="en-US">English (US)</option>
                                                <option value="en-GB">English (UK)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button
                                            type="submit"
                                            disabled={saving || loading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiSave className="mr-2 h-4 w-4" />
                                            {saving ? 'Saving...' : 'Save changes'}
                                        </button>
                                    </div>
                                </form>

                                {/* Security form */}
                                <form
                                    onSubmit={handleSecuritySubmit}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FiLock className="text-indigo-500" />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Security
                                        </h3>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Update your password regularly to keep your workspace secure.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Current password
                                            </label>
                                            <input
                                                type="password"
                                                value={security.currentPassword}
                                                onChange={(e) =>
                                                    setSecurity((prev) => ({
                                                        ...prev,
                                                        currentPassword: e.target.value
                                                    }))
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                New password
                                            </label>
                                            <input
                                                type="password"
                                                value={security.newPassword}
                                                onChange={(e) =>
                                                    setSecurity((prev) => ({
                                                        ...prev,
                                                        newPassword: e.target.value
                                                    }))
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Confirm new password
                                            </label>
                                            <input
                                                type="password"
                                                value={security.confirmPassword}
                                                onChange={(e) =>
                                                    setSecurity((prev) => ({
                                                        ...prev,
                                                        confirmPassword: e.target.value
                                                    }))
                                                }
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                                        >
                                            <FiShield className="mr-2 h-4 w-4" />
                                            Update password
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Right column: notifications & meta */}
                            <div className="space-y-6">
                                {/* Notification preferences */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FiBell className="text-indigo-500" />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Notification preferences
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        Control how 1Chat notifies you about important activity.
                                    </p>

                                    <div className="space-y-3">
                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                checked={notifications.inboundMessages}
                                                onChange={() =>
                                                    handleNotificationToggle('inboundMessages')
                                                }
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Inbound messages
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Get a notification when new WhatsApp messages arrive
                                                    in your assigned chats.
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                checked={notifications.campaignEvents}
                                                onChange={() =>
                                                    handleNotificationToggle('campaignEvents')
                                                }
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Campaign activity
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Receive alerts for campaign sends, failures and key
                                                    performance milestones.
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                checked={notifications.billingUpdates}
                                                onChange={() =>
                                                    handleNotificationToggle('billingUpdates')
                                                }
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Billing & usage
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Stay informed about plan changes, invoices and usage
                                                    limits.
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                checked={notifications.weeklySummary}
                                                onChange={() =>
                                                    handleNotificationToggle('weeklySummary')
                                                }
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Weekly performance summary
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    A weekly email with key metrics across live chat,
                                                    campaigns and automation.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Meta / security info */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <FiShield className="text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Account security tips
                                        </span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Use a strong, unique password for your 1Chat account.</li>
                                        <li>
                                            Keep your browser session secure, especially on shared
                                            devices.
                                        </li>
                                        <li>
                                            Restrict access by assigning the right role to each agent in
                                            Agent Management.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyProfile;
