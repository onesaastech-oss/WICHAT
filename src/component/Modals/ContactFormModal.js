import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX,
    FiEdit2,
    FiCheck,
    FiPhone,
    FiUser,
    FiMail,
    FiHome,
    FiGlobe,
    FiFileText,
    FiCheckCircle,
    FiAlertCircle
} from 'react-icons/fi';

// Country options for phone number input
const DEFAULT_COUNTRY = { iso2: 'IN', name: 'India', dialCode: '91' };
const COUNTRY_OPTIONS = [
    DEFAULT_COUNTRY,
    { iso2: 'US', name: 'United States', dialCode: '1' },
    { iso2: 'CA', name: 'Canada', dialCode: '1' },
    { iso2: 'GB', name: 'United Kingdom', dialCode: '44' },
    { iso2: 'AE', name: 'United Arab Emirates', dialCode: '971' },
    { iso2: 'SA', name: 'Saudi Arabia', dialCode: '966' },
    { iso2: 'SG', name: 'Singapore', dialCode: '65' },
    { iso2: 'AU', name: 'Australia', dialCode: '61' },
    { iso2: 'BD', name: 'Bangladesh', dialCode: '880' },
    { iso2: 'NP', name: 'Nepal', dialCode: '977' },
    { iso2: 'PK', name: 'Pakistan', dialCode: '92' }
];

// Validation functions
const validateLocalPhoneNumber10 = (phone) => {
    const cleaned = String(phone || '').replace(/\D/g, '');
    if (!cleaned) return 'Mobile number is required';
    if (!/^\d{10}$/.test(cleaned)) return 'Please enter a valid 10-digit mobile number';
    return '';
};

