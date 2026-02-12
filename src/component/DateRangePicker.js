import React, { forwardRef, useState, useEffect , useRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, X, ChevronDown } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

// Custom input component for date range
const CustomInput = forwardRef(({ value, onClick, placeholder, onClear, isOpen }, ref) => (
    <div className="relative group" onClick={onClick} ref={ref}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-indigo-500" />
        </div>
        <input
            type="text"
            readOnly
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm cursor-pointer hover:border-indigo-400 transition-all"
            placeholder={placeholder}
            value={value}
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            {value && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    className="flex items-center text-gray-400 hover:text-red-500 transition-colors mr-1"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
    </div>
));

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    minDate,
    maxDate
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [localStartDate, setLocalStartDate] = useState(startDate ? new Date(startDate) : null);
    const [localEndDate, setLocalEndDate] = useState(endDate ? new Date(endDate) : null);
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    // Quick date filters
    const quickDateFilters = [
        { label: 'Today', days: 0 },
        { label: 'Yesterday', days: 1 },
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'This Month', type: 'month' },
        { label: 'Last Month', type: 'lastMonth' },
    ];

    // Update local state when props change
    useEffect(() => {
        setLocalStartDate(startDate ? new Date(startDate) : null);
        setLocalEndDate(endDate ? new Date(endDate) : null);
    }, [startDate, endDate]);

    const formatRangeDisplay = () => {
        if (!startDate && !endDate) return 'Select date range';
        
        const format = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        };
        
        if (startDate && endDate) {
            return `${format(startDate)} - ${format(endDate)}`;
        } else if (startDate) {
            return `From ${format(startDate)}`;
        } else if (endDate) {
            return `To ${format(endDate)}`;
        }
        return 'Select date range';
    };

    const formatDateString = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDateFromString = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    };

    const handleQuickDateFilter = (filter) => {
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        if (filter.type === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (filter.type === 'lastMonth') {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        } else if (filter.days > 0) {
            startDate.setDate(today.getDate() - filter.days);
            endDate = today;
        } else {
            startDate = today;
            endDate = today;
        }

        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
        
        onStartDateChange(startDate.toISOString().split('T')[0]);
        onEndDateChange(endDate.toISOString().split('T')[0]);
        setIsOpen(false);
        setShowCustomPicker(false);
    };

    const handleApplyDate = () => {
        if (localStartDate && localEndDate) {
            onStartDateChange(localStartDate.toISOString().split('T')[0]);
            onEndDateChange(localEndDate.toISOString().split('T')[0]);
            setIsOpen(false);
            setShowCustomPicker(false);
        }
    };
    const startDatePickerRef = useRef(null);
const endDatePickerRef = useRef(null);

    const clearDates = () => {
        setLocalStartDate(null);
        setLocalEndDate(null);
        onStartDateChange('');
        onEndDateChange('');
        setIsOpen(false);
        setShowCustomPicker(false);
    };

    return (
        <div className="relative">
            <style>{`
                .datepicker-popper-custom {
                    z-index: 9999 !important;
                }
                .react-datepicker {
                    font-family: inherit;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.75rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .react-datepicker__header {
                    background: linear-gradient(to right, #eef2ff, #f5f3ff);
                    border-bottom: 1px solid #e5e7eb;
                    padding-top: 0.75rem;
                }
                .react-datepicker__current-month {
                    color: #374151;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }
                .react-datepicker__day-names {
                    display: flex;
                    justify-content: space-around;
                    padding: 0.5rem 0;
                    margin: 0;
                }
                .react-datepicker__day-name {
                    color: #6b7280;
                    font-weight: 600;
                    font-size: 0.7rem;
                    width: 2rem;
                    line-height: 2rem;
                    margin: 0;
                    text-transform: uppercase;
                }
                .react-datepicker__month {
                    margin: 0.5rem;
                }
                .react-datepicker__week {
                    display: flex;
                    justify-content: space-around;
                }
                .react-datepicker__day {
                    width: 2rem;
                    height: 2rem;
                    line-height: 2rem;
                    margin: 0.125rem;
                    border-radius: 0.375rem;
                    color: #374151;
                    font-weight: 500;
                    font-size: 0.85rem;
                    transition: all 0.15s ease;
                }
                .react-datepicker__day:hover {
                    background-color: #eef2ff;
                    color: #4f46e5;
                }
                .react-datepicker__day--selected,
                .react-datepicker__day--in-range,
                .react-datepicker__day--in-selecting-range {
                    background-color: #4f46e5 !important;
                    color: white !important;
                    font-weight: 600;
                }
                .react-datepicker__day--range-start,
                .react-datepicker__day--range-end {
                    background-color: #4338ca !important;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #eef2ff;
                    color: #4f46e5;
                }
                .react-datepicker__day--today {
                    font-weight: 700;
                    color: #4f46e5;
                    background-color: #eef2ff;
                }
                .react-datepicker__day--disabled {
                    color: #d1d5db;
                    cursor: not-allowed;
                }
                .react-datepicker__day--disabled:hover {
                    background-color: transparent;
                }
                .react-datepicker__day--outside-month {
                    color: #d1d5db;
                }
                .react-datepicker__navigation {
                    top: 0.75rem;
                }
                .react-datepicker__navigation-icon::before {
                    border-color: #6b7280;
                }
                .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
                    border-color: #4f46e5;
                }
            `}</style>

            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            
            {/* Custom Input Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="cursor-pointer"
            >
                <CustomInput
                    placeholder="Select date range"
                    onClear={clearDates}
                    value={formatRangeDisplay()}
                    isOpen={isOpen}
                />
            </div>

            {/* Custom Date Picker Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden">
                    <div className="p-4">
                        {/* Header with close button */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Select Date Range</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Quick Date Filters Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {quickDateFilters.map((filter, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickDateFilter(filter)}
                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg transition-colors duration-150 border border-gray-200 hover:border-indigo-300"
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range Selection */}
                        <div className="mb-4">
                            <div className="text-xs font-medium text-gray-500 mb-2">OR select custom range</div>
                            
                            {/* Toggle between calendar and manual input */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setShowCustomPicker(false)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                                        !showCustomPicker 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Range Picker
                                </button>
                                <button
                                    onClick={() => setShowCustomPicker(true)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                                        showCustomPicker 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Custom Dates
                                </button>
                            </div>

                        {showCustomPicker ? (
    /* Manual Date Input with Calendar Picker */
    <div className="space-y-4">
        {/* From Date */}
        <div className="relative" ref={startDatePickerRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
                From Date
            </label>
            <div className="relative">
                <DatePicker
                    selected={localStartDate}
                    onChange={(date) => {
                        setLocalStartDate(date);
                    }}
                    customInput={
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                            </div>
                            <input
                                type="text"
                                value={localStartDate ? formatDateString(localStartDate) : ''}
                                readOnly
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm cursor-pointer hover:border-indigo-400 transition-all"
                                placeholder="DD/MM/YYYY"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={minDate ? new Date(minDate) : null}
                    maxDate={localEndDate || (maxDate ? new Date(maxDate) : new Date())}
                    popperClassName="!z-[99999]"
                    popperPlacement="bottom-start"
                    shouldCloseOnSelect={true}
                />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Format: DD/MM/YYYY</p>
        </div>
        
        {/* To Date */}
        <div className="relative" ref={endDatePickerRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
                To Date
            </label>
            <div className="relative">
                <DatePicker
                    selected={localEndDate}
                    onChange={(date) => {
                        setLocalEndDate(date);
                    }}
                    customInput={
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                            </div>
                            <input
                                type="text"
                                value={localEndDate ? formatDateString(localEndDate) : ''}
                                readOnly
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm cursor-pointer hover:border-indigo-400 transition-all"
                                placeholder="DD/MM/YYYY"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={localStartDate || (minDate ? new Date(minDate) : null)}
                    maxDate={maxDate ? new Date(maxDate) : new Date()}
                    popperClassName="!z-[99999]"
                    popperPlacement="bottom-start"
                    shouldCloseOnSelect={true}
                />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Format: DD/MM/YYYY</p>
        </div>
    </div>
) : (
    /* Calendar Picker */
    <div className="flex justify-center">
        <DatePicker
            selected={localStartDate}
            onChange={(dates) => {
                const [start, end] = dates;
                setLocalStartDate(start);
                setLocalEndDate(end);
            }}
            startDate={localStartDate}
            endDate={localEndDate}
            selectsRange
            inline
            minDate={minDate ? new Date(minDate) : null}
            maxDate={maxDate ? new Date(maxDate) : new Date()}
            dateFormat="dd/MM/yyyy"
            calendarClassName="!shadow-xl !border-2 !border-gray-200"
        />
    </div>
)}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApplyDate}
                                disabled={!localStartDate || !localEndDate}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                                    localStartDate && localEndDate
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Apply Date
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}