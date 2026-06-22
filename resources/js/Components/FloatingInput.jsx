import React from 'react';

export default function FloatingInput({
    id,
    name,
    type = 'text',
    label,
    value,
    onChange,
    required = false,
    error,
    disabled = false,
    placeholder = ' ', // space is required for peer-placeholder-shown to work
    className = '',
    step,
    ...props
}) {
    const inputId = id || name;

    return (
        <div className="relative w-full">
            <input
                id={inputId}
                name={name}
                type={type}
                step={step}
                value={value ?? ''}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`peer block w-full rounded-xl border border-slate-200 bg-white px-4 pb-2.5 pt-5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500 ${
                    error ? 'border-red-300 focus:border-red-500' : ''
                } ${className}`}
                {...props}
                placeholder=" "
            />
            <label
                htmlFor={inputId}
                className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-slate-400 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 cursor-text select-none uppercase font-semibold"
            >
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {error && <p className="mt-1 text-xs text-red-600 font-normal">{error}</p>}
        </div>
    );
}
