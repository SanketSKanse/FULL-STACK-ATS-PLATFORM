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
        primary: 'bg-[#242424] text-[#F3EDE2] shadow-sm hover:bg-black',
        secondary: 'bg-white text-[#2B2B2B] border border-[#D8D1C7] hover:bg-[#FAF7F2]',
        subtle: 'bg-[#EAE3D5] text-[#2B2B2B] hover:bg-[#D8D1C7]',
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
        <aside className="flex w-[252px] flex-col border-r border-[#383838] bg-[#1E1E1E] px-4 py-5 text-white">
            <div className="flex items-center gap-3 px-2 pb-4 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242424] text-sm font-bold text-[#F3EDE2] border border-[#383838] shadow-sm">A</div>
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                    <div className="text-sm font-bold text-white">AvantHire</div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#383838] bg-[#242424] px-3 py-2.5 shadow-sm">
                <div className="mb-1 flex items-center justify-between text-[11px] font-medium" style={{ color: '#B5AEA4' }}>
                    <span style={{ color: '#B5AEA4' }}>Workspace</span>
                    <ChevronDown size={14} style={{ color: '#B5AEA4' }} />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E1E1E] text-[11px] font-bold text-white">A</div>
                    <div>
                        <div className="text-sm font-bold text-white">Avant Labs</div>
                        <div className="text-[11px]" style={{ color: '#B5AEA4' }}>Global hiring</div>
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
                                ? 'bg-[#242424] text-white font-bold border border-[#383838]'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                            <span>{label}</span>
                            {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 border-t border-[#383838] pt-4">
                <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</div>
                {secondaryLinks.map(({ label, icon: Icon }) => (
                    <button key={label} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                        <Icon size={16} className="text-slate-400" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto rounded-2xl border border-[#383838] bg-[#242424] p-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E1E1E] text-xs font-bold text-white border border-[#383838]">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-white">{user.name}</div>
                        <div className="truncate text-[11px]" style={{ color: '#B5AEA4' }}>{user.role}</div>
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
                            className="w-[280px] rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] py-2.5 pl-9 pr-12 text-sm text-[#2B2B2B] outline-none transition focus:border-[#242424] focus:bg-white"
                        />
                        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-[#D8D1C7] bg-white px-1.5 py-1 text-[10px] font-semibold text-[#5E5953]">
                            ⌘ K
                        </div>
                    </div>

                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8D1C7] bg-white text-[#2B2B2B] transition hover:bg-[#FAF7F2]">
                        <Bell size={16} />
                    </button>
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8D1C7] bg-white text-[#2B2B2B] transition hover:bg-[#FAF7F2]">
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
        <div className="mb-6 rounded-[20px] border border-[#D8D1C7] bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                {eyebrow && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A746D]">{eyebrow}</div>}
                <h1 className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#2B2B2B]">{title}</h1>
                {description && <p className="mt-2 max-w-xl text-sm text-[#5E5953]">{description}</p>}
            </div>
            <div>{actions}</div>
        </div>
    );
}

export function MetricCard({ label, value, detail, positive = true, sublabel }) {
    return (
        <div className="min-w-0 flex-1 border-l border-[#D8D1C7] first:border-l-0 px-4 py-3 first:pl-0">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A746D]">
                <span>{label}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${positive ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-rose-50 text-rose-600'}`}>
                    {positive ? '▲' : '▼'} {detail}
                </span>
            </div>
            <div className="text-2xl font-semibold tracking-[-0.06em] text-[#2B2B2B]">{value}</div>
            <div className="mt-1 text-xs text-[#5E5953]">{sublabel}</div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const variants = {
        Active: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]',
        Applied: 'bg-[#FAF7F2] text-[#2B2B2B] ring-1 ring-[#D8D1C7]',
        Screening: 'bg-[#FEF7E0] text-[#B06000] ring-1 ring-[#FEEFC3]',
        Shortlisted: 'bg-[#EAE3D5] text-[#2B2B2B] ring-1 ring-[#D8D1C7]',
        Interview: 'bg-[#EAE3D5] text-[#2B2B2B] ring-1 ring-[#D8D1C7]',
        Offer: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]',
        Hired: 'bg-[#E6F4EA] text-[#137333] ring-1 ring-[#CEEAD6]',
        Rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        Draft: 'bg-[#FAF7F2] text-[#5E5953] ring-1 ring-[#D8D1C7]',
        Closed: 'bg-[#EAE3D5] text-[#7A746D] ring-1 ring-[#D8D1C7]',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${variants[status] || 'bg-[#FAF7F2] text-[#2B2B2B] ring-1 ring-[#D8D1C7]'}`}>
            {status}
        </span>
    );
}

export function MatchScore({ value, tone = 'oatmeal' }) {
    const tones = {
        oatmeal: 'bg-[#EAE3D5] text-[#2B2B2B] border border-[#D8D1C7]',
        emerald: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
        amber: 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]',
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${tones[tone] || tones.oatmeal}`}>
            <Sparkles size={12} />
            {value}% Match
        </span>
    );
}

export function EmptyState({ title, description, actionLabel, onAction }) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8D1C7] bg-[#FAF7F2]/40 px-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#5E5953] shadow-sm ring-1 ring-[#D8D1C7]">
                <FolderKanban size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[#2B2B2B]">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-[#5E5953]">{description}</p>
            {actionLabel && (
                <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
            )}
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="animate-pulse rounded-2xl border border-[#D8D1C7] bg-white p-4">
            <div className="mb-4 h-4 w-28 rounded bg-[#EAE3D5]" />
            <div className="space-y-3">
                <div className="h-3 w-full rounded bg-[#EAE3D5]" />
                <div className="h-3 w-5/6 rounded bg-[#EAE3D5]" />
                <div className="h-3 w-2/3 rounded bg-[#EAE3D5]" />
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
        <div className={`rounded-2xl border border-[#D8D1C7] bg-white p-3 transition ${compact ? 'hover:bg-[#FAF7F2]' : 'hover:shadow-sm'}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#242424] text-[11px] font-semibold text-[#F3EDE2]">
                        {initials}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-[#2B2B2B]">{candidate.name}</div>
                        <div className="text-[12px] text-[#5E5953]">{candidate.role}</div>
                    </div>
                </div>
                <MatchScore value={candidate.match || 92} tone={candidate.match >= 80 ? 'emerald' : candidate.match >= 50 ? 'oatmeal' : 'amber'} />
            </div>

            <div className="mb-3 flex items-center gap-3 text-[11px] text-[#5E5953]">
                <div className="flex items-center gap-1"><UserRound size={12} /> {candidate.experience}</div>
                <div className="flex items-center gap-1"><MapPin size={12} /> {candidate.location}</div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
                {candidate.skills?.slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-full bg-[#FAF7F2] border border-[#D8D1C7] px-2 py-1 text-[10px] font-medium text-[#2B2B2B]">{skill}</span>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#D8D1C7] pt-2.5 text-[11px] text-[#5E5953]">
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
            className="group flex w-full items-center gap-4 rounded-2xl border border-[#D8D1C7] bg-white p-3 text-left transition hover:border-[#242424] hover:bg-[#FAF7F2]"
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#2B2B2B] border border-[#D8D1C7]">
                <Building2 size={16} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <div className="truncate text-[15px] font-semibold text-[#2B2B2B]">{job.title}</div>
                    <StatusBadge status={job.status || 'Active'} />
                </div>
                <div className="mt-1 text-[12px] text-[#5E5953]">{job.department} · {job.location} · Full-time</div>
            </div>

            <div className="hidden min-w-[180px] text-left md:block">
                <div className="text-[12px] text-[#5E5953]">Hiring manager</div>
                <div className="text-sm font-medium text-[#2B2B2B]">{job.hiringManager || 'Sanket Kanse'}</div>
            </div>

            <div className="hidden min-w-[110px] text-left md:block">
                <div className="text-[12px] text-[#5E5953]">Candidates</div>
                <div className="text-sm font-semibold text-[#2B2B2B]">{job.candidates || 24}</div>
            </div>

            <div className="hidden min-w-[120px] text-left lg:block">
                <div className="text-[12px] text-[#5E5953]">Progress</div>
                <div className="text-sm font-medium text-[#2B2B2B]">{job.progress || 'Interviewing'}</div>
            </div>

            <div className="hidden min-w-[80px] text-left xl:block">
                <div className="text-[12px] text-[#5E5953]">Updated</div>
                <div className="text-sm font-medium text-[#2B2B2B]">{job.updated || '2h ago'}</div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8D1C7] bg-white text-[#5E5953] transition group-hover:border-[#242424] group-hover:bg-[#FAF7F2]">
                <MoreHorizontal size={16} />
            </div>
        </button>
    );
}

export function SearchInput({ placeholder = 'Search...', className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A746D]" />
            <input
                placeholder={placeholder}
                className="w-full rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] py-2.5 pl-9 pr-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#242424] focus:bg-white"
            />
        </div>
    );
}

export function FilterBar({ filters = ['All', 'Active', 'Draft', 'Closed'] }) {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#D8D1C7] bg-white p-2">
            {filters.map((filter, index) => (
                <button
                    key={filter}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${index === 0 ? 'bg-[#242424] text-[#F3EDE2]' : 'text-[#2B2B2B] hover:bg-[#FAF7F2]'}`}
                >
                    {filter}
                </button>
            ))}
            <div className="ml-auto hidden items-center gap-2 md:flex">
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-3 py-2 text-[12px] font-medium text-[#2B2B2B] hover:bg-[#FAF7F2]">
                    <ListFilter size={14} />
                    Department
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-3 py-2 text-[12px] font-medium text-[#2B2B2B] hover:bg-[#FAF7F2]">
                    <MapPin size={14} />
                    Location
                </button>
            </div>
        </div>
    );
}

