import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links, className = '' }) {
    if (!links || links.length <= 1) return null;
    
    return (
        <div className={`flex flex-wrap gap-2 border-t border-line-soft dark:border-slate-800 px-5 py-4 ${className}`}>
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        link.active
                            ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                            : 'bg-surface-hover dark:bg-slate-800 text-muted dark:text-slate-300 hover:bg-surface-hover dark:hover:bg-slate-700'
                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </Link>
            ))}
        </div>
    );
}
