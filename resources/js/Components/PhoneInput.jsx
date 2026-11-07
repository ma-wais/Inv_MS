import React, { useId } from 'react';
import FloatingInput from './FloatingInput';
import { formatPhone, maskEdit } from './contactFormatting';

export default function PhoneInput({ id, name = 'phone', label = 'Phone number', value = '', onChange, error, ...props }) {
    const generatedId = useId();
    const formatted = formatPhone(value);
    return (
        <div>
            <div className="flex items-stretch gap-2">
                <span className="flex items-center rounded-xl border border-line bg-surface-muted px-3 text-sm font-semibold text-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" aria-hidden="true">+92</span>
                <FloatingInput
                    {...props}
                    id={id || generatedId}
                    name={name}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    label={label}
                    value={formatted}
                    error={error}
                    pattern="[1-9][0-9]{2} [0-9]{7}"
                    title="Enter a Pakistani number, for example 0300 1234567 or +92 300 1234567"
                    onChange={event => {
                        const next = maskEdit(event, formatPhone, formatted);
                        onChange?.({ target: { name, value: next ? `+92 ${next}` : '' } });
                    }}
                />
            </div>
        </div>
    );
}
