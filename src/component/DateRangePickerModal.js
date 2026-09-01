import React, { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCalendar, FiChevronDown, FiX } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';

const QUICK_FILTERS = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', type: 'month' },
    { label: 'Last Month', type: 'lastMonth' },
];

const toDateString = (date) => {
    if (!date || Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateString = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const [year, month, day] = raw.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDisplayDate = (value) => {
    const date = parseDateString(value);
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatRangeDisplay = (startDate, endDate, placeholder) => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && endDate) {
        return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    }
    if (startDate) return `From ${formatDisplayDate(startDate)}`;
    return `To ${formatDisplayDate(endDate)}`;
};

const TriggerInput = forwardRef(({ value, onClick, placeholder, onClear, hasValue, disabled }, ref) => (
    <div className="relative" ref={ref}>
        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-full pl-9 pr-10 py-2 rounded-lg border text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                hasValue
                    ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-gray-900 dark:text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
        >
            <span className={hasValue ? 'text-gray-900 dark:text-white' : ''}>
                {value || placeholder}
            </span>
        </button>
        {hasValue ? (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClear?.();
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Clear date range"
            >
                <FiX className="w-3.5 h-3.5" />
            </button>
        ) : null}
        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
));

function DateRangePickerModal({
    startDate = '',
    endDate = '',
    onChange,
    onClear,
    label = 'Date range',
    placeholder = 'Select date range (optional)',
    minDate,
    maxDate,
    className = '',
    disabled = false,
    zIndexClass = 'z-[110]',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [localStartDate, setLocalStartDate] = useState(null);
    const [localEndDate, setLocalEndDate] = useState(null);
    const [error, setError] = useState('');

    const resolvedMaxDate = maxDate ? parseDateString(maxDate) : new Date();
    const resolvedMinDate = minDate ? parseDateString(minDate) : null;
    const displayValue = formatRangeDisplay(startDate, endDate, placeholder);
    const hasValue = Boolean(startDate || endDate);

    useEffect(() => {
        if (!isOpen) return;
        setLocalStartDate(parseDateString(startDate));
        setLocalEndDate(parseDateString(endDate));
        setError('');
    }, [isOpen, startDate, endDate]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleQuickFilter = (filter) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (filter.type === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (filter.type === 'lastMonth') {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        } else if (filter.days > 0) {
            start = new Date(today);
            start.setDate(today.getDate() - filter.days);
            end = today;
        } else {
            start = today;
            end = today;
        }

        setLocalStartDate(start);
        setLocalEndDate(end);
        setError('');
    };

    const handleApply = () => {
        if (localStartDate && localEndDate && localStartDate > localEndDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        onChange?.({
            startDate: toDateString(localStartDate),
            endDate: toDateString(localEndDate),
        });
        setIsOpen(false);
        setError('');
    };

    const handleClear = () => {
        setLocalStartDate(null);
        setLocalEndDate(null);
        onChange?.({ startDate: '', endDate: '' });
        onClear?.();
        setIsOpen(false);
        setError('');
    };

    const handleOpen = () => {
        if (disabled) return;
        setIsOpen(true);
    };

    const modal = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/50 p-4`}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', duration: 0.28 }}
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Optional filter for media dates</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Close date picker"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                                {QUICK_FILTERS.map((filter) => (
                                    <button
                                        key={filter.label}
                                        type="button"
                                        onClick={() => handleQuickFilter(filter)}
                                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Custom range</p>
                                <div className="flex justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 date-range-picker-modal-calendar">
                                    <DatePicker
                                        selected={localStartDate}
                                        onChange={(dates) => {
                                            const [start, end] = dates;
                                            setLocalStartDate(start || null);
                                            setLocalEndDate(end || null);
                                            setError('');
                                        }}
                                        startDate={localStartDate}
                                        endDate={localEndDate}
                                        selectsRange
                                        inline
                                        minDate={resolvedMinDate}
                                        maxDate={resolvedMaxDate}
                                        calendarClassName="!border-0 !shadow-none !bg-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900/40">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">From</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                                        {localStartDate ? formatDisplayDate(toDateString(localStartDate)) : '—'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900/40">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">To</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                                        {localEndDate ? formatDisplayDate(toDateString(localEndDate)) : '—'}
                                    </p>
                                </div>
                            </div>

                            {error ? (
                                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                            ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/30">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    disabled={!localStartDate && !localEndDate}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={className}>
            <style>{`
                .date-range-picker-modal-calendar .react-datepicker {
                    font-family: inherit;
                    border: none;
                    background: transparent;
                }
                .date-range-picker-modal-calendar .react-datepicker__header {
                    background: transparent;
                    border-bottom: 1px solid rgb(229 231 235);
                }
                .dark .date-range-picker-modal-calendar .react-datepicker__header {
                    border-bottom-color: rgb(55 65 81);
                }
                .date-range-picker-modal-calendar .react-datepicker__current-month,
                .date-range-picker-modal-calendar .react-datepicker__day-name,
                .date-range-picker-modal-calendar .react-datepicker__day {
                    color: rgb(55 65 81);
                }
                .dark .date-range-picker-modal-calendar .react-datepicker__current-month,
                .dark .date-range-picker-modal-calendar .react-datepicker__day-name,
                .dark .date-range-picker-modal-calendar .react-datepicker__day {
                    color: rgb(229 231 235);
                }
                .date-range-picker-modal-calendar .react-datepicker__day:hover {
                    background: rgb(238 242 255);
                }
                .dark .date-range-picker-modal-calendar .react-datepicker__day:hover {
                    background: rgb(67 56 202 / 0.25);
                }
                .date-range-picker-modal-calendar .react-datepicker__day--selected,
                .date-range-picker-modal-calendar .react-datepicker__day--in-range,
                .date-range-picker-modal-calendar .react-datepicker__day--in-selecting-range,
                .date-range-picker-modal-calendar .react-datepicker__day--range-start,
                .date-range-picker-modal-calendar .react-datepicker__day--range-end {
                    background: rgb(79 70 229) !important;
                    color: white !important;
                }
                .date-range-picker-modal-calendar .react-datepicker__day--today {
                    font-weight: 700;
                }
                .date-range-picker-modal-calendar .react-datepicker__day--outside-month {
                    color: rgb(156 163 175);
                }
                .date-range-picker-modal-calendar .react-datepicker__navigation-icon::before {
                    border-color: rgb(107 114 128);
                }
            `}</style>

            {label ? (
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    {label}
                </label>
            ) : null}

            <TriggerInput
                value={hasValue ? displayValue : ''}
                onClick={handleOpen}
                placeholder={placeholder}
                onClear={handleClear}
                hasValue={hasValue}
                disabled={disabled}
            />

            {typeof document !== 'undefined' ? createPortal(modal, document.body) : null}
        </div>
    );
}

export default DateRangePickerModal;
