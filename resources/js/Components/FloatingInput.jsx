import React, { useId } from 'react';

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
    const generatedId = useId();
    const inputId = id || name || generatedId;

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
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
                className={`peer block w-full rounded-xl border border-line dark:border-slate-800 bg-surface dark:bg-slate-900 px-4 pb-2.5 pt-5 text-sm text-foreground dark:text-slate-100 outline-none transition-all focus:border-emerald-500 dark:focus:border-emerald-500 disabled:bg-surface-muted dark:disabled:bg-slate-800/60 disabled:text-muted dark:disabled:text-slate-500 ${
                    error ? 'border-red-300 focus:border-red-500' : ''
                } ${className}`}
                {...props}
                placeholder=" "
            />
            <label
                htmlFor={inputId}
                className="absolute left-4 top-2 z-10 origin-[0] -translate-y-0.5 scale-75 transform text-xs text-subtle dark:text-slate-500 duration-150 peer-placeholder-shown:translate-y-2.5 peer-placeholder-shown:scale-100 peer-focus:left-4 peer-focus:-translate-y-0.5 peer-focus:scale-75 peer-focus:text-emerald-500 dark:peer-focus:text-emerald-400 cursor-text select-none uppercase font-semibold"
            >
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-ink font-normal">{error}</p>}
        </div>
    );
}
