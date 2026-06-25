import React, { useState, useEffect } from 'react';

const COUNTRIES = [
    { code: '+1', name: 'US/CA', flag: '🇺🇸', format: '(XXX) XXX-XXXX' },
    { code: '+44', name: 'GB', flag: '🇬🇧', format: 'XXXX XXXXXX' },
    { code: '+91', name: 'IN', flag: '🇮🇳', format: 'XXXXX-XXXXX' },
    { code: '+92', name: 'PK', flag: '🇵🇰', format: 'XXX XXXXXXX' },
    { code: '+61', name: 'AU', flag: '🇦🇺', format: 'XXX XXX XXX' },
    { code: '+971', name: 'AE', flag: '🇦🇪', format: 'X XXX XXXX' },
    { code: '+966', name: 'SA', flag: '🇸🇦', format: 'X XXX XXXX' },
    { code: '+974', name: 'QA', flag: '🇶🇦', format: 'XXXX XXXX' },
    { code: '+965', name: 'KW', flag: '🇰🇼', format: 'XXXX XXXX' },
    { code: '+968', name: 'OM', flag: '🇴🇲', format: 'XXXX XXXX' },
    { code: '+973', name: 'BH', flag: '🇧🇭', format: 'XXXX XXXX' },
];

export default function PhoneInput({
    id,
    name,
    label = 'Phone Number',
    value = '',
    onChange,
    required = false,
    error,
    disabled = false,
    className = '',
    ...props
}) {
    const inputId = id || name;

    const parsePhone = (val) => {
        const str = val ? String(val).trim() : '';
        if (!str) return { code: '+1', raw: '' };
        
        // Find longest matching country code
        const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
        for (const c of sorted) {
            if (str.startsWith(c.code)) {
                const raw = str.substring(c.code.length).trim();
                return { code: c.code, raw };
            }
        }
        return { code: '+1', raw: str };
    };

    const { code: parsedCode, raw: parsedRaw } = parsePhone(value);
    
    const [selectedCode, setSelectedCode] = useState(parsedCode);
    const [rawInput, setRawInput] = useState(parsedRaw);

    useEffect(() => {
        const { code, raw } = parsePhone(value);
        setSelectedCode(code);
        setRawInput(raw);
    }, [value]);

    const formatNumber = (digits, format) => {
        let formatted = '';
        let digitIndex = 0;
        for (let i = 0; i < format.length; i++) {
            if (digitIndex >= digits.length) break;
            if (format[i] === 'X') {
                formatted += digits[digitIndex];
                digitIndex++;
            } else {
                formatted += format[i];
            }
        }
        if (digitIndex < digits.length) {
            formatted += digits.substring(digitIndex);
        }
        return formatted;
    };

    const handleCodeChange = (e) => {
        const newCode = e.target.value;
        setSelectedCode(newCode);
        const country = COUNTRIES.find(c => c.code === newCode) || COUNTRIES[0];
        const digits = rawInput.replace(/\D/g, '');
        const formatted = formatNumber(digits, country.format);
        
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: newCode + ' ' + formatted
                }
            });
        }
    };

    const handleNumberChange = (e) => {
        const val = e.target.value;
        const digits = val.replace(/\D/g, '');
        const country = COUNTRIES.find(c => c.code === selectedCode) || COUNTRIES[0];
        const formatted = formatNumber(digits, country.format);
        
        setRawInput(formatted);
        
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: selectedCode + ' ' + formatted
                }
            });
        }
    };

    return (
        <div className="relative w-full">
            <div className={`flex rounded-xl border border-slate-200 bg-white outline-hidden focus-within:border-emerald-500 transition-all ${
                error ? 'border-red-300 focus-within:border-red-500' : ''
            } ${className}`}>
                {/* Country Code Dropdown */}
                <div className="relative border-r border-slate-200 bg-slate-50 rounded-l-xl shrink-0 flex items-center">
                    <select
                        value={selectedCode}
                        onChange={handleCodeChange}
                        disabled={disabled}
                        className="h-full bg-transparent pl-3 pr-8 py-2 text-sm text-slate-700 outline-none cursor-pointer rounded-l-xl appearance-none font-medium"
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.code + c.name} value={c.code}>
                                {c.flag} {c.code}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2.5 pointer-events-none text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Raw input text */}
                <div className="relative flex-1">
                    <input
                        id={inputId}
                        name={name}
                        type="text"
                        value={rawInput}
                        onChange={handleNumberChange}
                        required={required}
                        disabled={disabled}
                        className="peer block w-full rounded-r-xl border-none bg-transparent px-4 pb-2.5 pt-5 text-sm text-slate-800 outline-none placeholder-transparent focus:ring-0 focus:outline-hidden"
                        placeholder=" "
                        {...props}
                    />
                    <label
                        htmlFor={inputId}
                        className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-slate-400 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
                    >
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-red-600 font-normal">{error}</p>}
        </div>
    );
}
