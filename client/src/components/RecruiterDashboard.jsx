import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    CheckCheck,
    ChevronDown,
    CircleHelp,
    FolderKanban,
    Grid2x2,
    LogOut,
    MapPin,
    Menu,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    Sparkles,
    UserRound,
    Users,
    X,
} from 'lucide-react';

export default function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeView, setActiveView] = useState('Overview');
    const [showComposer, setShowComposer] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const emptyJobForm = {
        title: '', department: '', location: '', employmentType: 'Full-time', experience: '',
        description: '', requirements: [], niceToHave: [], manager: '', recruiters: [], panel: [],
    };
    const [jobForm, setJobForm] = useState(emptyJobForm);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const authConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const navItems = ['Overview', 'Jobs', 'Candidates', 'Pipeline', 'Interviews', 'Tasks'];
    const pipelineStages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];

    useEffect(() => {
        fetchJobs();
        fetchApplications();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/jobs/recruiter/jobs', authConfig);
            setJobs(res.data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/jobs/applications/${user.id}`, authConfig);
            setApplications(res.data);
        } catch (err) {
            console.error('Error fetching applications:', err);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await axios.patch(`http://localhost:5001/api/jobs/applications/${appId}/status`, { status: newStatus }, authConfig);
            fetchApplications();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const stageGroups = useMemo(() => {
        return pipelineStages.map((stage) => {
            const items =
                stage === 'Interview'
                    ? applications.filter((app) => app.status === 'Interviewing')
                    : stage === 'Offer'
                        ? applications.filter((app) => app.status === 'Offered')
                        : applications.filter((app) => app.status === stage);

            return { stage, count: items.length, items };
        });
    }, [applications]);

    const stats = [
        { label: 'Open Positions', value: jobs.length, detail: 'Live roles', tone: 'indigo' },
        { label: 'Total Candidates', value: applications.length, detail: 'Across your jobs', tone: 'emerald' },
        { label: 'Interviews', value: applications.filter((app) => app.status === 'Interviewing').length, detail: 'Current stage', tone: 'violet' },
        { label: 'Offers', value: applications.filter((app) => app.status === 'Offered').length, detail: 'Current stage', tone: 'amber' },
    ];

    const handleCreateJob = async () => {
        if (step < 5) {
            setStep(step + 1);
            return;
        }

        setError('');
        setMessage('');

        const payload = {
            title: jobForm.title,
            description: jobForm.description,
            department: jobForm.department,
            location: jobForm.location,
            postedBy: user.id,
        };

        try {
            await axios.post('http://localhost:5001/api/jobs', payload, authConfig);
            setMessage('Job successfully published to the public board!');
            setShowComposer(false);
            setStep(1);
            setJobForm({ ...emptyJobForm });
            fetchJobs();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post job.');
        }
    };

    const openJobDetail = (job) => {
        setSelectedJob(job);
        setActiveView('JobDetail');
    };

    const openCandidateProfile = (candidate) => {
        setSelectedCandidate(candidate);
        setActiveView('CandidateProfile');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    const renderSidebar = () => (
        <aside className="hidden w-[252px] flex-col border-r border-slate-200 bg-[#F9FAFB] p-4 lg:flex">
            <div className="flex items-center gap-3 px-2 pb-4 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">A</div>
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                    <div className="text-sm font-semibold text-slate-900">AvantHire</div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-soft">
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
                {navItems.map((item) => {
                    const isActive = item === activeView || (item === 'Jobs' && activeView === 'JobDetail') || (item === 'Candidates' && activeView === 'CandidateProfile');
                    const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : item === 'Pipeline' ? FolderKanban : item === 'Interviews' ? CalendarClock : CheckCheck;
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => {
                                setActiveView(item);
                                setMobileNavOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                        >
                            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                            <span>{item}</span>
                            {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</div>
                {['Team', 'Settings'].map((item) => {
                    const Icon = item === 'Team' ? Users : Settings;
                    return (
                        <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeView === item ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                            <Icon size={16} className="text-slate-400" />
                            <span>{item}</span>
                        </button>
                    );
                })}
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700">
                    <LogOut size={16} className="text-slate-400" />
                    <span>Log out</span>
                </button>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
                    <UserRound size={16} className="text-slate-400" />
                    <span>Applicant portal</span>
                </button>
            </div>

            <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{user.name || 'Sanket Kanse'}</div>
                        <div className="truncate text-[11px] text-slate-500">Recruiting Lead</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="app-shell flex">
            {renderSidebar()}

            <AnimatePresence>
                {mobileNavOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden">
                        <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="h-full w-[84%] max-w-[280px] border-r border-slate-200 bg-[#F9FAFB] p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">A</div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                                        <div className="text-sm font-semibold text-slate-900">AvantHire</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    const isActive = item === activeView || (item === 'Jobs' && activeView === 'JobDetail') || (item === 'Candidates' && activeView === 'CandidateProfile');
                                    const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : item === 'Pipeline' ? FolderKanban : item === 'Interviews' ? CalendarClock : CheckCheck;
                                    return (
                                        <button key={item} type="button" onClick={() => {
                                            setActiveView(item);
                                            setMobileNavOpen(false);
                                        }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                                            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                            <span>{item}</span>
                                        </button>
                                    );
                                })}
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                    {['Team', 'Settings'].map((item) => {
                                        const Icon = item === 'Team' ? Users : Settings;
                                        return (
                                            <button key={item} type="button" onClick={() => {
                                                setActiveView(item);
                                                setMobileNavOpen(false);
                                            }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                                                <Icon size={16} className="text-slate-400" />
                                                <span>{item}</span>
                                            </button>
                                        );
                                    })}
                                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700">
                                        <LogOut size={16} className="text-slate-400" />
                                        <span>Log out</span>
                                    </button>
                                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
                                        <UserRound size={16} className="text-slate-400" />
                                        <span>Applicant portal</span>
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-w-0 flex-1">
                <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
                    <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setMobileNavOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 lg:hidden">
                                <Menu size={16} />
                            </button>
                            <div className="text-sm text-slate-500">
                                <span className="font-medium text-slate-400">ATS</span>
                                <span className="mx-2">/</span>
                                <span className="font-medium text-slate-700">{activeView}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input placeholder="Search jobs, candidates, notes..." className="w-[300px] rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-12 text-sm text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white" />
                                <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-500">⌘ K</div>
                            </div>
                            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                                <Bell size={16} />
                            </button>
                            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                                <CircleHelp size={16} />
                            </button>
                            <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500">
                                <Plus size={14} />
                                Create Job
                            </button>
                            <button type="button" onClick={handleLogout} className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 xl:inline-flex">
                                <LogOut size={14} />
                                Log out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {activeView === 'Overview' && (
                        <>
                            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Recruiting dashboard</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Good morning, Sanket</h1>
                                    <p className="mt-2 text-sm text-slate-500">Track your hiring activity and candidate pipeline.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                                    <Plus size={15} />
                                    Create Job
                                </button>
                            </div>

                            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="grid divide-x divide-slate-200 md:grid-cols-4">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="px-4 py-4">
                                            <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                <span>{stat.label}</span>
                                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stat.tone === 'indigo' ? 'bg-indigo-50 text-indigo-700' : stat.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : stat.tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {stat.detail}
                                                </span>
                                            </div>
                                            <div className="text-[28px] font-semibold tracking-[-0.06em] text-slate-900">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hiring pipeline</div>
                                            <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-900">Candidate funnel</h2>
                                        </div>
                                        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-600">This month <ChevronDown size={14} /></button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {stageGroups.slice(0, 3).map((group) => (
                                            <div key={group.stage} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                    <span>{group.stage}</span>
                                                    <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-600">{group.count}</span>
                                                </div>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(group.count * 12, 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                    Candidate summaries will appear when profile data is available.
                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'Jobs' && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Openings</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Jobs</h1>
                                    <p className="mt-2 text-sm text-slate-500">Manage your open positions and hiring activity.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                                    <Plus size={15} />
                                    Create Job
                                </button>
                            </div>

                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative max-w-md flex-1">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input placeholder="Search jobs..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-200" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['All', 'Active', 'Draft', 'Closed'].map((filter, index) => (
                                        <button key={filter} type="button" className={`rounded-xl px-3 py-2 text-[12px] font-medium transition ${index === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {jobs.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                                    <p className="text-sm text-slate-500">No job listings yet. Create your first opening to start hiring.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobs.map((job) => (
                                        <button key={job._id} type="button" onClick={() => openJobDetail(job)} className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                                <Building2 size={17} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="truncate text-[15px] font-semibold text-slate-800">{job.title}</div>
                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">Active</span>
                                                </div>
                                                <div className="mt-1 text-[12px] text-slate-500">{job.department} · {job.location} · Full-time</div>
                                            </div>
                                            <div className="hidden min-w-[180px] text-left md:block">
                                                <div className="text-[12px] text-slate-500">Hiring manager</div>
                                                <div className="text-sm font-medium text-slate-700">{user.name || 'Sanket Kanse'}</div>
                                            </div>
                                            <div className="hidden min-w-[110px] text-left md:block">
                                                <div className="text-[12px] text-slate-500">Candidates</div>
                                                <div className="text-sm font-semibold text-slate-800">{Math.max(18, Math.round(jobs.length * 7 + 2))}</div>
                                            </div>
                                            <div className="hidden min-w-[120px] text-left lg:block">
                                                <div className="text-[12px] text-slate-500">Progress</div>
                                                <div className="text-sm font-medium text-slate-700">Interviewing</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="hidden text-[12px] text-slate-500 xl:block">2h ago</div>
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                                                    <MoreHorizontal size={16} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'JobDetail' && selectedJob && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Job detail</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">{selectedJob.title}</h1>
                                    <p className="mt-2 text-sm text-slate-500">{selectedJob.department} · {selectedJob.location} · Active</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Edit</button>
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Share</button>
                                    <button type="button" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Pause hiring</button>
                                </div>
                            </div>

                            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                {[
                                    { label: 'Candidates', value: '124' },
                                    { label: 'New', value: '8' },
                                    { label: 'Screening', value: '24' },
                                    { label: 'Interview', value: '18' },
                                    { label: 'Offer', value: '6' },
                                    { label: 'Rejected', value: '68' },
                                ].map((metric) => (
                                    <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                                        <div className="mt-3 text-[26px] font-semibold tracking-[-0.05em] text-slate-900">{metric.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Job description</div>
                                        <p className="text-sm leading-7 text-slate-600">{selectedJob.description}</p>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Requirements</div>
                                        <ul className="space-y-3 text-sm text-slate-600">
                                            {['React', 'TypeScript', 'Next.js', 'Node.js', 'Product thinking'].map((item) => (
                                                <li key={item} className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" /> {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hiring team</div>
                                        <div className="space-y-3">
                                            {['Sanket Kanse', 'Aarohi', 'Riya', 'Product Lead'].map((person) => (
                                                <div key={person} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">{person.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-800">{person}</div>
                                                            <div className="text-[11px] text-slate-500">Recruiting</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                        Candidate matching will appear when profile data is available.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Pipeline' && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate pipeline</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">{selectedJob?.title || 'Select a job'}</h1>
                                    <p className="mt-2 text-sm text-slate-500">{selectedJob ? `${selectedJob.department} · ${selectedJob.location} · ${selectedJob.status}` : 'Choose a real job to view its pipeline.'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Edit</button>
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Share</button>
                                    <button type="button" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Pause hiring</button>
                                </div>
                            </div>

                            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                {[
                                    ['Candidates', applications.length],
                                    ['Screening', applications.filter((app) => app.status === 'Screening').length],
                                    ['Interview', applications.filter((app) => app.status === 'Interviewing').length],
                                    ['Offer', applications.filter((app) => app.status === 'Offered').length],
                                    ['Rejected', applications.filter((app) => app.status === 'Rejected').length],
                                    ['Hired', applications.filter((app) => app.status === 'Hired').length],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                                        <div className="mt-3 text-[26px] font-semibold tracking-[-0.05em] text-slate-900">{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto pb-2">
                                <div className="grid min-w-[980px] grid-cols-6 gap-4">
                                    {pipelineStages.map((stage) => {
                                        const items = stage === 'Interview' ? applications.filter((app) => app.status === 'Interviewing') : stage === 'Offer' ? applications.filter((app) => app.status === 'Offered') : applications.filter((app) => app.status === stage);
                                        return (
                                            <div key={stage} className="rounded-2xl border border-slate-200 bg-slate-50 p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                                                e.preventDefault();
                                                const id = e.dataTransfer.getData('applicationId');
                                                const app = applications.find((item) => item._id === id);
                                                if (app) {
                                                    const nextStatus = stage === 'Interview' ? 'Interviewing' : stage === 'Offer' ? 'Offered' : stage === 'Hired' ? 'Hired' : stage;
                                                    handleStatusChange(app._id, nextStatus);
                                                }
                                            }}>
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <div className="text-sm font-semibold text-slate-800">{stage}</div>
                                                    <div className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">{items.length}</div>
                                                </div>
                                                <div className="space-y-3">
                                                    {items.length === 0 ? (
                                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-[12px] text-slate-400">No candidates</div>
                                                    ) : (
                                                        items.map((item) => {
                                                            const candidateName = item.applicantId?.name || 'Unnamed applicant';
                                                            const role = item.jobId?.title || 'Untitled role';
                                                            return (
                                                                <div key={item._id} draggable onDragStart={(e) => e.dataTransfer.setData('applicationId', item._id)} onClick={() => openCandidateProfile(item)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                                                                    <div className="mb-3 flex items-start justify-between gap-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">{candidateName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                                            <div>
                                                                                <div className="text-sm font-semibold text-slate-800">{candidateName}</div>
                                                                                <div className="text-[11px] text-slate-500">{role}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                                                                        <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={11} /> {role}</span>
                                                                        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {item.jobId?.location || 'Location unavailable'}</span>
                                                                    </div>

                                                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                                                        {(item.jobId?.requirements || []).map((skill) => (
                                                                            <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{skill}</span>
                                                                        ))}
                                                                    </div>

                                                                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                                                                        <span>{stage}</span>
                                                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '2h ago'}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'CandidateProfile' && selectedCandidate && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-semibold text-indigo-700">
                                        {(selectedCandidate.applicantId?.name || 'Unnamed applicant').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate profile</div>
                                        <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">{selectedCandidate.applicantId?.name || 'Unnamed applicant'}</h1>
                                        <p className="mt-2 text-sm text-slate-500">{selectedCandidate.jobId?.title || 'Untitled role'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Move Stage</button>
                                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">Schedule Interview</button>
                                    <button type="button" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Send Email</button>
                                </div>
                            </div>

                            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-2"><UserRound size={14} /> {selectedCandidate.applicantId?.email || 'Email unavailable'}</span>
                                        <span className="flex items-center gap-2"><BriefcaseBusiness size={14} /> {selectedCandidate.jobId?.department || 'Department unavailable'}</span>
                                        <span className="flex items-center gap-2"><MapPin size={14} /> {selectedCandidate.jobId?.location || 'Location unavailable'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resume</div>
                                        {selectedCandidate.resumeUrl ? (
                                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">Open submitted resume</a>
                                        ) : (
                                            <p className="text-sm text-slate-500">No resume was submitted with this application.</p>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Skills</div>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedCandidate.jobId?.requirements || []).map((skill) => (
                                                <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-700">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate score</div>
                                        <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Overall</div>
                                            <div className="text-sm text-slate-500">No score available</div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Application timeline</div>
                                        <div className="space-y-4">
                                            {[[selectedCandidate.status || 'Applied', selectedCandidate.createdAt, 'Current application status']].map(([step, date, note]) => (
                                                <div key={step} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`mt-0.5 h-3 w-3 rounded-full ${index === 0 ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                                        
                                                    </div>
                                                    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="text-sm font-semibold text-slate-800">{step}</div>
                                                            <div className="text-[11px] text-slate-500">{date ? new Date(date).toLocaleDateString() : 'Date unavailable'}</div>
                                                        </div>
                                                        <p className="mt-1 text-[12px] text-slate-600">{note}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Candidates' && (
                        <div>
                            <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-5">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Talent pool</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Candidates</h1>
                                </div>
                                <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Invite candidate</button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {applications.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">No candidates in the pipeline yet.</div>
                                ) : (
                                    applications.slice(0, 6).map((item) => {
                                        const name = item.applicantId?.name || 'Unnamed applicant';
                                        const email = item.applicantId?.email || 'Email unavailable';
                                        return (
                                            <button key={item._id} type="button" onClick={() => openCandidateProfile(item)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">{name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-800">{name}</div>
                                                            <div className="text-[12px] text-slate-500">{email}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500">
                                                    <span>{item.jobId?.title || 'Role unavailable'}</span>
                                                    <span>•</span>
                                                    <span>{item.jobId?.location || 'Location unavailable'}</span>
                                                </div>
                                                <div className="mb-3 flex flex-wrap gap-1.5">
                                                    {['React', 'TypeScript', 'Node', 'Next.js'].map((skill) => (
                                                        <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{skill}</span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                                    <span className="text-[11px] text-slate-500">Stage</span>
                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{item.status || 'Applied'}</span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeView === 'Team' && (
                        <div>
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Hiring team</h1>
                                <p className="mt-2 text-sm text-slate-500">Manage the people who collaborate on your open roles.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="space-y-3">
                                    {['Sanket Kanse', 'Aarohi', 'Riya', 'Product Lead'].map((person, index) => (
                                        <div key={person} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{person.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{person}</div>
                                                    <div className="text-[12px] text-slate-500">{index === 0 ? 'Workspace owner' : index === 3 ? 'Hiring manager' : 'Recruiter'}</div>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Active</span>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={15} /> Invite teammate</button>
                            </div>
                        </div>
                    )}

                    {activeView === 'Settings' && (
                        <div>
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Settings</h1>
                                <p className="mt-2 text-sm text-slate-500">Configure your workspace preferences.</p>
                            </div>
                            <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Workspace name</span>
                                        <input defaultValue="Avant Labs" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-200 focus:bg-white" />
                                    </label>
                                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <span>
                                            <span className="block text-sm font-medium text-slate-800">Weekly hiring digest</span>
                                            <span className="mt-1 block text-[12px] text-slate-500">Receive a summary of pipeline activity.</span>
                                        </span>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
                                    </label>
                                    <button type="button" onClick={() => setMessage('Settings saved for this workspace.')} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Save changes</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>
                    )}
                </main>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2 backdrop-blur-lg lg:hidden">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
                    {['Overview', 'Jobs', 'Candidates', 'Pipeline'].map((item) => {
                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : FolderKanban;
                        return (
                            <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex flex-col items-center rounded-xl px-2 py-2 text-[11px] font-medium ${activeView === item ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>
                                <Icon size={16} />
                                <span className="mt-1">{item}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showComposer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                        <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">New role</div>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Create a new position</h2>
                                </div>
                                <button type="button" onClick={() => setShowComposer(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-5 flex items-center gap-2 overflow-x-auto">
                                {['01 Details', '02 Requirements', '03 Hiring Team', '04 Review', '05 Publish'].map((label, index) => (
                                    <div key={label} className={`flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${step === index + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>

                            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Job title</label>
                                        <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
                                        <input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
                                        <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Employment type</label>
                                        <input value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience</label>
                                        <input value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Required skills</label>
                                        <textarea value={jobForm.requirements.join(', ')} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Nice to have</label>
                                        <textarea value={jobForm.niceToHave.join(', ')} onChange={(e) => setJobForm({ ...jobForm, niceToHave: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Hiring manager</label>
                                        <input value={jobForm.manager} onChange={(e) => setJobForm({ ...jobForm, manager: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Recruiters</label>
                                        <input value={jobForm.recruiters.join(', ')} onChange={(e) => setJobForm({ ...jobForm, recruiters: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Interview panel</label>
                                        <input value={jobForm.panel.join(', ')} onChange={(e) => setJobForm({ ...jobForm, panel: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-200 focus:bg-white" />
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preview</div>
                                            <h3 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-900">{jobForm.title}</h3>
                                        </div>
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Active</span>
                                    </div>
                                    <div className="mb-4 flex flex-wrap gap-2 text-[12px] text-slate-500">
                                        <span>{jobForm.department}</span>
                                        <span>·</span>
                                        <span>{jobForm.location}</span>
                                        <span>·</span>
                                        <span>{jobForm.employmentType}</span>
                                        <span>·</span>
                                        <span>{jobForm.experience}</span>
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">{jobForm.description}</p>
                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Required skills</div>
                                            <div className="flex flex-wrap gap-2">
                                                {jobForm.requirements.map((item) => (
                                                    <span key={item} className="rounded-full bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nice to have</div>
                                            <div className="flex flex-wrap gap-2">
                                                {jobForm.niceToHave.map((item) => (
                                                    <span key={item} className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-[11px] font-medium text-indigo-700">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600">
                                        <Sparkles size={18} />
                                    </div>
                                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-900">Ready to publish</h3>
                                    <p className="mt-2 text-sm text-slate-600">This will go live to your candidate list and appear in the public jobs board.</p>
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between">
                                <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700">Back</button>
                                <button type="button" onClick={handleCreateJob} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">{step === 5 ? 'Publish' : 'Continue'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
