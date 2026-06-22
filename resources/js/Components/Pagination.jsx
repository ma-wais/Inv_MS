import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links, className = '' }) {
    if (!links || links.length <= 1) return null;
    
    return (
        <div className={`flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 ${className}`}>
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        link.active
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                </Link>
            ))}
        </div>
    );
}