const validateName = (name) => {
    if (!name || name.trim() === '') {
        return 'Name is required';
    }
    if (name.trim().length < 2) {
        return 'Name must be at least 2 characters long';
    }
    if (name.trim().length > 100) {
        return 'Name must be less than 100 characters';
    }
    const nameRegex = /^[\p{L}\s\-'\.0-9]+$/u;
    if (!nameRegex.test(name.trim())) {
        return 'Name contains invalid characters';
    }
    return '';
};

const validateEmail = (email) => {
    if (!email || email.trim() === '') {
        return ''; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address';
    }
    if (email.trim().length > 255) {
        return 'Email must be less than 255 characters';
    }
    return '';
};

const validateWebsite = (website) => {
    if (!website || website.trim() === '') {
        return ''; // Website is optional
    }
    try {
        const url = website.trim();
        const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;
        new URL(urlWithProtocol);
        if (url.length > 500) {
            return 'Website URL must be less than 500 characters';
        }
        return '';
    } catch (e) {
        return 'Please enter a valid website URL';
    }
};

const validateRemark = (remark) => {
    if (!remark || remark.trim() === '') {
        return ''; // Remark is optional
    }
    if (remark.trim().length > 1000) {
        return 'Remark must be less than 1000 characters';
    }
    return '';
};

/**
 * ContactFormModal - Reusable modal for creating/updating contacts
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onSubmit - Callback when form is submitted with (formData, fullNumber, country)
 * @param {object} initialData - Initial form data (for editing)
 * @param {boolean} isExisting - Whether this is editing an existing contact
 * @param {boolean} loading - Whether initial data is loading
 * @param {boolean} submitting - Whether form is being submitted
 * @param {string} error - Error message to display
 * @param {boolean} darkMode - Whether dark mode is enabled (optional, defaults to false)
 */
const ContactFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData = {},
    isExisting = false,
    loading = false,
    submitting = false,
    error = '',
    darkMode = false
}) => {
    const [country, setCountry] = useState(DEFAULT_COUNTRY);
    const [formData, setFormData] = useState({
        number: '',
        name: '',
        email: '',
        firm_name: '',
        website: '',
        remark: ''
    });
    const [errors, setErrors] = useState({
        number: '',
        name: '',
        email: '',
        website: '',
        remark: ''
    });
    const [originalNumber, setOriginalNumber] = useState('');
    const [numberChanged, setNumberChanged] = useState(false);

    // Extract local 10-digit number from full number if editing
    useEffect(() => {
        if (initialData.number) {
            const fullNumber = String(initialData.number).replace(/\D/g, '');
            // Try to find matching country code
            let localNumber = initialData.number;
            let foundCountry = DEFAULT_COUNTRY;

            for (const c of COUNTRY_OPTIONS) {
                const dialCode = String(c.dialCode).replace(/\D/g, '');
                if (fullNumber.startsWith(dialCode)) {
                    localNumber = fullNumber.substring(dialCode.length);
                    foundCountry = c;
                    break;
                }
            }

            setCountry(foundCountry);
            setOriginalNumber(localNumber); // Store original number
            setNumberChanged(false); // Reset on modal open
            setFormData({
                number: localNumber,
                name: initialData.name || '',
                email: initialData.email || '',
                firm_name: initialData.firm_name || '',
                website: initialData.website || '',
                remark: initialData.remark || ''
            });
        } else {
            // Reset for new contact
            setCountry(DEFAULT_COUNTRY);
            setOriginalNumber('');
            setNumberChanged(false);
            setFormData({
                number: '',
                name: initialData.name || '',
                email: initialData.email || '',
                firm_name: initialData.firm_name || '',
                website: initialData.website || '',
                remark: initialData.remark || ''
            });
        }
        // Reset errors when modal opens/closes
        setErrors({
            number: '',
            name: '',
            email: '',
            website: '',
            remark: ''
        });
    }, [initialData, isOpen]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        // Check if number has changed (for existing contacts)
        if (field === 'number' && isExisting && originalNumber) {
            setNumberChanged(value !== originalNumber);
        }
    };

    const handleFieldBlur = (field) => {
        let error = '';
        switch (field) {
            case 'number':
                error = validateLocalPhoneNumber10(formData.number);
                break;
            case 'name':
                error = validateName(formData.name);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'website':
                error = validateWebsite(formData.website);
                break;
            case 'remark':
                error = validateRemark(formData.remark);
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = () => {
        const newErrors = {
            number: validateLocalPhoneNumber10(formData.number),
            name: validateName(formData.name),
            email: validateEmail(formData.email),
            website: validateWebsite(formData.website),
            remark: validateRemark(formData.remark)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const localNumber10 = String(formData.number || '').replace(/\D/g, '').slice(0, 10);
        const fullNumber = `${String(country?.dialCode || '91').replace(/\D/g, '')}${localNumber10}`;

        // Call parent's onSubmit with form data, full number, and country
        onSubmit({
            ...formData,
            number: fullNumber
        }, fullNumber, country);
    };

    if (!isOpen) return null;

    const isFormValid = formData.name.trim() && formData.number.length === 10 &&
        !Object.values(errors).some(error => error !== '');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${darkMode ? 'bg-black bg-opacity-40' : 'bg-gray-600 bg-opacity-50'
                        }`}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className={`flex h-[85vh] max-h-[90vh] w-full max-w-md flex-col rounded-2xl shadow-xl overflow-hidden ${darkMode
                                ? 'bg-gray-800'
                                : 'bg-white'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between border-b px-3 py-3 sm:px-5 sm:py-4 flex-shrink-0 ${darkMode
                                ? 'border-gray-700'
                                : 'border-gray-200'
                            }`}>
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${darkMode
                                        ? 'bg-blue-900/40'
                                        : 'bg-blue-100'
                                    }`}>
                                    <FiEdit2 className={`h-4 w-4 ${darkMode ? 'text-blue-300' : 'text-blue-600'
                                        }`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className={`text-sm sm:text-base font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        {isExisting ? 'Edit Contact' : 'Create New Contact'}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className={`rounded-full p-1 transition-colors flex-shrink-0 ml-2 ${darkMode
                                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                aria-label="Close contact modal"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4 px-3 py-4 sm:px-5">
                                {error && (
                                    <div className={`rounded-lg border px-3 py-2 text-sm ${darkMode
                                            ? 'border-red-500/30 bg-red-900/30 text-red-200'
                                            : 'border-red-200 bg-red-50 text-red-600'
                                        }`}>
                                        {error}
                                    </div>
                                )}

                                {loading && (
                                    <div className={`flex items-center space-x-2 rounded-lg border px-3 py-2 text-sm ${darkMode
                                            ? 'border-blue-500/30 bg-blue-900/30 text-blue-200'
                                            : 'border-blue-100 bg-blue-50 text-blue-600'
                                        }`}>
                                        <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-r-transparent ${darkMode ? 'border-blue-400' : 'border-blue-400'
                                            }`} />
                                        <span>Loading contact details…</span>
                                    </div>
                                )}

                                {/* Mobile Number Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiPhone className="inline h-4 w-4 mr-1" />
                                        Mobile Number *
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={country.iso2}
                                            onChange={(e) => {
                                                const next = COUNTRY_OPTIONS.find((c) => c.iso2 === e.target.value) || DEFAULT_COUNTRY;
                                                setCountry(next);
                                                if (formData.number) {
                                                    handleFieldBlur('number');
                                                }
                                                // Check if changing country code changes the number
                                                if (isExisting && originalNumber && formData.number) {
                                                    setNumberChanged(true);
                                                }
                                            }}
                                            disabled={loading || submitting}
                                            className={`w-4/12 px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${darkMode
                                                    ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                                } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-label="Country code"
                                        >
                                            {COUNTRY_OPTIONS.map((c) => (
                                                <option key={c.iso2} value={c.iso2}>
                                                    {c.name} ({c.dialCode})
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={10}
                                            value={formData.number}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                handleFieldChange('number', digits);
                                            }}
                                            onBlur={() => handleFieldBlur('number')}
                                            disabled={loading || submitting}
                                            className={`w-8/12 px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${errors.number
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : darkMode
                                                        ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                        : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                                } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            placeholder="Enter 10-digit number"
                                            required
                                        />
                                    </div>

                                    {!errors.number && /^\d{10}$/.test(formData.number) && !numberChanged && (
                                        <p className={`mt-1 text-sm inline-flex items-center ${darkMode ? 'text-green-400' : 'text-green-600'
                                            }`}>
                                            <FiCheckCircle className="h-4 w-4 mr-1" />
                                            Valid number (will be saved as {String(country?.dialCode || '91').replace(/\D/g, '')}
                                            {formData.number})
                                        </p>
                                    )}
                                    {numberChanged && !errors.number && /^\d{10}$/.test(formData.number) && (
                                        <p className={`mt-1 text-sm inline-flex items-center ${darkMode ? 'text-yellow-400' : 'text-yellow-600'
                                            }`}>
                                            <FiAlertCircle className="h-4 w-4 mr-1" />
                                            Changing the number will not retrieve previous chats.
                                        </p>
                                    )}
                                    {errors.number && (
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {errors.number}
                                        </p>
                                    )}
                                </div>

                                {/* Name Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiUser className="inline h-4 w-4 mr-1" />
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        onBlur={() => handleFieldBlur('name')}
                                        disabled={loading || submitting}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${errors.name
                                                ? 'border-red-500 focus:ring-red-500'
                                                : darkMode
                                                    ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                            } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter full name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiMail className="inline h-4 w-4 mr-1" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                        onBlur={() => handleFieldBlur('email')}
                                        disabled={loading || submitting}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${errors.email
                                                ? 'border-red-500 focus:ring-red-500'
                                                : darkMode
                                                    ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                            } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && (
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Company Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiHome className="inline h-4 w-4 mr-1" />
                                        Company / Firm
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firm_name}
                                        onChange={(e) => handleFieldChange('firm_name', e.target.value)}
                                        disabled={loading || submitting}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${darkMode
                                                ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                            } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter company name"
                                    />
                                </div>

                                {/* Website Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiGlobe className="inline h-4 w-4 mr-1" />
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => handleFieldChange('website', e.target.value)}
                                        onBlur={() => handleFieldBlur('website')}
                                        disabled={loading || submitting}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${errors.website
                                                ? 'border-red-500 focus:ring-red-500'
                                                : darkMode
                                                    ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                            } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter website URL (e.g., example.com)"
                                    />
                                    {errors.website && (
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {errors.website}
                                        </p>
                                    )}
                                </div>

                                {/* Remark Field */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <FiFileText className="inline h-4 w-4 mr-1" />
                                        Remark
                                    </label>
                                    <textarea
                                        value={formData.remark}
                                        onChange={(e) => handleFieldChange('remark', e.target.value)}
                                        onBlur={() => handleFieldBlur('remark')}
                                        disabled={loading || submitting}
                                        rows={3}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${errors.remark
                                                ? 'border-red-500 focus:ring-red-500'
                                                : darkMode
                                                    ? 'border-gray-600 bg-gray-900 text-white focus:border-blue-400 focus:ring-blue-800'
                                                    : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                            } ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Enter any remarks"
                                    />
                                    {errors.remark && (
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            {errors.remark}
                                        </p>
                                    )}
                                    <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {formData.remark.length}/1000 characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t px-3 py-3 sm:px-5 sm:py-4 flex-shrink-0 ${darkMode
                                ? 'border-gray-700 bg-gray-900/60'
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className={`text-xs text-center sm:text-left ${darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                {/* Optional footer text */}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || submitting || !isFormValid}
                                className={`inline-flex items-center justify-center space-x-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition w-full sm:w-auto ${loading || submitting || !isFormValid
                                        ? darkMode
                                            ? 'cursor-not-allowed bg-blue-700'
                                            : 'cursor-not-allowed bg-blue-300'
                                        : darkMode
                                            ? 'bg-blue-500 hover:bg-blue-600'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {submitting ? (
                                    <span className="flex items-center space-x-2">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                        <span>Saving…</span>
                                    </span>
                                ) : (
                                    <>
                                        <FiCheck className="h-4 w-4" />
                                        <span>{isExisting ? 'Update Contact' : 'Save Contact'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactFormModal;
export { DEFAULT_COUNTRY, COUNTRY_OPTIONS };
