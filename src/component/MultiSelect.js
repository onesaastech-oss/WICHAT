import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export default function MultiSelect({
    options = [],
    selectedValues = [],
    onChange,
    placeholder = "Select options",
    label = "Select",
    allOptionLabel = "All Projects"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (value) => {
        let newValues;
        if (selectedValues.includes(value)) {
            newValues = selectedValues.filter(v => v !== value);
        } else {
            newValues = [...selectedValues, value];
        }
        onChange(newValues);
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            // Deselect all
            onChange([]);
        } else {
            // Select all
            onChange(options.map(opt => opt.value));
        }
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) {
            return allOptionLabel;
        }
        if (selectedValues.length === options.length) {
            return allOptionLabel;
        }
        if (selectedValues.length === 1) {
            const selected = options.find(opt => opt.value === selectedValues[0]);
            return selected ? selected.label : placeholder;
        }
        return `${selectedValues.length} projects selected`;
    };

    const isAllSelected = selectedValues.length === options.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-left text-sm flex items-center justify-between hover:border-indigo-400 transition-all"
            >
                <span className={selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                    {getDisplayText()}
                </span>
                <div className="flex items-center gap-1">
                    {selectedValues.length > 0 && selectedValues.length < options.length && (
                        <button
                            onClick={handleClearAll}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* Select All Option */}
                    <div
                        onClick={handleSelectAll}
                        className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white"
                    >
                        <span className="text-sm font-medium text-indigo-600">{allOptionLabel}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isAllSelected
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-gray-300'
                            }`}>
                            {isAllSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                    </div>

                    {/* Individual Options */}
                    {options.map((option) => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                onClick={() => handleToggle(option.value)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                            >
                                <span className="text-sm text-gray-700">{option.label}</span>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'border-gray-300'
                                    }`}>
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
