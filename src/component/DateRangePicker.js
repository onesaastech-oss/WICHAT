import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, X } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

// Custom input component for date range
const CustomInput = forwardRef(({ value, onClick, placeholder, onClear }, ref) => (
    <div className="relative group" onClick={onClick} ref={ref}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-indigo-500" />
        </div>
        <input
            type="text"
            readOnly
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm cursor-pointer hover:border-indigo-400 transition-all"
            placeholder={placeholder}
            value={value}
        />
        {value && (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                }}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-red-500 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        )}
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
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker-popper {
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

            {/* Start Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <DatePicker
                    selected={startDate ? new Date(startDate) : null}
                    onChange={(date) => {
                        if (date) {
                            onStartDateChange(date.toISOString().split('T')[0]);
                        } else {
                            onStartDateChange('');
                        }
                    }}
                    selectsStart
                    startDate={startDate ? new Date(startDate) : null}
                    endDate={endDate ? new Date(endDate) : null}
                    minDate={minDate ? new Date(minDate) : null}
                    maxDate={endDate ? new Date(endDate) : (maxDate ? new Date(maxDate) : null)}
                    customInput={
                        <CustomInput
                            placeholder="Select start date"
                            onClear={() => onStartDateChange('')}
                        />
                    }
                    dateFormat="MMM d, yyyy"
                    placeholderText="Select start date"
                />
            </div>

            {/* End Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <DatePicker
                    selected={endDate ? new Date(endDate) : null}
                    onChange={(date) => {
                        if (date) {
                            onEndDateChange(date.toISOString().split('T')[0]);
                        } else {
                            onEndDateChange('');
                        }
                    }}
                    selectsEnd
                    startDate={startDate ? new Date(startDate) : null}
                    endDate={endDate ? new Date(endDate) : null}
                    minDate={startDate ? new Date(startDate) : (minDate ? new Date(minDate) : null)}
                    maxDate={maxDate ? new Date(maxDate) : null}
                    customInput={
                        <CustomInput
                            placeholder="Select end date"
                            onClear={() => onEndDateChange('')}
                        />
                    }
                    dateFormat="MMM d, yyyy"
                    placeholderText="Select end date"
                />
            </div>
        </div>
    );
}
