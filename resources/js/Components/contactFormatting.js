export function phoneDigits(value) {
    let digits = String(value ?? '').replace(/\D/g, '');
    if (digits.startsWith('0092')) digits = digits.slice(4);
    else if (digits.startsWith('92') && digits.length > 10) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    return digits.slice(0, 10);
}

export function formatPhone(value) {
    const digits = phoneDigits(value);
    return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
}

export function formatCnic(value) {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 13);
    return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12)].filter(Boolean).join('-');
}

// Deleting a separator should also remove the adjacent digit, instead of trapping the caret.
export function maskEdit(event, format, previousValue) {
    const input = event.target;
    const caret = input.selectionStart ?? input.value.length;
    let value = input.value;
    if (event.nativeEvent?.inputType === 'deleteContentBackward' && /\D/.test(previousValue[caret] ?? '')) {
        value = value.slice(0, Math.max(0, caret - 1)) + value.slice(caret);
    }
    const digitOffset = value.slice(0, caret).replace(/\D/g, '').length;
    const formatted = format(value);
    let position = 0;
    let count = 0;
    while (position < formatted.length && count < digitOffset) {
        if (/\d/.test(formatted[position])) count++;
        position++;
    }
    requestAnimationFrame(() => {
        if (document.activeElement === input) input.setSelectionRange(position, position);
    });
    return formatted;
}