export function SectionLabel({ children }) {
    return <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A746D]">{children}</div>;
}

export function SummaryStat({ label, value, hint, tone = 'oatmeal' }) {
    const tones = {
        oatmeal: 'bg-[#EAE3D5] text-[#2B2B2B] border border-[#D8D1C7]',
        amber: 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]',
        emerald: 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]',
        rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    };

    return (
        <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">{label}</div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone] || tones.oatmeal}`}>{hint}</span>
            </div>
            <div className="text-[26px] font-semibold tracking-[-0.05em] text-[#2B2B2B]">{value}</div>
        </div>
    );
}

export function ActivityItem({ title, meta, time, active = false }) {
    return (
        <div className="relative pl-6">
            <div className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${active ? 'bg-[#242424] ring-4 ring-[#EAE3D5]' : 'bg-[#D8D1C7]'}`} />
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-[#2B2B2B]">{title}</div>
                    <div className="mt-1 text-[12px] text-[#5E5953]">{meta}</div>
                </div>
                <div className="text-[11px] text-[#7A746D]">{time}</div>
            </div>
        </div>
    );
}

export function MiniIconButton({ children, className = '' }) {
    return (
        <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8D1C7] bg-white text-[#2B2B2B] transition hover:bg-[#FAF7F2] ${className}`}>
            {children}
        </button>
    );
}

export { ArrowUpRight, Bell, BriefcaseBusiness, Building2, CalendarClock, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Grid2x2, ListFilter, MapPin, MoreHorizontal, Plus, Search, Settings, Sparkles, UserRound, Users };