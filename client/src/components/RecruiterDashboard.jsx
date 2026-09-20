import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    CheckCheck,
    CheckCircle2,
    ChevronDown,
    Clock,
    ExternalLink,
    FolderKanban,
    Grid2x2,
    LogOut,
    Mail,
    MapPin,
    Menu,
    Plus,
    Search,
    Send,
    Settings,
    Sparkles,
    Trash2,
    UserRound,
    Users,
    X,
    ArrowLeft,
    Video,
    FileText,
    Calendar,
} from 'lucide-react';
import CandidateMatchCard from './CandidateMatchCard';
import ApplicationTimeline from './ApplicationTimeline';
import NotificationDropdown from './NotificationDropdown';

/**
 * Validates that an interview link or location is a legitimate URL
 * (Google Meet, Zoom, Microsoft Teams, Google Maps, Apple Maps, etc.)
 * Strictly disallows free-form text messages.
 */
function isValidInterviewUrl(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (!trimmed) return false;

    const candidate = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
        ? trimmed
        : `https://${trimmed}`;

    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.includes(' ')) return false;
        const parts = parsed.hostname.split('.');
        const tld = parts[parts.length - 1];
        if (!tld || tld.length < 2) return false;
        return true;
    } catch {
        return false;
    }
}

function normalizeInterviewUrl(str) {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
}

function isMapLocationUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('maps.google') ||
           lower.includes('google.com/maps') ||
           lower.includes('maps.app.goo.gl') ||
           lower.includes('goo.gl/maps') ||
           lower.includes('maps.apple.com') ||
           lower.includes('openstreetmap.org') ||
           lower.includes('waze.com') ||
           lower.includes('bing.com/maps') ||
           lower.includes('map');
}

