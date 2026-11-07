import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function SearchableSelect({ id, name, label, options = [], value, onChange, required = false, error, disabled = false, empty, className = '', dense = false }) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [active, setActive] = useState(0);
    const [position, setPosition] = useState({});
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const listRef = useRef(null);
    const normalized = useMemo(() => options.map(option => Array.isArray(option)
        ? { value: option[0], label: option[1] } : option), [options]);
    const selected = normalized.find(option => String(option.value) === String(value));
    const matches = useMemo(() => normalized.filter(option => String(option.label).toLowerCase().includes(search.trim().toLowerCase())), [normalized, search]);
    const visible = useMemo(() => [
        ...(empty !== undefined && !required && !search ? [{ value: '', label: empty }] : []),
        ...matches.slice(0, 100),
    ], [matches, search, empty, required]);

    function close(returnFocus = false) {
        setOpen(false);
        setSearch('');
        if (returnFocus) triggerRef.current?.focus();
    }
    function select(option) {
        onChange?.({ target: { name, value: option.value } });
        close(true);
    }
    function openPanel() {
        if (disabled) return;
        setActive(0);
        setSearch('');
        setOpen(true);
    }
    useEffect(() => {
        if (!open) return;
        function outside(event) {
            if (!containerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) close();
        }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    useLayoutEffect(() => {
        if (!open) return;
        function place() {
            const rect = triggerRef.current.getBoundingClientRect();
            const below = window.innerHeight - rect.bottom;
            const above = rect.top;
            const upwards = below < 250 && above > below;
            setPosition({
                left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
                width: Math.min(rect.width, window.innerWidth - 16),
                maxHeight: Math.max(100, Math.min(300, (upwards ? above : below) - 12)),
                ...(upwards ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            });
        }
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => {
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [open]);
    useEffect(() => {
        listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }, [active]);
    function keyDown(event) {
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        else if (event.key === 'Tab') close(true);
        else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActive(index => Math.max(0, Math.min(visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (visible[active]) select(visible[active]);
        }
    }
    return (
        <div className="relative w-full" ref={containerRef}>
            <select name={name} value={selected ? value : ''} required={required} disabled={disabled}
                tabIndex={-1} aria-hidden="true" className="sr-only pointer-events-none" onChange={() => {}}
                onInvalid={event => { event.preventDefault(); triggerRef.current?.focus(); openPanel(); }}>
                <option value="">{empty || 'Select an option'}</option>
                {selected && String(selected.value) !== '' && <option value={selected.value}>{selected.label}</option>}
            </select>
            <button type="button" id={inputId} ref={triggerRef} disabled={disabled}
                role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${inputId}-list` : undefined}
                aria-label={label || empty || 'Select an option'} aria-required={required} aria-invalid={Boolean(error)}
                aria-describedby={error ? `${inputId}-error` : undefined}
                onClick={() => open ? close() : openPanel()}
                onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openPanel(); } }}
                className={`relative flex w-full items-center justify-between gap-2 rounded-xl border bg-surface text-left text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-900 dark:text-slate-100 ${dense ? 'px-3 py-2 text-xs' : 'min-h-[50px] px-4 pb-2.5 pt-5 text-sm'} ${error ? 'border-red-400' : open ? 'border-emerald-500' : 'border-line dark:border-slate-700'} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
                <span className={`truncate ${selected ? '' : 'text-subtle'}`}>{selected?.label ?? empty ?? 'Select an option'}</span>
                <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-subtle transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                {!dense && <span className="absolute left-4 top-1.5 text-[10px] font-semibold uppercase text-muted">{label} {required && <span className="text-red-500">*</span>}</span>}
            </button>
            {open && createPortal(
                <div ref={panelRef} style={position} className="fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="shrink-0 border-b border-line-soft p-2 dark:border-slate-800">
                        <input autoFocus type="search" value={search} placeholder="Type to search…"
                            role="combobox" aria-label={`Search ${label || 'options'}`} aria-expanded="true" aria-controls={`${inputId}-list`}
                            aria-activedescendant={visible[active] ? `${inputId}-option-${active}` : undefined}
                            onKeyDown={keyDown} onChange={event => { setSearch(event.target.value); setActive(0); }}
                            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </div>
                    <div id={`${inputId}-list`} role="listbox" aria-label={label || 'Options'} ref={listRef} className="overflow-y-auto py-1">
                        {visible.map((option, index) => <div key={`${option.value}-${index}`} id={`${inputId}-option-${index}`}
                            role="option" aria-selected={String(value) === String(option.value)}
                            onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => select(option)}
                            className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm ${active === index ? 'bg-success-soft text-success-ink dark:bg-emerald-950 dark:text-emerald-200' : 'text-foreground dark:text-slate-200'}`}>
                            <span>{option.label}</span>{String(value) === String(option.value) && <span aria-hidden="true">✓</span>}
                        </div>)}
                    </div>
                    {visible.length === 0 && <p role="status" className="p-4 text-center text-sm text-muted">No matching options</p>}
                    {matches.length > 100 && <p role="status" className="border-t p-2 text-xs text-muted">Showing 100 of {matches.length}. Type to narrow the search.</p>}
                </div>, document.body)}
            {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-ink">{error}</p>}
        </div>
    );
}
