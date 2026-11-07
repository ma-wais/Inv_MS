import React from 'react';
import FloatingInput from './FloatingInput';
import { formatCnic, maskEdit } from './contactFormatting';

export default function CnicInput({ value = '', onChange, name = 'cnic', ...props }) {
    const formatted = formatCnic(value);
    return <FloatingInput
        {...props}
        name={name}
        label={props.label || 'CNIC (13 digits)'}
        value={formatted}
        inputMode="numeric"
        autoComplete="off"
        maxLength={15}
        pattern="[0-9]{5}-[0-9]{7}-[0-9]"
        title="Enter 13 digits, for example 35202-1234567-1"
        onChange={event => onChange?.({ target: { name, value: maskEdit(event, formatCnic, formatted) } })}
    />;
}
