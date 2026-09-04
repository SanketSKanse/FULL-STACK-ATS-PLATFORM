import React from 'react';
import {
    ArrowUpRight,
    Bell,
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    CheckCheck,
    ChevronDown,
    ChevronRight,
    CircleHelp,
    FolderKanban,
    Grid2x2,
    ListFilter,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    Sparkles,
    UserRound,
    Users,
} from 'lucide-react';

export function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-100 hover:bg-indigo-500',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
        subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
    };

    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function Sidebar({ active = 'Overview', user = { name: 'Sanket Kanse', role: 'Recruiting Lead' } }) {
    const links = [
        { label: 'Overview', icon: Grid2x2 },
        { label: 'Jobs', icon: BriefcaseBusiness },
        { label: 'Candidates', icon: Users },
        { label: 'Pipeline', icon: FolderKanban },
        { label: 'Interviews', icon: CalendarClock },
        { label: 'Tasks', icon: CheckCheck },
    ];

    const secondaryLinks = [
        { label: 'Team', icon: Users },
        { label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="flex w-[252px] flex-col border-r border-slate-200 bg-[#F9FAFB] px-4 py-5">
            <div className="flex items-center gap-3 px-2 pb-4 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">A</div>
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                    <div className="text-sm font-semibold text-slate-900">AvantHire</div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
                <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Workspace</span>
                    <ChevronDown size={14} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">A</div>
                    <div>
                        <div className="text-sm font-semibold text-slate-800">Avant Labs</div>
                        <div className="text-[11px] text-slate-500">Global hiring</div>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-1">
                {links.map(({ label, icon: Icon }) => {
                    const isActive = active === label;
                    return (
                        <button
                            key={label}
                            type="button"
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.08)]'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                            <span>{label}</span>
                            {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</div>
                {secondaryLinks.map(({ label, icon: Icon }) => (
                    <button key={label} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                        <Icon size={16} className="text-slate-400" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{user.name}</div>
                        <div className="truncate text-[11px] text-slate-500">{user.role}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function TopBar({ title = 'Overview', actions, searchPlaceholder = 'Search jobs, candidates, notes...' }) {
    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="flex h-20 items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                        <ChevronRight size={14} className="rotate-180" />
                    </div>
                    <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-400">ATS</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-slate-700">{title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder={searchPlaceholder}
                            className="w-[280px] rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-12 text-sm text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white"
                        />
                        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-500">
                            ⌘ K
                        </div>
                    </div>

                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                        <Bell size={16} />
                    </button>
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                        <CircleHelp size={16} />
                    </button>
                    {actions}
                </div>
            </div>
        </header>
    );
}

export function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
                {eyebrow && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</div>}
                <h1 className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{title}</h1>
                {description && <p className="mt-2 max-w-xl text-sm text-slate-500">{description}</p>}
            </div>
            <div>{actions}</div>
        </div>
    );
}

export function MetricCard({ label, value, detail, positive = true, sublabel }) {
    return (
        <div className="min-w-0 flex-1 border-l border-slate-200 first:border-l-0 px-4 py-3 first:pl-0">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <span>{label}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                    {positive ? '▲' : '▼'} {detail}
                </span>
            </div>
            <div className="text-2xl font-semibold tracking-[-0.06em] text-slate-900">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{sublabel}</div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const variants = {
        Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        Applied: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        Screening: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
        Shortlisted: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
        Interview: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
        Offer: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        Hired: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
        Rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
        Draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        Closed: 'bg-slate-200 text-slate-700 ring-1 ring-slate-300',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[status] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
            {status}
        </span>
    );
}

export function MatchScore({ value, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-indigo-100 text-indigo-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${tones[tone]}`}>
            <Sparkles size={12} />
            {value}% Match
        </span>
    );
}

export function EmptyState({ title, description, actionLabel, onAction }) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                <FolderKanban size={18} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
            {actionLabel && (
                <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 h-4 w-28 rounded bg-slate-200" />
            <div className="space-y-3">
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-5/6 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
            </div>
        </div>
    );
}

export function CandidateCard({ candidate, compact = false }) {
    const initials = candidate.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className={`rounded-2xl border border-slate-200 bg-white p-3 transition ${compact ? 'hover:bg-slate-50' : 'hover:shadow-sm'}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                        {initials}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-800">{candidate.name}</div>
                        <div className="text-[12px] text-slate-500">{candidate.role}</div>
                    </div>
                </div>
                <MatchScore value={candidate.match || 92} />
            </div>

            <div className="mb-3 flex items-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1"><UserRound size={12} /> {candidate.experience}</div>
                <div className="flex items-center gap-1"><MapPin size={12} /> {candidate.location}</div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
                {candidate.skills?.slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{skill}</span>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-[11px] text-slate-500">
                <span>{candidate.stage}</span>
                <span>{candidate.time}</span>
            </div>
        </div>
    );
}

export function JobRow({ job, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Building2 size={16} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className="truncate text-[15px] font-semibold text-slate-800">{job.title}</div>
                    <StatusBadge status={job.status || 'Active'} />
                </div>
                <div className="mt-1 text-[12px] text-slate-500">{job.department} · {job.location} · Full-time</div>
            </div>

            <div className="hidden min-w-[180px] text-left md:block">
                <div className="text-[12px] text-slate-500">Hiring manager</div>
                <div className="text-sm font-medium text-slate-700">{job.hiringManager || 'Sanket Kanse'}</div>
            </div>

            <div className="hidden min-w-[110px] text-left md:block">
                <div className="text-[12px] text-slate-500">Candidates</div>
                <div className="text-sm font-semibold text-slate-800">{job.candidates || 24}</div>
            </div>

            <div className="hidden min-w-[120px] text-left lg:block">
                <div className="text-[12px] text-slate-500">Progress</div>
                <div className="text-sm font-medium text-slate-700">{job.progress || 'Interviewing'}</div>
            </div>

            <div className="hidden min-w-[80px] text-left xl:block">
                <div className="text-[12px] text-slate-500">Updated</div>
                <div className="text-sm font-medium text-slate-700">{job.updated || '2h ago'}</div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-slate-300 group-hover:bg-slate-100">
                <MoreHorizontal size={16} />
            </div>
        </button>
    );
}

export function SearchInput({ placeholder = 'Search...', className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white"
            />
        </div>
    );
}

export function FilterBar({ filters = ['All', 'Active', 'Draft', 'Closed'] }) {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            {filters.map((filter, index) => (
                <button
                    key={filter}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${index === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    {filter}
                </button>
            ))}
            <div className="ml-auto hidden items-center gap-2 md:flex">
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
                    <ListFilter size={14} />
                    Department
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
                    <MapPin size={14} />
                    Location
                </button>
            </div>
        </div>
    );
}

export function SectionLabel({ children }) {
    return <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{children}</div>;
}

export function SummaryStat({ label, value, hint, tone = 'indigo' }) {
    const tones = {
        indigo: 'bg-indigo-50 text-indigo-700',
        amber: 'bg-amber-50 text-amber-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        violet: 'bg-violet-50 text-violet-700',
        rose: 'bg-rose-50 text-rose-700',
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone]}`}>{hint}</span>
            </div>
            <div className="text-[26px] font-semibold tracking-[-0.05em] text-slate-900">{value}</div>
        </div>
    );
}

export function ActivityItem({ title, meta, time, active = false }) {
    return (
        <div className="relative pl-6">
            <div className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${active ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-300'}`} />
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-slate-800">{title}</div>
                    <div className="mt-1 text-[12px] text-slate-500">{meta}</div>
                </div>
                <div className="text-[11px] text-slate-400">{time}</div>
            </div>
        </div>
    );
}

export function MiniIconButton({ children, className = '' }) {
    return (
        <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 ${className}`}>
            {children}
        </button>
    );
}

export { ArrowUpRight, Bell, BriefcaseBusiness, Building2, CalendarClock, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Grid2x2, ListFilter, MapPin, MoreHorizontal, Plus, Search, Settings, Sparkles, UserRound, Users };
