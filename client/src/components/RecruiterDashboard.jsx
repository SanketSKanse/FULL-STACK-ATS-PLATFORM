import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
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
    Trash2,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import CandidateMatchCard from './CandidateMatchCard';
import ApplicationTimeline from './ApplicationTimeline';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';

export default function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeView, setActiveView] = useState('Overview');
    const [showComposer, setShowComposer] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isDeletingJob, setIsDeletingJob] = useState(false);
    const [candidateJobFilter, setCandidateJobFilter] = useState('');
    const [pipelineJobFilter, setPipelineJobFilter] = useState('');
    const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
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
            return res.data;
        } catch (err) {
            console.error('Error fetching applications:', err);
            return [];
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            const res = await axios.patch(`http://localhost:5001/api/jobs/applications/${appId}/status`, { status: newStatus }, authConfig);
            const refreshedApplications = await fetchApplications();
            if (selectedCandidate?._id === appId) {
                const refreshedApp = (refreshedApplications || []).find((a) => a._id === appId);
                if (refreshedApp) {
                    setSelectedCandidate(refreshedApp);
                } else {
                    setSelectedCandidate((current) => ({
                        ...current,
                        status: newStatus,
                        statusHistory: res.data.statusHistory || current.statusHistory
                    }));
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update candidate status.');
        }
    };

    const handleJobStatusChange = async (job) => {
        const nextStatus = job.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED';
        try {
            const response = await axios.patch(`http://localhost:5001/api/jobs/recruiter/jobs/${job._id}/status`, { status: nextStatus }, authConfig);
            setJobs((current) => current.map((item) => item._id === job._id ? response.data.job : item));
            setSelectedJob((current) => current?._id === job._id ? response.data.job : current);
            setMessage(response.data.message);
            if (nextStatus === 'CLOSED') setActiveView('Jobs');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update job status.');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!jobId) return;
        setIsDeletingJob(true);
        setError('');
        setMessage('');
        try {
            const res = await axios.delete(`http://localhost:5001/api/jobs/recruiter/jobs/${jobId}`, authConfig);
            setJobs((current) => current.filter((j) => j._id !== jobId));
            setApplications((current) => current.filter((a) => (a.jobId?._id || a.jobId) !== jobId));
            if (selectedJob?._id === jobId) {
                setSelectedJob(null);
                setActiveView('Jobs');
            }
            setMessage(res.data.message || 'Job posting deleted successfully.');
            setJobToDelete(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete job posting.');
        } finally {
            setIsDeletingJob(false);
        }
    };

    const scheduleInterview = async (applicationId, event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            const response = await axios.patch(`http://localhost:5001/api/jobs/applications/${applicationId}/interview`, {
                scheduledAt: form.get('scheduledAt'),
                round: form.get('round'),
                location: form.get('location'),
                notes: form.get('notes'),
            }, authConfig);
            const refreshedApplications = await fetchApplications();
            const refreshedApplication = refreshedApplications.find((application) => application._id === applicationId);
            setSelectedCandidate((current) => current?._id === applicationId ? { ...current, ...(refreshedApplication || response.data.application) } : current);
            setMessage(response.data.message);
            formElement.reset();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to schedule interview.');
        }
    };

    const stageGroups = useMemo(() => {
        const pipelineApplications = applications.filter((application) => !pipelineJobFilter || application.jobId?._id === pipelineJobFilter || application.jobId === pipelineJobFilter);
        return pipelineStages.map((stage) => {
            const items =
                stage === 'Interview'
                    ? pipelineApplications.filter((app) => app.status === 'Interviewing')
                    : stage === 'Offer'
                        ? pipelineApplications.filter((app) => app.status === 'Offered')
                        : pipelineApplications.filter((app) => app.status === stage);

            return { stage, count: items.length, items };
        });
    }, [applications, pipelineJobFilter]);

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
            employmentType: jobForm.employmentType,
            requirements: jobForm.requirements,
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

    const handleRecruiterNotificationClick = (notif) => {
        if (notif.type === 'INTERVIEW_SCHEDULED') {
            setActiveView('Interviews');
        } else if (notif.metadata?.applicationId) {
            const app = applications.find(
                (a) => String(a._id) === String(notif.metadata.applicationId) || String(a._id) === String(notif.metadata.candidateId)
            );
            if (app) {
                openCandidateProfile(app);
            } else {
                setActiveView('Candidates');
            }
        } else if (notif.metadata?.jobId) {
            const job = jobs.find((j) => String(j._id) === String(notif.metadata.jobId));
            if (job) {
                openJobDetail(job);
            } else {
                setActiveView('Jobs');
            }
        } else {
            setActiveView('Overview');
        }
    };

    const selectedJobApplications = selectedJob
        ? applications.filter((application) => application.jobId?._id === selectedJob._id || application.jobId === selectedJob._id)
        : [];
    const filteredCandidates = applications.filter((application) => !candidateJobFilter || application.jobId?._id === candidateJobFilter || application.jobId === candidateJobFilter);
    const visibleJobs = jobs.filter((job) => jobStatusFilter === 'ALL' || job.status === jobStatusFilter);
    const todayInterviews = applications.filter((application) => {
        if (!application.interviewScheduledAt) return false;
        const interviewDate = new Date(application.interviewScheduledAt);
        const today = new Date();
        return interviewDate.toDateString() === today.toDateString();
    }).sort((left, right) => new Date(left.interviewScheduledAt) - new Date(right.interviewScheduledAt));

    const renderSidebar = () => (
        <aside className="ats-sidebar sticky top-0 hidden h-screen w-[252px] flex-col justify-between p-4 lg:flex">
            <div className="flex flex-1 min-h-0 flex-col">
                <div className="flex items-center gap-3 px-2 pb-4 pt-1 shrink-0">
                    <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-sm">A</div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                        <div className="text-sm font-bold text-white">AvantHire</div>
                    </div>
                </div>

                <div className="glass-box mt-3 rounded-2xl p-3 shadow-md shrink-0">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-300">
                        <span>Workspace</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="brand-badge flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold">A</div>
                        <div>
                            <div className="text-sm font-bold text-white">Avant Labs</div>
                            <div className="text-[11px] text-slate-300">Global hiring</div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
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
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                    isActive
                                        ? 'nav-item-active font-bold shadow-sm'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                <span>{item}</span>
                                {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                            </button>
                        );
                    })}

                    <div className="mt-4 border-t border-white/10 pt-3">
                        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</div>
                        {['Team', 'Settings'].map((item) => {
                            const Icon = item === 'Team' ? Users : Settings;
                            return (
                                <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeView === item ? 'nav-item-active font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                                    <Icon size={16} className={activeView === item ? 'text-white' : 'text-slate-400'} />
                                    <span>{item}</span>
                                </button>
                            );
                        })}
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300">
                            <LogOut size={16} />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pinned User Card at the very bottom of the sidebar */}
            <div className="glass-box mt-3 rounded-2xl p-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="user-name-text truncate text-sm font-bold">{user.name || 'Recruiter'}</div>
                        <div className="user-subtitle-text truncate text-[11px]">Recruiting Lead</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="app-shell flex min-h-screen">
            {renderSidebar()}

            <AnimatePresence>
                {mobileNavOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden">
                        <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="ats-sidebar h-full w-[84%] max-w-[280px] p-4 flex flex-col justify-between">
                            <div className="flex flex-1 min-h-0 flex-col">
                                <div className="mb-4 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-sm">A</div>
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                                            <div className="text-sm font-bold text-white">AvantHire</div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {navItems.map((item) => {
                                        const isActive = item === activeView || (item === 'Jobs' && activeView === 'JobDetail') || (item === 'Candidates' && activeView === 'CandidateProfile');
                                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : item === 'Pipeline' ? FolderKanban : item === 'Interviews' ? CalendarClock : CheckCheck;
                                        return (
                                            <button key={item} type="button" onClick={() => {
                                                setActiveView(item);
                                                setMobileNavOpen(false);
                                            }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'nav-item-active font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                                <span>{item}</span>
                                            </button>
                                        );
                                    })}
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        {['Team', 'Settings'].map((item) => {
                                            const Icon = item === 'Team' ? Users : Settings;
                                            return (
                                                <button key={item} type="button" onClick={() => {
                                                    setActiveView(item);
                                                    setMobileNavOpen(false);
                                                }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                                                    <Icon size={16} className="text-slate-400" />
                                                    <span>{item}</span>
                                                </button>
                                            );
                                        })}
                                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300">
                                            <LogOut size={16} />
                                            <span>Log out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-w-0 flex-1">
                <header className="ats-header sticky top-0 z-20">
                    <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setMobileNavOpen(true)} className="glass-box flex h-9 w-9 items-center justify-center rounded-xl lg:hidden">
                                <Menu size={16} />
                            </button>
                            <div className="text-sm text-slate-300">
                                <span className="font-medium text-slate-400">ATS</span>
                                <span className="mx-2 text-slate-400">/</span>
                                <span className="font-semibold heading-title">{activeView}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input placeholder="Search jobs, candidates, notes..." className="glass-input w-[300px] rounded-xl py-2.5 pl-9 pr-12 text-sm outline-none transition focus:border-indigo-400" />
                                <div className="glass-box absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold">⌘ K</div>
                            </div>

                            {/* Live Notification Dropdown for Recruiter */}
                            <NotificationDropdown onNotificationClick={handleRecruiterNotificationClick} />

                            {/* Theme Toggle Button (Light / Dark) */}
                            <ThemeToggle />

                            <button type="button" onClick={() => setShowComposer(true)} className="btn-header-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 shadow-sm">
                                <Plus size={14} />
                                Create Job
                            </button>
                            <button type="button" onClick={handleLogout} className="glass-box hidden items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition hover:bg-white/20 xl:inline-flex">
                                <LogOut size={14} />
                                Log out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {activeView === 'Overview' && (
                        <>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Recruiting dashboard</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">Good morning, {user.name || 'Recruiter'}</h1>
                                    <p className="mt-2 text-sm text-slate-300">Track your hiring activity and candidate pipeline.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
                                    <Plus size={15} />
                                    Create Job
                                </button>
                            </div>

                            <div className="glass-container mb-6 overflow-hidden rounded-2xl">
                                <div className="grid divide-x divide-white/10 md:grid-cols-4">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="px-5 py-4">
                                            <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                <span>{stat.label}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                                    stat.tone === 'indigo'
                                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                                                        : stat.tone === 'emerald'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                                        : stat.tone === 'violet'
                                                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                                                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                                }`}>
                                                    {stat.detail}
                                                </span>
                                            </div>
                                            <div className="text-[32px] font-bold tracking-[-0.06em] text-white">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                                <div className="glass-container rounded-2xl p-5">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hiring pipeline</div>
                                            <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-white">Candidate funnel</h2>
                                        </div>
                                        <button type="button" className="glass-box inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium text-white">This month <ChevronDown size={14} /></button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {stageGroups.slice(0, 3).map((group) => (
                                            <div key={group.stage} className="glass-box glass-component rounded-2xl p-4">
                                                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                    <span>{group.stage}</span>
                                                    <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white">{group.count}</span>
                                                </div>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(group.count * 12, 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-container rounded-2xl p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Today</div>
                                            <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-white">Interview schedule</h2>
                                        </div>
                                        <CalendarClock size={18} className="text-indigo-400" />
                                    </div>
                                    {todayInterviews.length === 0 ? (
                                        <p className="text-sm text-slate-400">No interviews scheduled for today.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {todayInterviews.map((interview) => (
                                                <button key={interview._id} type="button" onClick={() => openCandidateProfile(interview)} className="glass-box flex w-full items-center justify-between rounded-xl p-3 text-left transition hover:bg-white/15">
                                                    <span>
                                                        <span className="block text-sm font-bold text-white">{interview.applicantId?.name || 'Unnamed applicant'}</span>
                                                        <span className="block text-xs text-slate-300">{interview.jobId?.title || 'Job unavailable'} · {interview.interviewLocation || 'Location not set'}</span>
                                                    </span>
                                                    <span className="text-xs font-bold text-indigo-300">{new Date(interview.interviewScheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'Jobs' && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Openings</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">Jobs</h1>
                                    <p className="mt-2 text-sm text-slate-300">Manage your open positions and hiring activity.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-sm">
                                    <Plus size={15} />
                                    Create Job
                                </button>
                            </div>

                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative max-w-md flex-1">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input placeholder="Search jobs..." className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-indigo-400" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'ACTIVE', 'DRAFT', 'CLOSED'].map((filter) => (
                                        <button key={filter} type="button" onClick={() => setJobStatusFilter(filter)} className={`rounded-xl px-3.5 py-2 text-[12px] font-medium transition ${jobStatusFilter === filter ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'glass-box text-slate-300 hover:bg-white/15 hover:text-white'}`}>
                                            {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {visibleJobs.length === 0 ? (
                                <div className="glass-container rounded-2xl p-8 text-center">
                                    <p className="text-sm text-slate-300">No job listings yet. Create your first opening to start hiring.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {visibleJobs.map((job) => {
                                        const jobApplications = applications.filter((application) => application.jobId?._id === job._id || application.jobId === job._id);
                                        const interviewCount = jobApplications.filter((application) => application.status === 'Interviewing').length;
                                        return (
                                            <button key={job._id} type="button" onClick={() => openJobDetail(job)} className="glass-box flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition hover:bg-white/15 sm:flex-row sm:items-center">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                                    <Building2 size={17} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="truncate text-[15px] font-bold text-white">{job.title}</div>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${job.status === 'CLOSED' ? 'bg-slate-700/60 text-slate-300 border-slate-600' : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'}`}>{job.status === 'CLOSED' ? 'Closed' : 'Active'}</span>
                                                    </div>
                                                    <div className="mt-1 text-[12px] text-slate-300">{job.department} · {job.location} · {job.employmentType || 'Employment type unavailable'}</div>
                                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-300">{job.description || 'No job description provided.'}</p>
                                                </div>
                                                <div className="hidden min-w-[180px] text-left md:block">
                                                    <div className="text-[12px] text-slate-400">Hiring manager</div>
                                                    <div className="text-sm font-semibold text-white">{job.postedBy?.name || user.name || 'Recruiter'}</div>
                                                </div>
                                                <div className="hidden min-w-[110px] text-left md:block">
                                                    <div className="text-[12px] text-slate-400">Candidates</div>
                                                    <div className="text-sm font-bold text-white">{jobApplications.length}</div>
                                                </div>
                                                <div className="hidden min-w-[120px] text-left lg:block">
                                                    <div className="text-[12px] text-slate-400">Progress</div>
                                                    <div className="text-sm font-semibold text-indigo-300">{interviewCount} interviewing</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="hidden text-[12px] text-slate-400 xl:block">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date unavailable'}</div>
                                                    <button
                                                        type="button"
                                                        title="Delete job posting"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setJobToDelete(job);
                                                        }}
                                                        className="glass-box flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'JobDetail' && selectedJob && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Job detail</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">{selectedJob.title}</h1>
                                    <p className="mt-2 text-sm text-slate-300">{selectedJob.department} · {selectedJob.location} · {selectedJob.status || 'ACTIVE'}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" className="glass-box rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">Edit</button>
                                    <button type="button" className="glass-box rounded-xl px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">Share</button>
                                    <button type="button" onClick={() => handleJobStatusChange(selectedJob)} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">{selectedJob.status === 'CLOSED' ? 'Reopen hiring' : 'Pause hiring'}</button>
                                    <button
                                        type="button"
                                        onClick={() => setJobToDelete(selectedJob)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete Job</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                {[
                                    { label: 'Candidates', value: selectedJobApplications.length },
                                    { label: 'New', value: selectedJobApplications.filter((application) => application.status === 'Applied').length },
                                    { label: 'Screening', value: selectedJobApplications.filter((application) => application.status === 'Screening').length },
                                    { label: 'Interview', value: selectedJobApplications.filter((application) => application.status === 'Interviewing').length },
                                    { label: 'Offer', value: selectedJobApplications.filter((application) => application.status === 'Offered').length },
                                    { label: 'Rejected', value: selectedJobApplications.filter((application) => application.status === 'Rejected').length },
                                ].map((metric) => (
                                    <div key={metric.label} className="glass-box rounded-2xl p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                                        <div className="mt-3 text-[26px] font-bold tracking-[-0.05em] text-white">{metric.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                                <div className="space-y-6">
                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Job description</div>
                                        <p className="text-sm leading-7 text-slate-200">{selectedJob.description}</p>
                                    </div>

                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Requirements</div>
                                        {selectedJob.requirements?.length ? (
                                            <ul className="space-y-3 text-sm text-slate-200">
                                                {selectedJob.requirements.map((item) => (
                                                    <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-400" /> {item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-slate-400">No requirements listed.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hiring team</div>
                                        <div className="space-y-3">
                                            {selectedJob.postedBy ? (
                                                <div key={selectedJob.postedBy._id || selectedJob.postedBy.email || selectedJob.postedBy.name} className="glass-box glass-component flex items-center justify-between rounded-xl px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{(selectedJob.postedBy.name || 'R').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{selectedJob.postedBy.name}</div>
                                                            <div className="text-[11px] text-slate-300">Job owner</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400">No hiring team data available.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidates</div>
                                            <span className="text-xs text-slate-300">{selectedJobApplications.length} total</span>
                                        </div>
                                        {selectedJobApplications.length ? selectedJobApplications.map((application) => (
                                            <div key={application._id} className="flex items-center justify-between gap-3 border-t border-white/10 py-3 first:border-t-0 first:pt-0">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-bold text-white">{application.applicantId?.name || 'Unnamed applicant'}</div>
                                                    <div className="text-xs text-slate-300">{application.status || 'Applied'}</div>
                                                </div>
                                                {application.resumeUrl ? (
                                                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/30">View Resume</a>
                                                ) : (
                                                    <span className="shrink-0 text-xs text-slate-400">No Resume</span>
                                                )}
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400">No candidates have applied yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Pipeline' && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate pipeline</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">{selectedJob?.title || 'Select a job'}</h1>
                                    <p className="mt-2 text-sm text-slate-300">{selectedJob ? `${selectedJob.department} · ${selectedJob.location} · ${selectedJob.status}` : 'Choose a real job to view its pipeline.'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={pipelineJobFilter} onChange={(event) => setPipelineJobFilter(event.target.value)} className="glass-input rounded-xl px-3 py-2 text-sm text-white outline-none">
                                        <option value="">All jobs</option>
                                        {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                                    </select>
                                    <button type="button" className="glass-box rounded-xl px-3 py-2 text-sm font-medium text-white hover:bg-white/20">Edit</button>
                                    <button type="button" className="glass-box rounded-xl px-3 py-2 text-sm font-medium text-white hover:bg-white/20">Share</button>
                                    <button type="button" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Pause hiring</button>
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
                                    <div key={label} className="glass-box rounded-2xl p-4">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                                        <div className="mt-3 text-[26px] font-bold tracking-[-0.05em] text-white">{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto pb-2">
                                <div className="grid min-w-[980px] grid-cols-6 gap-4">
                                    {pipelineStages.map((stage) => {
                                        const items = stageGroups.find((group) => group.stage === stage)?.items || [];
                                        return (
                                            <div key={stage} className="glass-container rounded-2xl p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                                                e.preventDefault();
                                                const id = e.dataTransfer.getData('applicationId');
                                                const app = applications.find((item) => item._id === id);
                                                if (app) {
                                                    const nextStatus = stage === 'Interview' ? 'Interviewing' : stage === 'Offer' ? 'Offered' : stage === 'Hired' ? 'Hired' : stage;
                                                    handleStatusChange(app._id, nextStatus);
                                                }
                                            }}>
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <div className="text-sm font-bold text-white">{stage}</div>
                                                    <div className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">{items.length}</div>
                                                </div>
                                                <div className="space-y-3">
                                                    {items.length === 0 ? (
                                                        <div className="glass-box rounded-2xl p-4 text-center text-[12px] text-slate-400">No candidates</div>
                                                    ) : (
                                                        items.map((item) => {
                                                            const candidateName = item.applicantId?.name || 'Unnamed applicant';
                                                            const role = item.jobId?.title || 'Untitled role';
                                                            return (
                                                                <div key={item._id} draggable onDragStart={(e) => e.dataTransfer.setData('applicationId', item._id)} onClick={() => openCandidateProfile(item)} className="glass-box cursor-pointer rounded-2xl p-3 transition hover:bg-white/20">
                                                                    <div className="mb-3 flex items-start justify-between gap-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{candidateName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                                            <div>
                                                                                <div className="text-sm font-bold text-white">{candidateName}</div>
                                                                                <div className="text-[11px] text-slate-300">{role}</div>
                                                                            </div>
                                                                        </div>
                                                                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                                                                            (item.match?.matchScore ?? 0) >= 80
                                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                                                                : (item.match?.matchScore ?? 0) >= 50
                                                                                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                                                                                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                                                                        }`}>
                                                                            <Sparkles size={10} className={(item.match?.matchScore ?? 0) >= 80 ? 'text-emerald-300' : 'text-indigo-300'} />
                                                                            <span>{item.match?.matchScore ?? 0}% Fit</span>
                                                                        </span>
                                                                    </div>

                                                                    <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-300">
                                                                        <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={11} /> {role}</span>
                                                                        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {item.jobId?.location || 'Location unavailable'}</span>
                                                                    </div>

                                                                    <div className="mb-3 flex flex-wrap gap-1">
                                                                        {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).slice(0, 4).map((skill) => {
                                                                            const isMatched = item.match?.matchingSkills?.some(ms => ms.toLowerCase() === skill.toLowerCase());
                                                                            return (
                                                                                <span
                                                                                    key={skill}
                                                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                                                        isMatched
                                                                                            ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-semibold'
                                                                                            : 'glass-pill text-white'
                                                                                    }`}
                                                                                >
                                                                                    {isMatched ? '✓ ' : ''}{skill}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                        {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length > 4 && (
                                                                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                                                                                +{((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length - 4}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="mb-3 border-t border-white/10 pt-3">
                                                                        {item.resumeUrl ? (
                                                                            <a
                                                                                href={item.resumeUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(event) => event.stopPropagation()}
                                                                                className="inline-flex items-center space-x-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/30"
                                                                            >
                                                                                <span>View Resume</span>
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-400">No Resume</span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-slate-400">
                                                                        <span>{stage}</span>
                                                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</span>
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
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/20 text-lg font-semibold text-indigo-300 shadow-sm">
                                        {(selectedCandidate.applicantId?.name || 'Unnamed applicant').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate profile</div>
                                        <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-white">{selectedCandidate.applicantId?.name || 'Unnamed applicant'}</h1>
                                        <p className="mt-1 text-sm text-slate-300">{selectedCandidate.jobId?.title || 'Untitled role'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="rounded-xl glass-pill px-3 py-2 text-sm font-medium text-white hover:bg-white/15 transition">Move Stage</button>
                                    <button type="button" className="rounded-xl glass-pill px-3 py-2 text-sm font-medium text-white hover:bg-white/15 transition">Schedule Interview</button>
                                    <button type="button" className="rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition">Send Email</button>
                                </div>
                            </div>

                            <div className="mb-6 rounded-2xl glass-container p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                        <span className="flex items-center gap-2"><UserRound size={14} className="text-indigo-400" /> {selectedCandidate.applicantId?.email || 'Email unavailable'}</span>
                                        <span className="flex items-center gap-2"><BriefcaseBusiness size={14} className="text-indigo-400" /> {selectedCandidate.jobId?.department || 'Department unavailable'}</span>
                                        <span className="flex items-center gap-2"><MapPin size={14} className="text-indigo-400" /> {selectedCandidate.jobId?.location || 'Location unavailable'}</span>
                                    </div>
                                    <select value={selectedCandidate.status || 'Applied'} onChange={(event) => handleStatusChange(selectedCandidate._id, event.target.value)} className="glass-input rounded-xl px-3 py-2 text-sm font-semibold text-white">
                                        {['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'].map((status) => <option key={status} value={status} className="bg-slate-900 text-white">{status}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-6">
                                    <CandidateMatchCard
                                        jobId={selectedCandidate.jobId?._id || selectedCandidate.jobId}
                                        candidateId={selectedCandidate.applicantId?._id || selectedCandidate.applicantId}
                                    />

                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resume</div>
                                        {selectedCandidate.resumeUrl ? (
                                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/30 transition">
                                                <span>Open submitted resume</span>
                                            </a>
                                        ) : (
                                            <p className="text-sm text-slate-400">No resume was submitted with this application.</p>
                                        )}
                                    </div>

                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate Skills & Match Fit</div>
                                        
                                        <div className="mb-4">
                                            <div className="mb-2 text-xs font-semibold text-slate-300">Candidate's Stated Skills:</div>
                                            {selectedCandidate.candidateProfile?.skills?.length ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedCandidate.candidateProfile.skills.map((skill) => {
                                                        const isMatched = selectedCandidate.match?.matchingSkills?.some(
                                                            (ms) => ms.toLowerCase() === skill.toLowerCase()
                                                        );
                                                        return (
                                                            <span
                                                                key={skill}
                                                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                                                                    isMatched
                                                                        ? 'border border-indigo-400/40 bg-indigo-500/20 text-indigo-200 font-semibold shadow-xs'
                                                                        : 'glass-pill text-white'
                                                                }`}
                                                            >
                                                                {isMatched ? '✓ ' : ''}{skill}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No skills listed on candidate profile yet.</p>
                                            )}
                                        </div>

                                        {selectedCandidate.match?.missingSkills?.length > 0 && (
                                            <div className="border-t border-white/10 pt-3">
                                                <div className="mb-2 text-xs font-semibold text-amber-300">
                                                    Unmatched Role Requirements ({selectedCandidate.match.missingSkills.length}):
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedCandidate.match.missingSkills.map((req) => (
                                                        <span key={req} className="rounded-full border border-amber-400/30 bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                                                            {req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progressive Application Timeline */}
                                    <ApplicationTimeline
                                        currentStatus={selectedCandidate.status || 'Applied'}
                                        statusHistory={selectedCandidate.statusHistory || []}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Schedule interview</div>
                                        <form onSubmit={(event) => scheduleInterview(selectedCandidate._id, event)} className="space-y-3">
                                            <select name="round" defaultValue={selectedCandidate.interviewRound || 'Assessment'} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white">
                                                <option value="Assessment" className="bg-slate-900 text-white">Round 1: Assessment</option>
                                                <option value="Hiring Manager" className="bg-slate-900 text-white">Round 2: Hiring Manager</option>
                                                <option value="HR" className="bg-slate-900 text-white">Round 3: HR</option>
                                            </select>
                                            <input name="scheduledAt" type="datetime-local" required className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white" />
                                            <input name="location" placeholder="Interview link or location" className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
                                            <textarea name="notes" rows={2} placeholder="Interview notes" className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
                                            <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition">Schedule interview</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Candidates' && (
                        <div>
                            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Talent pool</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-white">Candidates</h1>
                                </div>
                                <select value={candidateJobFilter} onChange={(event) => setCandidateJobFilter(event.target.value)} className="glass-input rounded-xl px-3 py-2.5 text-sm text-white">
                                    <option value="" className="bg-slate-900 text-white">All jobs</option>
                                    {jobs.map((job) => <option key={job._id} value={job._id} className="bg-slate-900 text-white">{job.title}</option>)}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filteredCandidates.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-white/20 glass-box p-10 text-center text-sm text-slate-300">No candidates in the pipeline yet.</div>
                                ) : (
                                    filteredCandidates.map((item) => {
                                        const name = item.applicantId?.name || 'Unnamed applicant';
                                        const email = item.applicantId?.email || 'Email unavailable';
                                        return (
                                            <div key={item._id} onClick={() => openCandidateProfile(item)} className="cursor-pointer rounded-2xl glass-box p-4 text-left transition hover:border-white/30 hover:bg-white/10 shadow-sm">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20 text-[11px] font-semibold text-indigo-300">{name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-white">{name}</div>
                                                            <div className="text-[12px] text-slate-400">{email}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCandidateProfile(item);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition shadow-xs ${
                                                            (item.match?.matchScore ?? 0) >= 80
                                                                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                                                : (item.match?.matchScore ?? 0) >= 50
                                                                ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                                                                : 'border-amber-400/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                                        }`}
                                                        title="Click to view full match score breakdown"
                                                    >
                                                        <Sparkles size={11} className={(item.match?.matchScore ?? 0) >= 80 ? 'text-emerald-300' : 'text-indigo-300'} />
                                                        <span>{item.match?.matchScore ?? 0}% Fit</span>
                                                    </button>
                                                </div>
                                                <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-300">
                                                    <span>{item.jobId?.title || 'Role unavailable'}</span>
                                                    <span>•</span>
                                                    <span>{item.jobId?.location || 'Location unavailable'}</span>
                                                </div>
                                                <div className="mb-3 flex flex-wrap gap-1.5">
                                                    {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).slice(0, 5).map((skill) => {
                                                        const isMatched = item.match?.matchingSkills?.some(ms => ms.toLowerCase() === skill.toLowerCase());
                                                        return (
                                                            <span
                                                                key={skill}
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${
                                                                    isMatched
                                                                        ? 'border border-indigo-400/30 bg-indigo-500/20 text-indigo-200 font-semibold'
                                                                        : 'glass-pill text-white'
                                                                }`}
                                                            >
                                                                {isMatched ? '✓ ' : ''}{skill}
                                                            </span>
                                                        );
                                                    })}
                                                    {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length > 5 && (
                                                        <span className="rounded-full glass-pill px-2 py-0.5 text-[10px] font-medium text-slate-300">
                                                            +{((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length - 5}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                                    <span className="text-[11px] text-slate-400">Candidate status</span>
                                                    <select value={item.status || 'Applied'} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); handleStatusChange(item._id, event.target.value); }} className="glass-input rounded-lg px-2 py-1 text-xs font-semibold text-white">
                                                        {['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'].map((status) => <option key={status} value={status} className="bg-slate-900 text-white">{status}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeView === 'Interviews' && (
                        <div>
                            <div className="mb-6 border-b border-white/10 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recruiter calendar</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-white">Interviews</h1>
                                <p className="mt-2 text-sm text-slate-300">Scheduled interviews across your hiring pipeline.</p>
                            </div>
                            {applications.filter((application) => application.interviewScheduledAt).length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/20 glass-box p-10 text-center text-sm text-slate-300">No interviews scheduled.</div>
                            ) : (
                                <div className="space-y-3">
                                    {applications.filter((application) => application.interviewScheduledAt).sort((left, right) => new Date(left.interviewScheduledAt) - new Date(right.interviewScheduledAt)).map((interview) => (
                                        <button key={interview._id} type="button" onClick={() => openCandidateProfile(interview)} className="flex w-full flex-col gap-2 rounded-2xl glass-box p-4 text-left transition hover:border-indigo-400/40 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-white">{interview.applicantId?.name || 'Unnamed applicant'}</div>
                                                <div className="mt-1 text-xs text-slate-300">{interview.jobId?.title || 'Job unavailable'} · {interview.interviewLocation || 'Location not set'}</div>
                                            </div>
                                            <div className="text-sm font-semibold text-indigo-300">{new Date(interview.interviewScheduledAt).toLocaleString()}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'Team' && (
                        <div>
                            <div className="mb-6 border-b border-white/10 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-white">Hiring team</h1>
                                <p className="mt-2 text-sm text-slate-300">Manage the people who collaborate on your open roles.</p>
                            </div>
                            <div className="rounded-2xl glass-container p-5">
                                <div className="space-y-3">
                                    {[user.name || 'Recruiter'].map((person, index) => (
                                        <div key={person} className="flex items-center justify-between rounded-xl glass-box glass-component border-white/10 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20 text-xs font-semibold text-indigo-300">{person.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{person}</div>
                                                    <div className="text-[12px] text-slate-400">{index === 0 ? 'Workspace owner' : index === 3 ? 'Hiring manager' : 'Recruiter'}</div>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">Active</span>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition"><Plus size={15} /> Invite teammate</button>
                            </div>
                        </div>
                    )}

                    {activeView === 'Settings' && (
                        <div>
                            <div className="mb-6 border-b border-white/10 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-white">Settings</h1>
                                <p className="mt-2 text-sm text-slate-300">Configure your workspace preferences.</p>
                            </div>
                            <div className="max-w-2xl rounded-2xl glass-container p-5">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-200">Workspace name</span>
                                        <input defaultValue="Avant Labs" className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </label>
                                    <label className="flex items-center justify-between rounded-xl glass-box border-white/10 p-3">
                                        <span>
                                            <span className="block text-sm font-medium text-white">Weekly hiring digest</span>
                                            <span className="mt-1 block text-[12px] text-slate-400">Receive a summary of pipeline activity.</span>
                                        </span>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-500" />
                                    </label>
                                    <button type="button" onClick={() => setMessage('Settings saved for this workspace.')} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition">Save changes</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{message}</div>
                    )}
                </main>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t ats-header p-2 lg:hidden">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
                    {['Overview', 'Jobs', 'Candidates', 'Pipeline'].map((item) => {
                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : FolderKanban;
                        return (
                            <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex flex-col items-center rounded-xl px-2 py-2 text-[11px] font-medium transition ${activeView === item ? 'border border-indigo-400/40 bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:text-white'}`}>
                                <Icon size={16} />
                                <span className="mt-1">{item}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showComposer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                        <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} className="w-full max-w-3xl rounded-[28px] glass-container p-6 shadow-2xl border-white/20">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">New role</div>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">Create a new position</h2>
                                </div>
                                <button type="button" onClick={() => setShowComposer(false)} className="flex h-9 w-9 items-center justify-center rounded-xl glass-pill text-slate-300 hover:text-white transition">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
                                {['01 Details', '02 Requirements', '03 Hiring Team', '04 Review', '05 Publish'].map((label, index) => (
                                    <div key={label} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${step === index + 1 ? 'bg-indigo-600 text-white shadow-sm' : 'glass-pill text-slate-300'}`}>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>

                            {error && <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/20 px-3 py-2 text-sm text-rose-200">{error}</div>}

                            {step === 1 && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Job title</label>
                                        <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Department</label>
                                        <input value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Location</label>
                                        <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Employment type</label>
                                        <input value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Experience</label>
                                        <input value={jobForm.experience} onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Job description</label>
                                        <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={4} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400" placeholder="Describe the role, responsibilities, and impact." />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Required skills</label>
                                        <textarea value={jobForm.requirements.join(', ')} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} rows={3} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Nice to have</label>
                                        <textarea value={jobForm.niceToHave.join(', ')} onChange={(e) => setJobForm({ ...jobForm, niceToHave: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} rows={3} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-400" />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Hiring manager</label>
                                        <input value={jobForm.manager} onChange={(e) => setJobForm({ ...jobForm, manager: e.target.value })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Recruiters</label>
                                        <input value={jobForm.recruiters.join(', ')} onChange={(e) => setJobForm({ ...jobForm, recruiters: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-200">Interview panel</label>
                                        <input value={jobForm.panel.join(', ')} onChange={(e) => setJobForm({ ...jobForm, panel: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white" />
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="rounded-2xl glass-box border-white/15 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preview</div>
                                            <h3 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">{jobForm.title}</h3>
                                        </div>
                                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Active</span>
                                    </div>
                                    <div className="mb-4 flex flex-wrap gap-2 text-[12px] text-slate-300">
                                        <span>{jobForm.department}</span>
                                        <span>·</span>
                                        <span>{jobForm.location}</span>
                                        <span>·</span>
                                        <span>{jobForm.employmentType}</span>
                                        <span>·</span>
                                        <span>{jobForm.experience}</span>
                                    </div>
                                    <p className="text-sm leading-6 text-slate-200">{jobForm.description}</p>
                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Required skills</div>
                                            <div className="flex flex-wrap gap-2">
                                                {jobForm.requirements.map((item) => (
                                                    <span key={item} className="rounded-full glass-pill px-3 py-1.5 text-[11px] font-medium text-white">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nice to have</div>
                                            <div className="flex flex-wrap gap-2">
                                                {jobForm.niceToHave.map((item) => (
                                                    <span key={item} className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1.5 text-[11px] font-medium text-indigo-200">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="rounded-2xl glass-box border-indigo-500/30 bg-indigo-500/10 p-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/20 text-indigo-300 shadow-md">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">Ready to publish</h3>
                                    <p className="mt-2 text-sm text-slate-300">This will go live to your candidate list and appear in the public jobs board.</p>
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between">
                                <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl glass-pill px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition">Back</button>
                                <button type="button" onClick={handleCreateJob} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition">{step === 5 ? 'Publish' : 'Continue'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Job Confirmation Modal */}
            {jobToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
                    <div className="w-full max-w-md rounded-2xl glass-container border-white/20 p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/20 text-rose-300">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Delete Job Posting</h3>
                                <p className="text-xs text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                            Are you sure you want to permanently delete <span className="font-semibold text-white">"{jobToDelete.title}"</span>? 
                            All associated candidate applications, matching assessments, and interview logs will also be permanently removed.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isDeletingJob}
                                onClick={() => setJobToDelete(null)}
                                className="rounded-xl glass-pill px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingJob}
                                onClick={() => handleDeleteJob(jobToDelete._id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50 shadow-md"
                            >
                                {isDeletingJob ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
