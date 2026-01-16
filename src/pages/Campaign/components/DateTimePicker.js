import React, { forwardRef, useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

// Custom header for the date picker
const CustomHeader = ({
  date,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="flex items-center justify-between px-3 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
      <button
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        type="button"
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="font-semibold text-gray-800 text-base">
        {monthNames[date.getMonth()]} {date.getFullYear()}
      </div>
      <button
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        type="button"
        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// Time input component for precise hour and minute selection
const TimeSelector = ({ selectedDate, onChange, minDate }) => {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setHours(String(date.getHours()).padStart(2, '0'));
      setMinutes(String(date.getMinutes()).padStart(2, '0'));
    }
  }, [selectedDate]);

  const handleHourChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setHours('');
      return;
    }
    const numValue = parseInt(value);
    if (numValue >= 0 && numValue <= 23) {
      setHours(String(numValue).padStart(2, '0'));
      updateDateTime(numValue, parseInt(minutes));
    }
  };

  const handleMinuteChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setMinutes('');
      return;
    }
    const numValue = parseInt(value);
    if (numValue >= 0 && numValue <= 59) {
      setMinutes(String(numValue).padStart(2, '0'));
      updateDateTime(parseInt(hours), numValue);
    }
  };

  const updateDateTime = (newHours, newMinutes) => {
    if (!selectedDate) return;
    
    const date = new Date(selectedDate);
    date.setHours(newHours);
    date.setMinutes(newMinutes);
    
    // Check if the new time is valid (not before minDate)
    if (minDate && date < new Date(minDate)) {
      return;
    }
    
    // Convert to local ISO string format
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const isoString = localDate.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const incrementHours = () => {
    const newHours = (parseInt(hours) + 1) % 24;
    setHours(String(newHours).padStart(2, '0'));
    updateDateTime(newHours, parseInt(minutes));
  };

  const decrementHours = () => {
    const newHours = parseInt(hours) - 1 < 0 ? 23 : parseInt(hours) - 1;
    setHours(String(newHours).padStart(2, '0'));
    updateDateTime(newHours, parseInt(minutes));
  };

  const incrementMinutes = () => {
    const newMinutes = (parseInt(minutes) + 1) % 60;
    setMinutes(String(newMinutes).padStart(2, '0'));
    updateDateTime(parseInt(hours), newMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = parseInt(minutes) - 1 < 0 ? 59 : parseInt(minutes) - 1;
    setMinutes(String(newMinutes).padStart(2, '0'));
    updateDateTime(parseInt(hours), newMinutes);
  };

  if (!selectedDate) return null;

  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-medium text-gray-700">Set Exact Time (24-hour format)</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementHours}
            className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-indigo-600 transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
          </button>
          <input
            type="text"
            value={hours}
            onChange={handleHourChange}
            maxLength={2}
            className="w-14 h-12 text-center text-lg font-semibold border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="HH"
          />
          <button
            type="button"
            onClick={decrementHours}
            className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-indigo-600 transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
          <span className="text-xs text-gray-500 mt-1">Hours</span>
        </div>

        <span className="text-2xl font-bold text-gray-400 mb-6">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementMinutes}
            className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-indigo-600 transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
          </button>
          <input
            type="text"
            value={minutes}
            onChange={handleMinuteChange}
            maxLength={2}
            className="w-14 h-12 text-center text-lg font-semibold border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="MM"
          />
          <button
            type="button"
            onClick={decrementMinutes}
            className="p-1 hover:bg-white rounded-md text-gray-600 hover:text-indigo-600 transition-all"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
          <span className="text-xs text-gray-500 mt-1">Minutes</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-indigo-700">
          {hours}:{minutes}
        </span>
      </div>
    </div>
  );
};

// Custom input component
const CustomInput = forwardRef(({ value, onClick, placeholder, onClear }, ref) => (
  <div className="relative group" onClick={onClick} ref={ref}>
    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
      <Calendar className="h-5 w-5 text-indigo-500" />
    </div>
    <input
      type="text"
      readOnly
      className="w-full pl-11 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 text-sm shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all font-medium"
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
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
));

export default function DateTimePicker({
  selectedDate,
  onChange,
  minDate,
  placeholder = "Select date and time"
}) {
  // Convert ISO string to Date object if needed
  const dateValue = selectedDate ? new Date(selectedDate) : null;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDateChange = (date) => {
    if (!date) {
      onChange('');
      return;
    }

    // If there's an existing selected date, preserve the time
    if (selectedDate) {
      const existingDate = new Date(selectedDate);
      date.setHours(existingDate.getHours());
      date.setMinutes(existingDate.getMinutes());
    } else {
      // Set default time to current time rounded to next hour
      const now = new Date();
      date.setHours(now.getHours() + 1);
      date.setMinutes(0);
    }

    // Construct local ISO string YYYY-MM-DDTHH:mm
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const isoString = localDate.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} at ${hours}:${minutes}`;
  };

  return (
    <div className="relative w-full space-y-3">
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
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .react-datepicker__header {
          background: white;
          border-bottom: none;
          padding: 0;
        }
        .react-datepicker__current-month {
          display: none;
        }
        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0.5rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          margin: 0;
        }
        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 600;
          font-size: 0.75rem;
          width: 2.5rem;
          line-height: 2rem;
          margin: 0;
          text-transform: uppercase;
        }
        .react-datepicker__month {
          margin: 0;
          padding: 0.75rem;
        }
        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }
        .react-datepicker__day {
          width: 2.5rem;
          height: 2.5rem;
          line-height: 2.5rem;
          margin: 0.125rem;
          border-radius: 0.5rem;
          color: #374151;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .react-datepicker__day:hover {
          background-color: #eef2ff;
          color: #4f46e5;
          transform: scale(1.05);
        }
        .react-datepicker__day--selected {
          background-color: #4f46e5 !important;
          color: white !important;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
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
          transform: none;
        }
        .react-datepicker__day--outside-month {
          color: #d1d5db;
        }
        
        /* Mobile adjustments */
        @media (max-width: 640px) {
          .react-datepicker {
            font-size: 0.9rem;
          }
          .react-datepicker__day {
            width: 2.25rem;
            height: 2.25rem;
            line-height: 2.25rem;
          }
        }
      `}</style>

      <DatePicker
        selected={dateValue}
        onChange={handleDateChange}
        minDate={minDate ? new Date(minDate) : new Date()}
        customInput={
          <CustomInput 
            placeholder={placeholder}
            onClear={() => onChange('')}
          />
        }
        renderCustomHeader={CustomHeader}
        dateFormat="MMM d, yyyy"
        placeholderText={placeholder}
        withPortal={isMobile}
        popperClassName="shadow-2xl"
        popperPlacement="bottom-start"
        calendarClassName="custom-calendar"
      />

      {/* Display selected date with formatted time */}
      {selectedDate && (
        <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-indigo-900">{formatDisplayDate(selectedDate)}</span>
          </div>
        </div>
      )}

      {/* Time Selector */}
      <TimeSelector 
        selectedDate={selectedDate} 
        onChange={onChange}
        minDate={minDate}
      />
    </div>
  );
}