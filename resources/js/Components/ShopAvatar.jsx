export default function ShopAvatar({ name = 'Shop', logo, className = 'h-10 w-10' }) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    return logo
        ? <img src={logo} alt={`${name} logo`} className={`${className} shrink-0 rounded-xl border border-line bg-surface object-contain p-1`} />
        : <span aria-label={`${name} placeholder logo`} className={`${className} inline-flex shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-success-soft text-sm font-bold text-success-ink`}>{initials || 'S'}</span>;
}
