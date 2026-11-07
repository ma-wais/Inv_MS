import React from 'react';

export default function ExportCSVButton({ data, columns, filename = 'report.csv' }) {
    const exportToCSV = () => {
        if (!data || !data.length) {
            alert('No data available to export.');
            return;
        }

        // Determine columns/headers
        const headers = columns ? columns.map(col => col.label) : Object.keys(data[0]);
        const keys = columns ? columns.map(col => col.key) : Object.keys(data[0]);

        // Escape helper
        const escapeCSVValue = (val) => {
            if (val === null || val === undefined) return '';
            let formatted = String(val).replace(/"/g, '""');
            // If the value contains comma, newline or quotes, wrap it in double quotes
            if (formatted.includes(',') || formatted.includes('\n') || formatted.includes('"')) {
                formatted = `"${formatted}"`;
            }
            return formatted;
        };

        // Construct CSV rows
        const csvRows = [];
        csvRows.push(headers.map(escapeCSVValue).join(','));

        for (const row of data) {
            const values = keys.map(key => {
                // Support nested paths (e.g. 'variant.sku')
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let current = row;
                    for (const part of parts) {
                        if (current === null || current === undefined) {
                            current = '';
                            break;
                        }
                        current = current[part];
                    }
                    return current;
                }
                return row[key];
            });
            csvRows.push(values.map(escapeCSVValue).join(','));
        }

        const csvContent = csvRows.join('\n');
        
        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-surface-muted focus:outline-none print:hidden transition-colors"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4 text-muted"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
            </svg>
            Export CSV
        </button>
    );
}
