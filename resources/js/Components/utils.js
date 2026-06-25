export function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const cleanStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const mIdx = parseInt(month, 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
                return `${parseInt(day, 10)} ${monthNames[mIdx]} ${year}`;
            }
        }
        const d = new Date(dateString);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        return dateString;
    } catch (e) {
        return dateString;
    }
}
