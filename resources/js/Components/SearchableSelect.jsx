import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
    id,
    name,
    label,
    options = [], // can be [{ value, label }] or [[value, label]]
    value,
    onChange,
    required = false,
    error,
    disabled = false,
    empty,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    // Normalize options format
    const normalizedOptions = options.map(opt => {
        if (Array.isArray(opt)) {
            return { value: opt[0], label: opt[1] };
        }
        return opt;
    });

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));
    
    const filteredOptions = normalizedOptions.filter(opt =>
        String(opt.label).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        if (onChange) {
            // Emulate a standard change event structure
            onChange({ target: { name, value: val } });
        }
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Display / Trigger */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`relative w-full rounded-xl border border-slate-200 bg-white px-4 pb-2.5 pt-5 text-sm text-slate-800 outline-none cursor-pointer select-none transition-all min-h-[50px] flex items-center justify-between ${
                    disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'hover:border-slate-300'
                } ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : ''} ${
                    error ? 'border-red-300 focus:border-red-500' : ''
                } ${className}`}
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : (isOpen ? (empty || 'Select option...') : '')}
                </span>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>

                {/* Floating Label */}
                <label
                    className={`absolute left-4 z-10 origin-[0] transform text-xs duration-150 cursor-pointer select-none uppercase font-semibold transition-all ${
                        selectedOption || isOpen
                            ? 'top-2 scale-75 -translate-y-0.5 text-slate-400'
                            : 'top-3.5 scale-100 translate-y-0 text-slate-400'
                    } ${isOpen ? 'text-emerald-500' : ''}`}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            </div>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 rounded-xl border border-slate-200 bg-white shadow-lg flex flex-col overflow-hidden">
                    {/* Search Input inside Dropdown */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
                        />
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto py-1">
                        {empty !== undefined && !search && (
                            <div
                                onClick={() => handleSelect('')}
                                className={`px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer italic ${
                                    !value ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''
                                }`}
                            >
                                {empty}
                            </div>
                        )}
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer flex justify-between items-center ${
                                            isSelected ? 'bg-emerald-50 text-emerald-800 font-semibold' : ''
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && (
                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                                No matching options
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-600 font-normal">{error}</p>}
        </div>
    );
}
