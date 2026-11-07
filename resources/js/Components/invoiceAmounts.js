export function returnCredit(item, quantity) {
    if (Number(quantity || 0) <= 0) return 0;
    const total = Number(item.net_total ?? item.line_total);
    const count = Number(item.quantity);
    const returned = Number(item.returned_quantity || 0);
    const credited = Number(item.credited_total || 0);
    const target = Math.round(total * Math.min(count, returned + Math.max(0, Number(quantity || 0))) / count * 10000) / 10000;
    return Math.round(Math.max(0, Math.min(target - credited, total - credited)) * 10000) / 10000;
}