export default function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeView, setActiveView] = useState('Overview');
    const [showComposer, setShowComposer] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedInterview, setSelectedInterview] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isDeletingJob, setIsDeletingJob] = useState(false);
    const [candidateJobFilter, setCandidateJobFilter] = useState('');
    const [pipelineJobFilter, setPipelineJobFilter] = useState('');
    const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [settingsMessage, setSettingsMessage] = useState('');
    const [error, setError] = useState('');
    const emptyJobForm = {
        title: '', department: '', location: '', employmentType: 'Full-time', experience: '',
        description: '', requirements: [], niceToHave: [], manager: '', recruiters: [], panel: [],
    };
    const [jobForm, setJobForm] = useState(emptyJobForm);

    const [teamMembers, setTeamMembers] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
        role: 'Recruiting Lead',
        customRole: '',
        note: '',
    });
    const [inviteSubmitting, setInviteSubmitting] = useState(false);
    const [inviteResult, setInviteResult] = useState(null);
    const [inviteError, setInviteError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const authConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const navItems = ['Overview', 'Jobs', 'Candidates', 'Pipeline', 'Interviews', 'Tasks'];
    const pipelineStages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];

    useEffect(() => {
        fetchJobs();
        fetchApplications();
        fetchTeam();
    }, []);

    useEffect(() => {
        if (!settingsMessage) return;
        const timer = setTimeout(() => {
            setSettingsMessage('');
        }, 5000);
        return () => clearTimeout(timer);
    }, [settingsMessage]);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            setMessage('');
        }, 5000);
        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        setMessage('');
        setSettingsMessage('');
    }, [activeView]);

    const fetchJobs = async () => {
        try {
            const res = await api.get('/api/jobs/recruiter/jobs');
            setJobs(res.data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        }
    };

    const fetchApplications = async () => {
        try {
            const res = await api.get(`/api/jobs/applications/${user.id}`);
            setApplications(res.data);
            return res.data;
        } catch (err) {
            console.error('Error fetching applications:', err);
            return [];
        }
    };

    const fetchTeam = async () => {
        setLoadingTeam(true);
        try {
            const res = await api.get('/api/team');
            setTeamMembers(res.data.members || []);
            setPendingInvitations(res.data.pendingInvitations || []);
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoadingTeam(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        setInviteError('');
        setInviteResult(null);
        setInviteSubmitting(true);

        try {
            const chosenRole = inviteForm.role === 'Custom...'
                ? (inviteForm.customRole.trim() || 'Recruiting Lead')
                : inviteForm.role;

            const res = await api.post('/api/team/invite', {
                name: inviteForm.name.trim(),
                email: inviteForm.email.trim(),
                role: chosenRole,
                note: inviteForm.note.trim(),
            });

            setInviteResult({
                message: res.data.message || 'Invitation email dispatched successfully!',
                previewUrl: res.data.previewUrl || null,
                isTestAccount: res.data.isTestAccount || false,
                email: inviteForm.email.trim(),
                role: chosenRole,
            });

            fetchTeam();
        } catch (err) {
            setInviteError(err.response?.data?.error || 'Failed to dispatch invitation email.');
        } finally {
            setInviteSubmitting(false);
        }
    };

    const handleResendInvite = async (invitationId) => {
        setActionLoadingId(invitationId);
        try {
            const res = await api.post(`/api/team/invite/${invitationId}/resend`, {});
            setMessage(res.data.message || 'Invitation email re-sent successfully!');
            fetchTeam();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend invitation.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelInvite = async (invitationId) => {
        if (!window.confirm('Cancel and revoke this pending invitation?')) return;
        setActionLoadingId(invitationId);
        try {
            await api.delete(`/api/team/invite/${invitationId}`);
            setMessage('Invitation cancelled.');
            fetchTeam();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel invitation.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            const res = await api.patch(`/api/jobs/applications/${appId}/status`, { status: newStatus });
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
            const response = await api.patch(`/api/jobs/recruiter/jobs/${job._id}/status`, { status: nextStatus });
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
            const res = await api.delete(`/api/jobs/recruiter/jobs/${jobId}`);
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
        setError('');
        setMessage('');
        const formElement = event.currentTarget;
        const form = new FormData(formElement);

        const scheduledAt = form.get('scheduledAt');
        const round = form.get('round');
        const rawLocation = (form.get('location') || '').trim();
        const notes = form.get('notes');

        if (!rawLocation) {
            setError('Please provide an online meeting link (e.g. Google Meet, Zoom) or map location link (e.g. Google Maps).');
            return;
        }

        if (!isValidInterviewUrl(rawLocation)) {
            setError('Invalid link. Only valid web URLs are accepted (e.g. https://meet.google.com/xyz, Zoom, or Google Maps). Plain text is not permitted.');
            return;
        }

        const cleanLocation = normalizeInterviewUrl(rawLocation);

        try {
            const response = await api.patch(`/api/jobs/applications/${applicationId}/interview`, {
                scheduledAt,
                round,
                location: cleanLocation,
                notes,
            });
            const refreshedApplications = await fetchApplications();
            const refreshedApplication = (refreshedApplications || []).find((application) => application._id === applicationId);
            setSelectedCandidate((current) => current?._id === applicationId ? { ...current, ...(refreshedApplication || response.data.application) } : current);
            setSelectedInterview((current) => current?._id === applicationId ? { ...current, ...(refreshedApplication || response.data.application) } : current);
            setMessage(response.data.message);
            formElement.reset();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to schedule interview.');
        }
    };

    const overviewPipelineGroups = useMemo(() => {
        const pipelineApplications = applications.filter((application) => !pipelineJobFilter || application.jobId?._id === pipelineJobFilter || application.jobId === pipelineJobFilter);
        return pipelineStages.map((stage) => {
            const items =
                stage === 'Interview'
                    ? pipelineApplications.filter((app) => app.status === 'Interviewing')
                    : stage === 'Offer'
                        ? pipelineApplications.filter((app) => app.status === 'Offered')
                        : pipelineApplications.filter((app) => (stage === 'Applied' ? (!app.status || app.status === 'Applied') : app.status === stage));

            return { stage, count: items.length, items };
        });
    }, [applications, pipelineJobFilter]);

    const stats = [
        { label: 'Open Positions', value: jobs.length, detail: 'Live roles', tone: 'neutral' },
        { label: 'Total Candidates', value: applications.length, detail: 'Across your jobs', tone: 'emerald' },
        { label: 'Interviews', value: applications.filter((app) => app.status === 'Interviewing').length, detail: 'Current stage', tone: 'neutral' },
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
            await api.post('/api/jobs', payload);
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
            if (notif.metadata?.applicationId) {
                const app = applications.find(
                    (a) => String(a._id) === String(notif.metadata.applicationId) || String(a._id) === String(notif.metadata.candidateId)
                );
                if (app) {
                    setSelectedInterview(app);
                    setActiveView('InterviewDetail');
                    return;
                }
            }
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

                <div className="workspace-pill mt-3 rounded-2xl p-3 shadow-md shrink-0 border border-[#383838] bg-[#1E1E1E]">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium" style={{ color: '#B5AEA4' }}>
                        <span style={{ color: '#B5AEA4' }}>Workspace</span>
                        <ChevronDown size={14} style={{ color: '#B5AEA4' }} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="brand-badge flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold">A</div>
                        <div>
                            <div className="text-sm font-bold" style={{ color: '#FFFFFF' }}>Avant Labs</div>
                            <div className="text-[11px]" style={{ color: '#B5AEA4' }}>Global hiring</div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = item === activeView ||
                            (item === 'Jobs' && activeView === 'JobDetail') ||
                            (item === 'Candidates' && activeView === 'CandidateProfile') ||
                            (item === 'Interviews' && activeView === 'InterviewDetail');
                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : item === 'Pipeline' ? FolderKanban : item === 'Interviews' ? CalendarClock : CheckCheck;
                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    setActiveView(item);
                                    if (item === 'Interviews') setSelectedInterview(null);
                                    if (item === 'Candidates') setSelectedCandidate(null);
                                    if (item === 'Jobs') setSelectedJob(null);
                                    setMobileNavOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive
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
            <div className="user-card mt-3 rounded-2xl p-3 shrink-0 border border-[#383838] bg-[#1E1E1E]">
                <div className="flex items-center gap-3">
                    <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                        {user.name?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="user-name-text truncate text-sm font-bold" style={{ color: '#FFFFFF' }}>{user.name || 'Recruiter'}</div>
                        <div className="user-subtitle-text truncate text-[11px]" style={{ color: '#B5AEA4' }}>{user.title || 'Workspace owner'}</div>
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
                                        const isActive = item === activeView ||
                                            (item === 'Jobs' && activeView === 'JobDetail') ||
                                            (item === 'Candidates' && activeView === 'CandidateProfile') ||
                                            (item === 'Interviews' && activeView === 'InterviewDetail');
                                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : item === 'Pipeline' ? FolderKanban : item === 'Interviews' ? CalendarClock : CheckCheck;
                                        return (
                                            <button key={item} type="button" onClick={() => {
                                                setActiveView(item);
                                                if (item === 'Interviews') setSelectedInterview(null);
                                                if (item === 'Candidates') setSelectedCandidate(null);
                                                if (item === 'Jobs') setSelectedJob(null);
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
                                <span className="font-semibold heading-title">{activeView === 'InterviewDetail' ? 'Interviews' : activeView}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input placeholder="Search jobs, candidates, notes..." className="glass-input w-[300px] rounded-xl py-2.5 pl-9 pr-12 text-sm outline-none transition focus:border-[#2B2B2B]" />
                                <div className="glass-box absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold">⌘ K</div>
                            </div>

                            {/* Live Notification Dropdown for Recruiter */}
                            <NotificationDropdown onNotificationClick={handleRecruiterNotificationClick} />

                            <button type="button" onClick={() => setShowComposer(true)} className="btn-header-primary btn-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#F3EDE2] transition hover:bg-black shadow-sm">
                                <Plus size={14} style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} className="text-[#F3EDE2]" />
                                <span>Create Job</span>
                            </button>
                            <button type="button" onClick={handleLogout} className="glass-box hidden items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#2B2B2B] transition hover:bg-[#FAF7F2] xl:inline-flex">
                                <LogOut size={14} />
                                Log out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {activeView === 'Overview' && (
                        <>
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A746D]">Recruiting dashboard</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Good morning, {user.name || 'Recruiter'}</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Track your hiring activity and candidate pipeline.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="btn-primary inline-flex items-center gap-2 rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] transition hover:bg-black shadow-sm">
                                    <Plus size={15} style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} className="text-[#F3EDE2]" />
                                    <span>Create Job</span>
                                </button>
                            </div>

                            <div className="glass-container mb-6 overflow-hidden rounded-2xl">
                                <div className="grid divide-x divide-black/10 md:grid-cols-4">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="px-5 py-4">
                                            <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">
                                                <span>{stat.label}</span>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${stat.tone === 'emerald'
                                                        ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                                                        : stat.tone === 'amber'
                                                            ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                                                            : 'bg-[#EAE3D5] text-[#2B2B2B] border-[#D8D1C7]'
                                                    }`}>
                                                    {stat.detail}
                                                </span>
                                            </div>
                                            <div className="text-[32px] font-bold tracking-[-0.06em] text-[#2B2B2B]">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                                <div className="glass-container rounded-2xl p-5">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Pipeline Health</div>
                                            <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#2B2B2B]">Application stages</h2>
                                        </div>
                                        <span className="text-xs font-semibold text-[#5E5953]">{applications.length} active candidates</span>
                                    </div>
                                    <div className="space-y-3">
                                        {overviewPipelineGroups.map((group) => (
                                            <div key={group.stage} className="glass-box rounded-xl p-3.5">
                                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">
                                                    <span>{group.stage}</span>
                                                    <span className="rounded-full bg-[#EAE3D5] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#2B2B2B]">{group.count}</span>
                                                </div>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EAE3D5]">
                                                    <div className="h-full rounded-full bg-[#2B2B2B]" style={{ width: `${Math.min(group.count * 12, 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-container rounded-2xl p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Today</div>
                                            <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#2B2B2B]">Interview schedule</h2>
                                        </div>
                                        <CalendarClock size={18} className="text-[#2B2B2B]" />
                                    </div>
                                    {todayInterviews.length === 0 ? (
                                        <p className="text-sm font-medium text-[#7A746D]">No interviews scheduled for today.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {todayInterviews.map((interview) => (
                                                <button
                                                    key={interview._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedInterview(interview);
                                                        setActiveView('InterviewDetail');
                                                        window.history.replaceState({}, '', `/recruiter/interview/${interview._id}`);
                                                    }}
                                                    className="glass-box flex w-full items-center justify-between rounded-xl p-3 text-left transition hover:bg-[#FAF7F2]"
                                                >
                                                    <span>
                                                        <span className="block text-sm font-bold text-[#2B2B2B]">{interview.applicantId?.name || 'Unnamed applicant'}</span>
                                                        <span className="block text-xs text-[#5E5953]">{interview.jobId?.title || 'Job unavailable'} · {interview.interviewLocation || 'Location not set'}</span>
                                                    </span>
                                                    <span className="text-xs font-bold text-[#2B2B2B]">{new Date(interview.interviewScheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
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
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Openings</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Jobs</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Manage your open positions and hiring activity.</p>
                                </div>
                                <button type="button" onClick={() => setShowComposer(true)} className="btn-primary inline-flex items-center gap-2 rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] transition hover:bg-black shadow-sm">
                                    <Plus size={15} style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} className="text-[#F3EDE2]" />
                                    <span>Create Job</span>
                                </button>
                            </div>

                            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative max-w-md flex-1">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A746D]" />
                                    <input placeholder="Search jobs..." className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-[#2B2B2B] placeholder:text-[#8C867E] outline-none transition focus:border-[#2B2B2B]" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['ALL', 'ACTIVE', 'DRAFT', 'CLOSED'].map((filter) => (
                                        <button key={filter} type="button" onClick={() => setJobStatusFilter(filter)} className={`rounded-xl px-3.5 py-2 text-[12px] font-medium transition ${jobStatusFilter === filter ? 'bg-[#242424] text-[#F3EDE2] font-bold shadow-xs' : 'glass-box text-[#2B2B2B] hover:bg-[#FAF7F2]'}`}>
                                            {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {visibleJobs.length === 0 ? (
                                <div className="glass-container rounded-2xl p-8 text-center">
                                    <p className="text-sm font-medium text-[#7A746D]">No job listings yet. Create your first opening to start hiring.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {visibleJobs.map((job) => {
                                        const jobApplications = applications.filter((application) => application.jobId?._id === job._id || application.jobId === job._id);
                                        const interviewCount = jobApplications.filter((application) => application.status === 'Interviewing').length;
                                        return (
                                            <button key={job._id} type="button" onClick={() => openJobDetail(job)} className="glass-box flex w-full flex-col gap-3 rounded-2xl p-4 text-left transition hover:bg-[#FAF7F2] sm:flex-row sm:items-center">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3EDE2] text-[#2B2B2B] border border-[#D8D1C7]">
                                                    <Building2 size={17} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="truncate text-[15px] font-bold text-[#2B2B2B]">{job.title}</div>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${job.status === 'CLOSED' ? 'bg-[#EAE3D5] text-[#7A746D] border-[#D8D1C7]' : 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'}`}>{job.status === 'CLOSED' ? 'Closed' : 'Active'}</span>
                                                    </div>
                                                    <div className="mt-1 text-[12px] text-[#5E5953]">{job.department} · {job.location} · {job.employmentType || 'Employment type unavailable'}</div>
                                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#4A4A4A]">{job.description || 'No job description provided.'}</p>
                                                </div>
                                                <div className="hidden min-w-[180px] text-left md:block">
                                                    <div className="text-[12px] text-[#7A746D]">Hiring manager</div>
                                                    <div className="text-sm font-semibold text-[#2B2B2B]">{job.postedBy?.name || user.name || 'Recruiter'}</div>
                                                </div>
                                                <div className="hidden min-w-[110px] text-left md:block">
                                                    <div className="text-[12px] text-[#7A746D]">Candidates</div>
                                                    <div className="text-sm font-bold text-[#2B2B2B]">{jobApplications.length}</div>
                                                </div>
                                                <div className="hidden min-w-[120px] text-left lg:block">
                                                    <div className="text-[12px] text-[#7A746D]">Progress</div>
                                                    <div className="text-sm font-semibold text-[#2B2B2B]">{interviewCount} interviewing</div>
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
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Job detail</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">{selectedJob.title}</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">{selectedJob.department} · {selectedJob.location} · {selectedJob.status || 'ACTIVE'}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => handleJobStatusChange(selectedJob)} className="rounded-xl bg-[#242424] px-3.5 py-2 text-sm font-semibold text-[#F3EDE2] transition hover:bg-black">{selectedJob.status === 'CLOSED' ? 'Reopen hiring' : 'Pause hiring'}</button>
                                    <button
                                        type="button"
                                        onClick={() => setJobToDelete(selectedJob)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
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
                                            <ul className="space-y-3 text-sm text-[#383838]">
                                                {selectedJob.requirements.map((item) => (
                                                    <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-[#2B2B2B]" /> {item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-[#7A746D]">No requirements listed.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Hiring team</div>
                                        <div className="space-y-3">
                                            {selectedJob.postedBy ? (
                                                <div key={selectedJob.postedBy._id || selectedJob.postedBy.email || selectedJob.postedBy.name} className="glass-box flex items-center justify-between rounded-xl px-3 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#242424] text-[10px] font-bold text-[#F3EDE2] border border-[#D8D1C7]">{(selectedJob.postedBy.name || 'R').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-[#2B2B2B]">{selectedJob.postedBy.name}</div>
                                                            <div className="text-[11px] text-[#5E5953]">Job owner</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[#7A746D]">No hiring team data available.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="glass-container rounded-2xl p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Candidates</div>
                                            <span className="text-xs font-semibold text-[#5E5953]">{selectedJobApplications.length} total</span>
                                        </div>
                                        {selectedJobApplications.length ? selectedJobApplications.map((application) => (
                                            <div key={application._id} className="flex items-center justify-between gap-3 border-t border-[#D8D1C7] py-3 first:border-t-0 first:pt-0">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-bold text-[#2B2B2B]">{application.applicantId?.name || 'Unnamed applicant'}</div>
                                                    <div className="text-xs text-[#5E5953]">{application.status || 'Applied'}</div>
                                                </div>
                                                {application.resumeUrl ? (
                                                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-[#D8D1C7] bg-[#FAF7F2] hover:bg-[#EAE3D5] px-3 py-1 text-xs font-bold text-[#2B2B2B] transition">View Resume</a>
                                                ) : (
                                                    <span className="shrink-0 text-xs text-[#7A746D]">No Resume</span>
                                                )}
                                            </div>
                                        )) : (
                                            <p className="text-sm text-[#7A746D]">No candidates have applied yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Pipeline' && (
                        <div>
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Candidate pipeline</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">{selectedJob?.title || 'Select a job'}</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">{selectedJob ? `${selectedJob.department} · ${selectedJob.location} · ${selectedJob.status}` : 'Choose a real job to view its pipeline.'}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select value={pipelineJobFilter} onChange={(event) => setPipelineJobFilter(event.target.value)} className="glass-input rounded-xl border border-[#D8D1C7] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none">
                                        <option value="">All jobs</option>
                                        {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                                    </select>
                                    <button type="button" className="rounded-xl bg-[#242424] px-3.5 py-2 text-sm font-semibold text-[#F3EDE2] hover:bg-black transition">Pause hiring</button>
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
                                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">{label}</div>
                                        <div className="mt-3 text-[26px] font-bold tracking-[-0.05em] text-[#2B2B2B]">{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-4 xl:grid-cols-6">
                                {pipelineStages.map((stage) => {
                                    const items = applications.filter((application) => {
                                        if (stage === 'Applied') return !application.status || application.status === 'Applied';
                                        if (stage === 'Interview') return application.status === 'Interviewing';
                                        if (stage === 'Offer') return application.status === 'Offered';
                                        return application.status === stage;
                                    });

                                    return (
                                        <div
                                            key={stage}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const applicationId = e.dataTransfer.getData('applicationId');
                                                if (applicationId) {
                                                    const targetStatus = stage === 'Interview' ? 'Interviewing' : stage === 'Offer' ? 'Offered' : stage;
                                                    handleStatusChange(applicationId, targetStatus);
                                                }
                                            }}
                                            className="glass-container flex min-h-[580px] flex-col rounded-2xl p-3"
                                        >
                                            <div className="mb-3 flex items-center justify-between px-2 pt-1">
                                                <div className="text-sm font-bold text-[#2B2B2B]">{stage}</div>
                                                <span className="rounded-full bg-[#EAE3D5] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#2B2B2B]">{items.length}</span>
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                {items.length === 0 ? (
                                                    <div className="glass-box rounded-2xl p-4 text-center text-[12px] font-medium text-[#7A746D]">No candidates</div>
                                                ) : (
                                                    items.map((item) => {
                                                        const candidateName = item.applicantId?.name || 'Unnamed applicant';
                                                        const role = item.jobId?.title || 'Untitled role';
                                                        return (
                                                            <div key={item._id} draggable onDragStart={(e) => e.dataTransfer.setData('applicationId', item._id)} onClick={() => openCandidateProfile(item)} className="glass-box cursor-pointer rounded-2xl p-3 transition hover:bg-[#FAF7F2]">
                                                                <div className="mb-3 flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#242424] text-[10px] font-bold text-[#F3EDE2] border border-[#D8D1C7]">{candidateName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                                        <div>
                                                                            <div className="text-sm font-bold text-[#2B2B2B]">{candidateName}</div>
                                                                            <div className="text-[11px] text-[#5E5953]">{role}</div>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs ${(item.match?.matchScore ?? 0) >= 80
                                                                            ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                                                                            : (item.match?.matchScore ?? 0) >= 50
                                                                                ? 'bg-[#EAE3D5] text-[#2B2B2B] border-[#D8D1C7]'
                                                                                : 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                                                                        }`}>
                                                                        <Sparkles size={10} className={(item.match?.matchScore ?? 0) >= 80 ? 'text-[#137333]' : 'text-[#2B2B2B]'} />
                                                                        <span>{item.match?.matchScore ?? 0}% Fit</span>
                                                                    </span>
                                                                </div>

                                                                <div className="mb-2 flex items-center gap-2 text-[11px] text-[#5E5953]">
                                                                    <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={11} /> {role}</span>
                                                                    <span className="inline-flex items-center gap-1"><MapPin size={11} /> {item.jobId?.location || 'Location unavailable'}</span>
                                                                </div>

                                                                <div className="mb-3 flex flex-wrap gap-1">
                                                                    {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).slice(0, 4).map((skill) => {
                                                                        const isMatched = item.match?.matchingSkills?.some(ms => ms.toLowerCase() === skill.toLowerCase());
                                                                        return (
                                                                            <span
                                                                                key={skill}
                                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isMatched
                                                                                        ? 'bg-[#EAE3D5] text-[#2B2B2B] border border-[#D8D1C7] font-bold'
                                                                                        : 'glass-pill text-[#4A4A4A]'
                                                                                    }`}
                                                                            >
                                                                                {skill}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <div className="mb-3">
                                                                    {item.resumeUrl ? (
                                                                        <a
                                                                            href={item.resumeUrl}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] hover:bg-[#EAE3D5] py-1.5 text-xs font-semibold text-[#2B2B2B] transition"
                                                                        >
                                                                            <span>View Resume</span>
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-xs text-[#7A746D]">No Resume</span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center justify-between border-t border-[#D8D1C7] pt-2 text-[11px] text-[#5E5953]">
                                                                    <span className="font-medium text-[#2B2B2B]">{stage}</span>
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
                    )}

                    {activeView === 'CandidateProfile' && selectedCandidate && (
                        <div>
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D8D1C7] bg-[#242424] text-lg font-bold text-[#F3EDE2] shadow-sm">
                                        {(selectedCandidate.applicantId?.name || 'Unnamed applicant').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Candidate profile</div>
                                        <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">{selectedCandidate.applicantId?.name || 'Unnamed applicant'}</h1>
                                        <p className="mt-1 text-sm font-medium text-[#5E5953]">{selectedCandidate.jobId?.title || 'Untitled role'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="rounded-xl bg-[#242424] px-4 py-2 text-sm font-semibold text-[#F3EDE2] shadow-sm hover:bg-black transition">Send Email</button>
                                </div>
                            </div>

                            <div className="mb-6 rounded-2xl glass-container p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-wrap gap-4 text-sm text-[#4A4A4A]">
                                        <span className="flex items-center gap-2"><UserRound size={14} className="text-[#2B2B2B]" /> {selectedCandidate.applicantId?.email || 'Email unavailable'}</span>
                                        <span className="flex items-center gap-2"><BriefcaseBusiness size={14} className="text-[#2B2B2B]" /> {selectedCandidate.jobId?.department || 'Department unavailable'}</span>
                                        <span className="flex items-center gap-2"><MapPin size={14} className="text-[#2B2B2B]" /> {selectedCandidate.jobId?.location || 'Location unavailable'}</span>
                                    </div>
                                    <select value={selectedCandidate.status || 'Applied'} onChange={(event) => handleStatusChange(selectedCandidate._id, event.target.value)} className="glass-input rounded-xl border border-[#D8D1C7] bg-white px-3 py-2 text-sm font-semibold text-[#2B2B2B] outline-none">
                                        {['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'].map((status) => <option key={status} value={status} className="bg-white text-[#2B2B2B]">{status}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                <div className="space-y-6">
                                    <CandidateMatchCard
                                        jobId={selectedCandidate.jobId?._id || selectedCandidate.jobId}
                                        candidateId={selectedCandidate.applicantId?._id || selectedCandidate.applicantId}
                                    />

                                    {/* Progressive Application Timeline */}
                                    <ApplicationTimeline
                                        currentStatus={selectedCandidate.status || 'Applied'}
                                        statusHistory={selectedCandidate.statusHistory || []}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Schedule interview</div>
                                        <form onSubmit={(event) => scheduleInterview(selectedCandidate._id, event)} className="space-y-3">
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Interview Round</label>
                                                <select name="round" defaultValue={selectedCandidate.interviewRound || 'Assessment'} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] border border-[#D8D1C7] bg-white">
                                                    <option value="Assessment">Round 1: Assessment</option>
                                                    <option value="Hiring Manager">Round 2: Hiring Manager</option>
                                                    <option value="HR">Round 3: HR</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Date & Time</label>
                                                <input name="scheduledAt" type="datetime-local" required className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] border border-[#D8D1C7] bg-white" />
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">
                                                    Meeting URL or Map Link <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="location"
                                                    type="url"
                                                    required
                                                    placeholder="https://meet.google.com/xyz or https://maps.google.com/..."
                                                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#8C867E] border border-[#D8D1C7] bg-white"
                                                />
                                                <p className="mt-1 text-[11px] text-[#7A746D]">
                                                    Only online meeting URLs (Google Meet, Zoom, Teams) or Google Maps location URLs are accepted. Plain text is not allowed.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Notes</label>
                                                <textarea name="notes" rows={2} placeholder="Interview notes / preparation instructions" className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#8C867E] border border-[#D8D1C7] bg-white" />
                                            </div>
                                            <button type="submit" className="w-full rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] shadow-md hover:bg-black transition">Schedule interview</button>
                                        </form>
                                    </div>

                                    {/* Resume */}
                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Resume</div>
                                        {selectedCandidate.resumeUrl ? (
                                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2 text-sm font-semibold text-[#2B2B2B] hover:bg-[#FAF7F2] transition shadow-2xs">
                                                <FileText size={16} />
                                                <span>Open submitted resume</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        ) : (
                                            <p className="text-sm text-[#7A746D]">No resume was submitted with this application.</p>
                                        )}
                                    </div>

                                    {/* Candidate Skills & Match Fit */}
                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Candidate Skills & Match Fit</div>

                                        <div className="mb-4">
                                            <div className="mb-2 text-xs font-semibold text-[#5E5953]">Candidate's Stated Skills:</div>
                                            {selectedCandidate.candidateProfile?.skills?.length ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedCandidate.candidateProfile.skills.map((skill) => {
                                                        const isMatched = selectedCandidate.match?.matchingSkills?.some(
                                                            (ms) => ms.toLowerCase() === skill.toLowerCase()
                                                        );
                                                        return (
                                                            <span
                                                                key={skill}
                                                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${isMatched
                                                                        ? 'border border-[#D8D1C7] bg-[#EAE3D5] text-[#2B2B2B] font-bold shadow-2xs'
                                                                        : 'glass-pill text-[#4A4A4A]'
                                                                    }`}
                                                            >
                                                                {isMatched ? '✓ ' : ''}{skill}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#7A746D] italic">No skills listed on candidate profile yet.</p>
                                            )}
                                        </div>

                                        {selectedCandidate.match?.missingSkills?.length > 0 && (
                                            <div className="border-t border-[#D8D1C7] pt-3">
                                                <div className="mb-2 text-xs font-semibold text-[#B06000]">
                                                    Unmatched Role Requirements ({selectedCandidate.match.missingSkills.length}):
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedCandidate.match.missingSkills.map((req) => (
                                                        <span key={req} className="rounded-full border border-[#FEEFC3] bg-[#FEF7E0] px-2.5 py-1 text-[11px] font-semibold text-[#B06000]">
                                                            {req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'Candidates' && (
                        <div>
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Talent pool</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Candidates</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Review applicant profiles, matches, and stages.</p>
                                </div>
                                <select value={candidateJobFilter} onChange={(event) => setCandidateJobFilter(event.target.value)} className="glass-input rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none">
                                    <option value="">All jobs</option>
                                    {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                                </select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filteredCandidates.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-[#D8D1C7] glass-box p-10 text-center text-sm font-medium text-[#7A746D]">No candidates in the pipeline yet.</div>
                                ) : (
                                    filteredCandidates.map((item) => {
                                        const name = item.applicantId?.name || 'Unnamed applicant';
                                        const email = item.applicantId?.email || 'Email unavailable';
                                        return (
                                            <div key={item._id} onClick={() => openCandidateProfile(item)} className="cursor-pointer rounded-2xl glass-box p-4 text-left transition hover:bg-[#FAF7F2] shadow-xs">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8D1C7] bg-[#242424] text-[11px] font-bold text-[#F3EDE2]">{name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-[#2B2B2B]">{name}</div>
                                                            <div className="text-[12px] text-[#7A746D]">{email}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCandidateProfile(item);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition shadow-2xs ${(item.match?.matchScore ?? 0) >= 80
                                                                ? 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]'
                                                                : (item.match?.matchScore ?? 0) >= 50
                                                                    ? 'border-[#D8D1C7] bg-[#EAE3D5] text-[#2B2B2B]'
                                                                    : 'border-[#FEEFC3] bg-[#FEF7E0] text-[#B06000]'
                                                            }`}
                                                        title="Click to view full match score breakdown"
                                                    >
                                                        <Sparkles size={11} className={(item.match?.matchScore ?? 0) >= 80 ? 'text-[#137333]' : 'text-[#2B2B2B]'} />
                                                        <span>{item.match?.matchScore ?? 0}% Fit</span>
                                                    </button>
                                                </div>
                                                <div className="mb-3 flex items-center gap-2 text-[11px] text-[#5E5953]">
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
                                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${isMatched
                                                                        ? 'border border-[#D8D1C7] bg-[#EAE3D5] text-[#2B2B2B] font-bold'
                                                                        : 'glass-pill text-[#4A4A4A]'
                                                                    }`}
                                                            >
                                                                {isMatched ? '✓ ' : ''}{skill}
                                                            </span>
                                                        );
                                                    })}
                                                    {((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length > 5 && (
                                                        <span className="rounded-full bg-[#EAE3D5] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-medium text-[#5E5953]">
                                                            +{((item.candidateProfile?.skills?.length ? item.candidateProfile.skills : item.jobId?.requirements) || []).length - 5}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-[#D8D1C7] pt-3">
                                                    <div className="flex items-center gap-2">
                                                        {item.resumeUrl && (
                                                            <a
                                                                href={item.resumeUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(event) => event.stopPropagation()}
                                                                className="rounded-lg border border-[#D8D1C7] bg-[#FAF7F2] hover:bg-[#EAE3D5] px-2 py-1 text-[11px] font-bold text-[#2B2B2B] transition"
                                                            >
                                                                View Resume
                                                            </a>
                                                        )}
                                                        <span className="text-[11px] font-medium text-[#7A746D]">Status</span>
                                                    </div>
                                                    <select value={item.status || 'Applied'} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); handleStatusChange(item._id, event.target.value); }} className="rounded-xl border border-[#D8D1C7] bg-white px-2.5 py-1 text-xs font-semibold text-[#2B2B2B] outline-none">
                                                        {['Applied', 'Screening', 'Shortlisted', 'Interviewing', 'Offered', 'Hired', 'Rejected'].map((status) => <option key={status} value={status} className="bg-white text-[#2B2B2B]">{status}</option>)}
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
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Recruiter calendar</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Interviews</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Scheduled interviews across your hiring pipeline.</p>
                                </div>
                            </div>
                            {applications.filter((application) => application.interviewScheduledAt).length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[#D8D1C7] glass-box p-10 text-center text-sm font-medium text-[#7A746D]">No interviews scheduled.</div>
                            ) : (
                                <div className="space-y-3">
                                    {applications.filter((application) => application.interviewScheduledAt).sort((left, right) => new Date(left.interviewScheduledAt) - new Date(right.interviewScheduledAt)).map((interview) => (
                                        <button
                                            key={interview._id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedInterview(interview);
                                                setActiveView('InterviewDetail');
                                                window.history.replaceState({}, '', `/recruiter/interview/${interview._id}`);
                                            }}
                                            className="flex w-full flex-col gap-2 rounded-2xl glass-box p-4 text-left transition hover:bg-[#FAF7F2] sm:flex-row sm:items-center sm:justify-between cursor-pointer group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-[#2B2B2B] group-hover:text-black">{interview.applicantId?.name || 'Unnamed applicant'}</span>
                                                    {interview.interviewRound && (
                                                        <span className="rounded-full bg-[#EAE3D5] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#2B2B2B]">
                                                            {interview.interviewRound}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#5E5953]">
                                                    <span>{interview.jobId?.title || 'Job unavailable'}</span>
                                                    <span>·</span>
                                                    <span className="truncate max-w-md text-[#137333] font-medium">{interview.interviewLocation || 'Location not set'}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-sm font-bold text-[#2B2B2B]">
                                                {new Date(interview.interviewScheduledAt).toLocaleString()}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'InterviewDetail' && selectedInterview && (() => {
                        const applicantName = selectedInterview.applicantId?.name || selectedInterview.candidateProfile?.name || 'Unnamed applicant';
                        const applicantEmail = selectedInterview.applicantId?.email || selectedInterview.candidateProfile?.email || 'Email unavailable';
                        const jobTitle = selectedInterview.jobId?.title || 'Role unavailable';
                        const department = selectedInterview.jobId?.department || 'Department unavailable';
                        const jobLocation = selectedInterview.jobId?.location || 'Location unavailable';
                        const interviewLocation = selectedInterview.interviewLocation || '';
                        const isMap = isMapLocationUrl(interviewLocation);
                        const roundName = selectedInterview.interviewRound || 'Interview';
                        const initials = applicantName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

                        return (
                            <div className="space-y-6">
                                {/* Navigation / Back Button */}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveView('Interviews');
                                            window.history.replaceState({}, '', '/recruiter');
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2 text-sm font-semibold text-[#2B2B2B] hover:bg-[#FAF7F2] transition shadow-2xs"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back to Interviews</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-[#EAE3D5] border border-[#D8D1C7] px-3 py-1 text-xs font-bold text-[#2B2B2B]">
                                            Round: {roundName}
                                        </span>
                                        <span className="rounded-full bg-[#E6F4EA] border border-[#CEEAD6] px-3 py-1 text-xs font-bold text-[#137333]">
                                            {selectedInterview.status || 'Interviewing'}
                                        </span>
                                    </div>
                                </div>

                                {/* Page Header Card */}
                                <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D8D1C7] bg-[#242424] text-lg font-bold text-[#F3EDE2] shadow-sm">
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Interview Details</div>
                                            <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">{applicantName}</h1>
                                            <p className="mt-1 text-sm font-medium text-[#5E5953]">{jobTitle} · {department}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {selectedInterview.resumeUrl && (
                                            <a
                                                href={selectedInterview.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2 text-sm font-bold text-[#2B2B2B] hover:bg-[#FAF7F2] transition shadow-2xs"
                                            >
                                                <FileText size={16} />
                                                <span>View Resume</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Interactive Meeting Link or Location Banner */}
                                <div className="rounded-2xl border border-[#D8D1C7] bg-white p-6 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${isMap ? 'border-[#D8D1C7] bg-[#FAF7F2] text-[#2B2B2B]' : 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]'}`}>
                                                {isMap ? <MapPin size={22} /> : <Video size={22} />}
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">
                                                    {isMap ? 'In-Person / Map Location' : 'Virtual Video Meeting'}
                                                </div>
                                                <div className="mt-1 text-base font-bold text-[#2B2B2B]">
                                                    {isMap ? 'Location Directions' : 'Meeting Room Link'}
                                                </div>
                                                {interviewLocation ? (
                                                    <a
                                                        href={interviewLocation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-1 block max-w-xl truncate text-xs font-semibold text-[#137333] hover:underline"
                                                    >
                                                        {interviewLocation}
                                                    </a>
                                                ) : (
                                                    <p className="mt-1 text-xs text-[#7A746D]">No meeting link or location provided.</p>
                                                )}
                                            </div>
                                        </div>

                                        {interviewLocation && (
                                            <div className="shrink-0">
                                                {isMap ? (
                                                    <a
                                                        href={interviewLocation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-maps-action inline-flex items-center gap-2 rounded-xl bg-[#242424] px-5 py-3 text-sm font-bold text-[#F3EDE2] hover:bg-black transition shadow-sm"
                                                    >
                                                        <MapPin size={16} strokeWidth={2.2} className="text-[#F3EDE2] shrink-0" style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} />
                                                        <span className="text-[#F3EDE2]">Open in Google Maps</span>
                                                        <ExternalLink size={14} strokeWidth={2.2} className="text-[#F3EDE2] shrink-0" style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={interviewLocation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-xl bg-[#137333] px-5 py-3 text-sm font-bold text-white hover:bg-[#0d5926] transition shadow-sm"
                                                    >
                                                        <Video size={16} />
                                                        <span>Join Video Meeting</span>
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Main Content Grid */}
                                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                    <div className="space-y-6">
                                        {/* Applicant & Role Information Card */}
                                        <div className="rounded-2xl glass-container p-5">
                                            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Applicant Information</div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Email</div>
                                                    <div className="mt-1 text-sm font-semibold text-[#2B2B2B] truncate">{applicantEmail}</div>
                                                </div>
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Job Role</div>
                                                    <div className="mt-1 text-sm font-semibold text-[#2B2B2B]">{jobTitle}</div>
                                                </div>
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Department</div>
                                                    <div className="mt-1 text-sm font-semibold text-[#2B2B2B]">{department}</div>
                                                </div>
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Office Location</div>
                                                    <div className="mt-1 text-sm font-semibold text-[#2B2B2B]">{jobLocation}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Candidate Match Card */}
                                        <CandidateMatchCard
                                            jobId={selectedInterview.jobId?._id || selectedInterview.jobId}
                                            candidateId={selectedInterview.applicantId?._id || selectedInterview.applicantId}
                                        />

                                        {/* Progressive Application Timeline */}
                                        <ApplicationTimeline
                                            currentStatus={selectedInterview.status || 'Interviewing'}
                                            statusHistory={selectedInterview.statusHistory || []}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        {/* Interview Schedule Details */}
                                        <div className="rounded-2xl glass-container p-5">
                                            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Interview Schedule</div>
                                            <div className="space-y-3">
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Date & Time</div>
                                                    <div className="mt-1 text-sm font-bold text-[#2B2B2B]">
                                                        {new Date(selectedInterview.interviewScheduledAt).toLocaleString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="glass-box rounded-xl p-3">
                                                    <div className="text-[11px] font-medium text-[#7A746D]">Interview Round</div>
                                                    <div className="mt-1 text-sm font-bold text-[#2B2B2B]">{roundName}</div>
                                                </div>
                                                {selectedInterview.interviewNotes && (
                                                    <div className="glass-box rounded-xl p-3">
                                                        <div className="text-[11px] font-medium text-[#7A746D]">Interviewer Notes</div>
                                                        <div className="mt-1 text-xs text-[#4A4A4A] whitespace-pre-wrap">{selectedInterview.interviewNotes}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Reschedule / Update Interview Form */}
                                        <div className="rounded-2xl glass-container p-5">
                                            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">Reschedule / Update Interview</div>
                                            <form onSubmit={(event) => scheduleInterview(selectedInterview._id, event)} className="space-y-3">
                                                <div>
                                                    <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Round</label>
                                                    <select
                                                        name="round"
                                                        defaultValue={selectedInterview.interviewRound || 'Assessment'}
                                                        className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] border border-[#D8D1C7] bg-white"
                                                    >
                                                        <option value="Assessment">Round 1: Assessment</option>
                                                        <option value="Hiring Manager">Round 2: Hiring Manager</option>
                                                        <option value="HR">Round 3: HR</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Date & Time</label>
                                                    <input
                                                        name="scheduledAt"
                                                        type="datetime-local"
                                                        defaultValue={selectedInterview.interviewScheduledAt ? new Date(selectedInterview.interviewScheduledAt).toISOString().slice(0, 16) : ''}
                                                        required
                                                        className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] border border-[#D8D1C7] bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">
                                                        Meeting URL or Map Link <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        name="location"
                                                        type="url"
                                                        required
                                                        defaultValue={selectedInterview.interviewLocation || ''}
                                                        placeholder="https://meet.google.com/xyz or https://maps.google.com/..."
                                                        className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#8C867E] border border-[#D8D1C7] bg-white"
                                                    />
                                                    <p className="mt-1 text-[11px] text-[#7A746D]">
                                                        Only valid URLs are accepted (Google Meet, Zoom, Teams, Google Maps). Text is not allowed.
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block mb-1 text-xs font-semibold text-[#2B2B2B]">Notes</label>
                                                    <textarea
                                                        name="notes"
                                                        rows={2}
                                                        defaultValue={selectedInterview.interviewNotes || ''}
                                                        placeholder="Interview notes / preparation instructions"
                                                        className="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#8C867E] border border-[#D8D1C7] bg-white"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="w-full rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] shadow-md hover:bg-black transition"
                                                >
                                                    Update interview details
                                                </button>
                                            </form>
                                        </div>

                                        {/* Skills & Match Fit */}
                                        <div className="rounded-2xl glass-container p-5">
                                            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">Skills & Qualifications</div>
                                            {selectedInterview.candidateProfile?.skills?.length ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedInterview.candidateProfile.skills.map((skill) => {
                                                        const isMatched = selectedInterview.match?.matchingSkills?.some(
                                                            (ms) => ms.toLowerCase() === skill.toLowerCase()
                                                        );
                                                        return (
                                                            <span
                                                                key={skill}
                                                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${isMatched
                                                                    ? 'border border-[#D8D1C7] bg-[#EAE3D5] text-[#2B2B2B] font-bold shadow-2xs'
                                                                    : 'glass-pill text-[#4A4A4A]'
                                                                }`}
                                                            >
                                                                {isMatched ? '✓ ' : ''}{skill}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[#7A746D]">No skills explicitly tagged.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeView === 'Team' && (
                        <div>
                            <div className="page-header-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Workspace</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Hiring team</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Manage colleagues who collaborate on your hiring pipeline.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteResult(null);
                                        setInviteError('');
                                        setInviteForm({ name: '', email: '', role: 'Recruiting Lead', customRole: '', note: '' });
                                        setInviteModalOpen(true);
                                    }}
                                    className="btn-primary inline-flex items-center gap-2 rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] shadow-sm hover:bg-black transition shrink-0"
                                >
                                    <Plus size={16} style={{ color: '#F3EDE2', stroke: '#F3EDE2' }} className="text-[#F3EDE2]" />
                                    <span>Invite teammate</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Active Members List */}
                                <div className="rounded-2xl glass-container p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">
                                            Active Workspace Members ({teamMembers.length || 1})
                                        </div>
                                        {loadingTeam && <span className="text-xs font-medium text-[#7A746D]">Refreshing...</span>}
                                    </div>
                                    <div className="space-y-3">
                                        {(teamMembers.length > 0 ? teamMembers : [{ name: user.name || 'Workspace Owner', email: user.email, title: user.title || 'Workspace owner' }]).map((member, index) => {
                                            const displayName = member.name || 'Teammate';
                                            const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
                                            return (
                                                <div key={member._id || member.email || index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl glass-box border border-[#D8D1C7] px-4 py-3.5">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D8D1C7] bg-[#242424] text-xs font-bold text-[#F3EDE2]">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-[#2B2B2B] truncate">{displayName}</span>
                                                                {member.email === user.email && (
                                                                    <span className="rounded-md bg-[#EAE3D5] border border-[#D8D1C7] px-1.5 py-0.5 text-[10px] font-bold text-[#2B2B2B]">You</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[12px] font-medium text-[#5E5953]">{member.title || (index === 0 ? 'Workspace owner' : 'Recruiting Lead')}</div>
                                                            <div className="text-[11px] text-[#7A746D] truncate">{member.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CEEAD6] bg-[#E6F4EA] px-2.5 py-1 text-[11px] font-bold text-[#137333]">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-[#137333] animate-pulse" />
                                                            Active
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Pending Invitations List */}
                                {pendingInvitations.length > 0 && (
                                    <div className="rounded-2xl glass-container p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#B06000]">
                                                Pending Invitations ({pendingInvitations.length})
                                            </div>
                                            <span className="text-xs font-medium text-[#7A746D]">Waiting for email acceptance</span>
                                        </div>
                                        <div className="space-y-3">
                                            {pendingInvitations.map((invite) => (
                                                <div key={invite._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl glass-box border border-[#FEEFC3] bg-[#FEF7E0]/40 px-4 py-3.5">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FEEFC3] bg-[#FEF7E0] text-xs font-bold text-[#B06000]">
                                                            {(invite.name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-[#2B2B2B]">{invite.name}</div>
                                                            <div className="text-[12px] font-medium text-[#B06000]">{invite.role}</div>
                                                            <div className="text-[11px] text-[#7A746D]">{invite.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#FEEFC3] bg-[#FEF7E0] px-2.5 py-1 text-[11px] font-bold text-[#B06000]">
                                                            <Clock size={12} /> Pending Invite
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === invite._id}
                                                            onClick={() => handleResendInvite(invite._id)}
                                                            className="rounded-lg border border-[#D8D1C7] bg-white px-2.5 py-1 text-xs font-medium text-[#2B2B2B] hover:bg-[#FAF7F2] transition disabled:opacity-50"
                                                            title="Resend invitation email"
                                                        >
                                                            {actionLoadingId === invite._id ? 'Sending...' : 'Resend'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actionLoadingId === invite._id}
                                                            onClick={() => handleCancelInvite(invite._id)}
                                                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                                                            title="Cancel invitation"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeView === 'Settings' && (
                        <div>
                            <div className="page-header-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Workspace</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-[#2B2B2B]">Settings</h1>
                                    <p className="mt-1 text-sm font-medium text-[#5E5953]">Configure your workspace preferences.</p>
                                </div>
                            </div>
                            <div className="max-w-2xl rounded-2xl glass-container p-6">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-[#2B2B2B]">Workspace name</span>
                                        <input defaultValue="Avant Labs" className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-[#2B2B2B] border border-[#D8D1C7] bg-white outline-none" />
                                    </label>
                                    <label className="flex items-center justify-between rounded-xl glass-box border border-[#D8D1C7] p-3.5">
                                        <span>
                                            <span className="block text-sm font-bold text-[#2B2B2B]">Weekly hiring digest</span>
                                            <span className="mt-1 block text-[12px] text-[#5E5953]">Receive a summary of pipeline activity.</span>
                                        </span>
                                        <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#2B2B2B]" />
                                    </label>
                                    <button type="button" onClick={() => setSettingsMessage('Settings saved for this workspace.')} className="rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] shadow-sm hover:bg-black transition">Save changes</button>
                                    {settingsMessage && (
                                        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 animate-in fade-in duration-200">
                                            <span>{settingsMessage}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSettingsMessage('')}
                                                className="ml-2 text-emerald-600 hover:text-emerald-900 transition"
                                                aria-label="Dismiss message"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 animate-in fade-in duration-200">
                            <span>{message}</span>
                            <button
                                type="button"
                                onClick={() => setMessage('')}
                                className="ml-2 text-emerald-600 hover:text-emerald-900 transition"
                                aria-label="Dismiss message"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t ats-header p-2 lg:hidden">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
                    {['Overview', 'Jobs', 'Candidates', 'Pipeline'].map((item) => {
                        const Icon = item === 'Overview' ? Grid2x2 : item === 'Jobs' ? BriefcaseBusiness : item === 'Candidates' ? Users : FolderKanban;
                        return (
                            <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex flex-col items-center rounded-xl px-2 py-2 text-[11px] font-medium transition ${activeView === item ? 'border border-[#383838] bg-[#242424] text-[#F3EDE2] font-bold' : 'text-slate-400 hover:text-white'}`}>
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
                                    <div key={label} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${step === index + 1 ? 'bg-[#242424] text-[#F3EDE2] shadow-sm font-bold' : 'border border-[#D8D1C7] bg-[#FAF7F2] text-[#5E5953]'}`}>
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
                                                    <span key={item} className="rounded-full border border-[#D8D1C7] bg-[#EAE3D5] px-3 py-1.5 text-[11px] font-bold text-[#2B2B2B]">{item}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="rounded-2xl border border-[#D8D1C7] bg-[#FAF7F2] p-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#D8D1C7] bg-[#242424] text-[#F3EDE2] shadow-sm">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold tracking-[-0.04em] text-[#2B2B2B]">Ready to publish</h3>
                                    <p className="mt-2 text-sm text-[#5E5953]">This will go live to your candidate list and appear in the public jobs board.</p>
                                </div>
                            )}

                            <div className="mt-6 flex items-center justify-between">
                                <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl glass-pill px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition">Back</button>
                                <button type="button" onClick={handleCreateJob} className="rounded-xl bg-[#242424] px-5 py-2.5 text-sm font-bold text-[#F3EDE2] shadow-sm hover:bg-black transition">{step === 5 ? 'Publish' : 'Continue'}</button>
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

            {/* Invite Teammate Modal */}
            <AnimatePresence>
                {inviteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.98 }}
                            className="w-full max-w-lg rounded-[28px] glass-container border-white/20 p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] text-[#2B2B2B]">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Collaboration</div>
                                        <h3 className="text-xl font-bold text-[#2B2B2B]">Invite a teammate</h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteModalOpen(false);
                                        setInviteResult(null);
                                        setInviteError('');
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg glass-pill text-slate-300 hover:text-white transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {inviteResult ? (
                                <div className="space-y-4 py-2">
                                    <div className="rounded-2xl border border-emerald-400/30 bg-[#E6F4EA] p-4 text-[#137333]">
                                        <div className="flex items-center gap-2 font-bold text-[#137333]">
                                            <CheckCircle2 size={18} className="text-[#137333]" />
                                            Invitation Email Dispatched!
                                        </div>
                                        <p className="mt-1.5 text-xs text-[#137333] leading-relaxed">
                                            We sent an invitation to <span className="font-semibold text-[#2B2B2B]">{inviteResult.email}</span> with instructions to join your workspace as <span className="font-semibold text-[#2B2B2B]">{inviteResult.role}</span>.
                                        </p>
                                    </div>

                                    {inviteResult.previewUrl && (
                                        <div className="rounded-2xl border border-[#D8D1C7] bg-[#FAF7F2] p-4 text-[#2B2B2B]">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-[#2B2B2B]">Test SMTP Preview Available:</span>
                                                <a
                                                    href={inviteResult.previewUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#242424] px-3 py-1.5 text-xs font-bold text-[#F3EDE2] hover:bg-black transition shadow-sm"
                                                >
                                                    View Email in Browser <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            <p className="mt-2 text-[11px] text-[#5E5953] leading-normal">
                                                Ethereal captured this email test dispatch. To send to real Gmail/work inboxes, configure your SMTP credentials in <code className="font-bold text-[#2B2B2B]">server/.env</code>.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInviteResult(null);
                                                setInviteForm({ name: '', email: '', role: 'Recruiting Lead', customRole: '', note: '' });
                                            }}
                                            className="rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] hover:bg-[#EAE3D5] px-4 py-2.5 text-xs font-bold text-[#2B2B2B] transition"
                                        >
                                            Invite Another Teammate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInviteModalOpen(false);
                                                setInviteResult(null);
                                            }}
                                            className="rounded-xl bg-[#242424] px-4 py-2.5 text-xs font-bold text-[#F3EDE2] hover:bg-black transition shadow-md"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendInvite} className="space-y-4">
                                    <p className="text-xs text-[#5E5953] leading-relaxed">
                                        Invite colleagues to collaborate on candidate reviews, pipeline stages, and hiring decisions.
                                    </p>

                                    {inviteError && (
                                        <div className="rounded-xl border border-rose-400/30 bg-rose-500/20 px-3 py-2 text-xs text-rose-200">
                                            {inviteError}
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={inviteForm.name}
                                            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                            placeholder="e.g. Jane Doe"
                                            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Work Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={inviteForm.email}
                                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                            placeholder="jane@company.com"
                                            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Position / Role *</label>
                                        <select
                                            value={inviteForm.role}
                                            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none bg-slate-900/90"
                                        >
                                            <option value="Recruiting Lead" className="bg-slate-900 text-white">Recruiting Lead</option>
                                            <option value="Senior Recruiter" className="bg-slate-900 text-white">Senior Recruiter</option>
                                            <option value="Hiring Manager" className="bg-slate-900 text-white">Hiring Manager</option>
                                            <option value="Sourcer" className="bg-slate-900 text-white">Sourcer</option>
                                            <option value="Talent Partner" className="bg-slate-900 text-white">Talent Partner</option>
                                            <option value="Custom..." className="bg-slate-900 text-white">Custom Position...</option>
                                        </select>
                                    </div>

                                    {inviteForm.role === 'Custom...' && (
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Custom Position Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={inviteForm.customRole}
                                                onChange={(e) => setInviteForm({ ...inviteForm, customRole: e.target.value })}
                                                placeholder="e.g. Lead Technical Recruiter"
                                                className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                            Personal Message <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={inviteForm.note}
                                            onChange={(e) => setInviteForm({ ...inviteForm, note: e.target.value })}
                                            placeholder="Hey Jane, join our workspace on AvantHire to collaborate on hiring!"
                                            className="glass-input w-full rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] p-3 text-[11px] text-[#5E5953] flex items-start gap-2">
                                        <Mail size={14} className="text-[#7A746D] shrink-0 mt-0.5" />
                                        <span>An actual email with a 7-day secure onboarding link will be sent to the recipient's inbox.</span>
                                    </div>

                                    <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setInviteModalOpen(false)}
                                            className="rounded-xl glass-pill px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={inviteSubmitting}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#242424] px-5 py-2.5 text-xs font-bold text-[#F3EDE2] shadow-md hover:bg-black transition disabled:opacity-50"
                                        >
                                            {inviteSubmitting ? (
                                                <>
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Sending Email...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={13} />
                                                    Send Invitation
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
