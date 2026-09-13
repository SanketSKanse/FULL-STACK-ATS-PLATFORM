import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell, BriefcaseBusiness, Building2, ChevronDown, CircleHelp, FolderKanban,
    Grid2x2, MapPin, Menu, Search, Settings, UserRound, Users, X, Sparkles, Award,
    LogOut, Shield, CheckCircle2, Sliders, BellRing, Eye, Check, ExternalLink
} from 'lucide-react';
import ApplicantOnboarding from './ApplicantOnboarding';
import CandidateMatchCard from './CandidateMatchCard';
import ResumeParserModal from './ResumeParserModal';
import ApplicationTimeline from './ApplicationTimeline';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';

export default function CandidateDashboard() {

    const [jobs, setJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [editingProfile, setEditingProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [employmentFilter, setEmploymentFilter] = useState('');
    const [activeView, setActiveView] = useState(
        window.location.pathname.includes('/applications')
            ? 'Applications'
            : window.location.pathname.includes('/profile')
            ? 'Profile'
            : window.location.pathname.includes('/settings')
            ? 'Settings'
            : 'Browse'
    );
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [expandedMatchJobId, setExpandedMatchJobId] = useState(null);
    const [isParserOpen, setIsParserOpen] = useState(false);

    // Candidate Preferences & Settings state
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [candidateSettings, setCandidateSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('candidate_settings');
            return saved ? JSON.parse(saved) : {
                jobAlerts: true,
                statusUpdates: true,
                interviewReminders: true,
                jobSeekingStatus: 'actively_looking',
                profileVisibility: 'public',
            };
        } catch (e) {
            return {
                jobAlerts: true,
                statusUpdates: true,
                interviewReminders: true,
                jobSeekingStatus: 'actively_looking',
                profileVisibility: 'public',
            };
        }
    });

    const updateCandidateSettings = (partial) => {
        const updated = { ...candidateSettings, ...partial };
        setCandidateSettings(updated);
        localStorage.setItem('candidate_settings', JSON.stringify(updated));
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    };

    const handleCandidateNotificationClick = (notif) => {
        if (notif.type === 'NEW_JOB') {
            setActiveView('Browse');
            window.history.replaceState({}, '', '/applicant');
        } else if (notif.type === 'APPLICATION_PROGRESS' || notif.type === 'INTERVIEW_SCHEDULED') {
            setActiveView('Applications');
            window.history.replaceState({}, '', '/applicant/applications');
        } else {
            setActiveView('Applications');
        }
    };

    const handleApplyResumeToProfile = async (parsedData, file) => {
        try {
            setError('');
            const mergedSkills = [...new Set([...(profile?.skills || []), ...(parsedData.skills || [])])];
            const updatedPayload = {
                ...(profile || {}),
                phone: parsedData.phone || profile?.phone || '',
                location: parsedData.location || profile?.location || '',
                headline: parsedData.headline || profile?.headline || '',
                summary: parsedData.summary || profile?.summary || '',
                skills: mergedSkills,
                experiences: parsedData.experiences?.length ? parsedData.experiences : (profile?.experiences || []),
                education: parsedData.education?.length ? parsedData.education : (profile?.education || []),
                resumeFileName: file?.name || profile?.resumeFileName || 'resume.pdf',
                profileCompleted: true
            };

            const res = await axios.put('http://localhost:5001/api/applicant/profile', updatedPayload, authConfig);
            setMessage('Profile updated successfully from resume!');
            setProfile(res.data.profile);
            setProfileCompletion(res.data.completion);
            fetchRecommendations();
        } catch (err) {
            console.error('Error saving parsed profile:', err);
            setError(err.response?.data?.error || 'Failed to update profile from resume.');
        }
    };

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const authConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    useEffect(() => {
        fetchOpenJobs();
        fetchMyApplications();
        fetchProfile();
        fetchRecommendations();
    }, []);


    const [resumeFile, setResumeFile] = useState(null);

    const fetchOpenJobs = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/jobs', authConfig);
            setJobs(res.data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/applicant/profile', authConfig);
            setProfile(res.data.profile);
            setProfileCompletion(res.data.completion);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/applicant/recommendations', authConfig);
            setRecommendedJobs(res.data);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/jobs/candidate/applications/${user.id}`, authConfig);
            setMyApplications(res.data);
        } catch (err) {
            console.error('Error fetching my applications:', err);
        }
    };

    const handleApply = async (jobId) => {
        setError('');
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('jobId', jobId);
            if (resumeFile) formData.append('resume', resumeFile);

            const res = await axios.post('http://localhost:5001/api/jobs/apply', formData, authConfig);
            setMessage(res.data.message);
            fetchMyApplications();
            setActiveView('Applications');
            window.history.replaceState({}, '', '/applicant/applications');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit application.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    const navItems = ['Browse', 'Applications', 'Profile'];
    const filteredJobs = jobs.filter((job) => {
        const searchable = `${job.title} ${job.department} ${job.location} ${job.description} ${(job.requirements || []).join(' ')}`.toLowerCase();
        return searchable.includes(searchTerm.toLowerCase())
            && (!locationFilter || job.location === locationFilter)
            && (!departmentFilter || job.department === departmentFilter)
            && (!employmentFilter || job.employmentType === employmentFilter);
    });
    const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))];
    const departments = [...new Set(jobs.map((job) => job.department).filter(Boolean))];
    const employmentTypes = [...new Set(jobs.map((job) => job.employmentType).filter(Boolean))];

    const renderSidebar = () => (
        <aside className="ats-sidebar sticky top-0 hidden h-screen w-[252px] flex-col justify-between p-4 lg:flex text-white">
            <div className="flex flex-1 min-h-0 flex-col">
                <div className="flex items-center gap-3 px-2 pb-4 pt-1 shrink-0">
                    <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-md">A</div>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                        <div className="text-sm font-bold text-white">AvantHire</div>
                    </div>
                </div>

                <div className="glass-box mt-3 rounded-2xl px-3 py-2.5 shrink-0">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span>Career mode</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="brand-badge flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold">{(user.name || 'S').charAt(0).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-white">{user.name || 'Applicant'}</div>
                            <div className="truncate text-[11px] text-slate-400">Candidate profile</div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = activeView === item;
                        const Icon = item === 'Browse' ? Grid2x2 : item === 'Applications' ? BriefcaseBusiness : UserRound;
                        return (
                            <button key={item} type="button" onClick={() => { setActiveView(item); window.history.replaceState({}, '', item === 'Applications' ? '/applicant/applications' : item === 'Profile' ? '/applicant/profile' : '/applicant'); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'nav-item-active font-bold shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                                <span>{item}</span>
                                {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                            </button>
                        );
                    })}

                    <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preferences</div>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setActiveView('Settings');
                                window.history.replaceState({}, '', '/applicant/settings');
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                activeView === 'Settings'
                                    ? 'nav-item-active font-bold shadow-sm'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <Settings size={16} className={activeView === 'Settings' ? 'text-white' : 'text-slate-400'} />
                            <span>Settings</span>
                            {activeView === 'Settings' && <span className="ml-auto h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <LogOut size={16} />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pinned Candidate Profile Card at the very bottom */}
            <div className="glass-box mt-3 rounded-2xl p-3 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="brand-badge flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                        {(user.name || 'S').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="user-name-text truncate text-sm font-bold">{user.name || 'Applicant'}</div>
                        <div className="user-subtitle-text truncate text-[11px]">{profile?.headline || 'Profile incomplete'}</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const mobileNav = (
        <AnimatePresence>
            {mobileNavOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden">
                    <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="ats-sidebar h-full w-[84%] max-w-[280px] p-4 text-white">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md">A</div>
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                                    <div className="text-sm font-bold text-white">AvantHire</div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setMobileNavOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {navItems.map((item) => {
                                const isActive = activeView === item;
                                const Icon = item === 'Browse' ? Grid2x2 : item === 'Applications' ? BriefcaseBusiness : UserRound;
                                return (
                                    <button key={item} type="button" onClick={() => {
                                        setActiveView(item);
                                        window.history.replaceState({}, '', item === 'Applications' ? '/applicant/applications' : item === 'Profile' ? '/applicant/profile' : '/applicant');
                                        setMobileNavOpen(false);
                                    }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-white/15 text-white border border-white/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                                        <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                                        <span>{item}</span>
                                    </button>
                                );
                            })}
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveView('Settings');
                                    window.history.replaceState({}, '', '/applicant/settings');
                                    setMobileNavOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                                    activeView === 'Settings'
                                        ? 'bg-white/15 text-white border border-white/20'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Settings size={16} className={activeView === 'Settings' ? 'text-indigo-400' : 'text-slate-400'} />
                                <span>Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
                            >
                                <LogOut size={16} />
                                <span>Log out</span>
                            </button>
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="app-shell flex min-h-screen text-white">
            {renderSidebar()}
            {mobileNav}

            <div className="min-w-0 flex-1">
                <header className="ats-header border-b sticky top-0 z-20">
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
                                <input placeholder="Search roles, teams, skills..." className="glass-input w-[290px] rounded-xl py-2.5 pl-9 pr-12 text-sm outline-none transition focus:border-indigo-400" />
                                <div className="glass-box absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold">⌘ K</div>
                            </div>
                            
                            {/* Live Notification Dropdown for Applicant */}
                            <NotificationDropdown onNotificationClick={handleCandidateNotificationClick} />

                            {/* Theme Toggle Button (Light / Dark) */}
                            <ThemeToggle />

                            <button type="button" onClick={handleLogout} className="glass-box rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition hover:bg-white/20">
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</div>}
                    {message && <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{message}</div>}

                    {activeView === 'Profile' && profile && !editingProfile && (
                        <div>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Your profile</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">{user.name}</h1>
                                    <p className="mt-2 text-sm text-slate-300">{profile.headline || 'Add a professional headline'} · {profile.location || 'Location not added'}</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsParserOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500/30 transition shadow-sm"
                                    >
                                        <Sparkles size={14} className="text-indigo-300" />
                                        <span>Auto-fill from Resume (PDF)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingProfile(true)}
                                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm"
                                    >
                                        Edit profile
                                    </button>
                                </div>
                            </div>
                            <div className="glass-container mb-5 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Profile completion</div>
                                        <div className="mt-2 text-3xl font-bold text-white">{profileCompletion}%</div>
                                    </div>
                                    <div className="h-2.5 w-40 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${profileCompletion}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-4 lg:grid-cols-2">
                                <ProfileSection title="About" content={profile.summary || 'No professional summary added yet.'} />
                                <ProfileSection title="Skills" content={profile.skills?.length ? profile.skills.join(' · ') : 'No skills added yet.'} />
                                <ProfileSection title="Experience" content={profile.experiences?.length ? profile.experiences.map((item) => `${item.title || 'Role'} at ${item.company || 'Company'}`).join(' · ') : 'No experience added yet.'} />
                                <ProfileSection title="Education" content={profile.education?.length ? profile.education.map((item) => `${item.degree || 'Degree'} at ${item.institution || 'Institution'}`).join(' · ') : 'No education added yet.'} />
                                <ProfileSection title="Certifications" content={profile.certifications?.length ? profile.certifications.map((item) => item.name).join(' · ') : 'No certifications added yet.'} />
                                <ProfileSection title="Achievements" content={profile.achievements?.length ? profile.achievements.map((item) => item.title).join(' · ') : 'No achievements added yet.'} />
                                <ProfileSection title="Resume" content={profile.resumeFileName || 'No resume uploaded.'} />
                            </div>
                        </div>
                    )}

                    {activeView === 'Profile' && editingProfile && <ApplicantOnboarding user={user} initialProfile={profile} onComplete={(updatedProfile) => { setProfile(updatedProfile); setEditingProfile(false); fetchProfile(); }} />}

                    {activeView === 'Browse' && (
                        <>
                            <div className="mb-6 border-b border-white/10 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Find your next opportunity</div>
                                <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">Hi {user.name || 'Applicant'}, discover what’s next.</h1>
                                <p className="mt-2 text-sm text-slate-300">Explore roles from companies hiring on AvantHire.</p>
                            </div>

                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Based on your profile</div>
                                        <h2 className="mt-1 text-lg font-bold text-white">Recommended jobs</h2>
                                    </div>
                                    <span className="text-xs text-slate-300 font-medium">{recommendedJobs.length} matches</span>
                                </div>
                                {recommendedJobs.length === 0 ? (
                                    <div className="glass-container rounded-2xl p-6 text-sm text-slate-300 border border-white/10">
                                        No roles match your profile yet. Update your skills or career preferences to improve recommendations.
                                    </div>
                                ) : (
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {recommendedJobs.slice(0, 4).map((job) => (
                                            <div key={job._id} onClick={() => setExpandedMatchJobId(expandedMatchJobId === job._id ? null : job._id)} className="glass-box flex flex-col cursor-pointer rounded-2xl p-4 transition hover:bg-white/15">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-bold text-white">{job.title}</div>
                                                        <div className="mt-1 truncate text-xs text-slate-300">{job.companyId?.name || 'Company unavailable'} · {job.location}</div>
                                                    </div>
                                                    <div className="shrink-0 rounded-full bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-1 text-xs font-bold text-indigo-200 shadow-sm">
                                                        {job.matchScore}% match
                                                    </div>
                                                </div>
                                                {expandedMatchJobId === job._id && (
                                                    <div className="mt-3 border-t border-white/10 pt-3" onClick={(e) => e.stopPropagation()}>
                                                        <CandidateMatchCard jobId={job._id} candidateId={user.id || user._id} compact={true} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr]">
                                <div className="relative">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search jobs" className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-indigo-400" />
                                </div>
                                <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="glass-input rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                                    <option value="">All locations</option>
                                    {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                                </select>
                                <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="glass-input rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                                    <option value="">All departments</option>
                                    {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                                </select>
                                <select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)} className="glass-input rounded-xl px-3 py-2.5 text-sm text-white outline-none">
                                    <option value="">All job types</option>
                                    {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                                {filteredJobs.length === 0 ? (
                                    <div className="glass-box col-span-full rounded-2xl p-10 text-center text-sm text-slate-300">
                                        No open roles right now. New jobs will appear here soon.
                                    </div>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <div key={job._id} className="glass-container rounded-[24px] p-5">
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold tracking-[-0.04em] text-white">{job.title}</div>
                                                        <div className="mt-1 text-[12px] text-slate-300">{job.department}</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                                                    {job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : 'Recently posted'}
                                                </div>
                                            </div>

                                            <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-slate-300">
                                                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                                                <span>•</span>
                                                <span>{job.employmentType || 'Employment type unavailable'}</span>
                                            </div>

                                            <p className="mb-4 text-sm leading-6 text-slate-200">{job.description}</p>

                                            <div className="mb-5 flex flex-wrap gap-2">
                                                {(job.requirements || []).map((skill) => (
                                                    <span key={skill} className="glass-pill rounded-full px-3 py-1 text-[11px] font-medium text-white shadow-xs">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="text-[12px] text-slate-300">{job.requirements?.length ? `${job.requirements.length} reqs` : 'No requirements'}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedMatchJobId(expandedMatchJobId === job._id ? null : job._id)}
                                                        className="glass-box inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-white/20"
                                                    >
                                                        <Sparkles size={12} className="text-indigo-300" />
                                                        <span>{expandedMatchJobId === job._id ? 'Hide Match' : 'Explain Match Fit'}</span>
                                                    </button>
                                                </div>
                                                <div className="mt-4 flex flex-col space-y-3 md:mt-0 md:w-64">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(event) => setResumeFile(event.target.files[0])}
                                                        className="text-xs text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20 file:cursor-pointer"
                                                    />
                                                    <button type="button" disabled={myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id)} onClick={() => handleApply(job._id)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-emerald-600">
                                                        {myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id) ? 'Applied' : 'Apply Now'}
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedMatchJobId === job._id && (
                                                <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in duration-200">
                                                    <CandidateMatchCard jobId={job._id} candidateId={user.id || user._id} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeView === 'Applications' && (
                        <div>
                            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-5">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Your activity</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">My Applications</h1>
                                </div>
                                <div className="glass-box rounded-xl px-3 py-2 text-sm font-medium text-slate-200">{myApplications.length} total</div>
                            </div>

                            {myApplications.length === 0 ? (
                                <div className="glass-box rounded-2xl p-10 text-center text-sm text-slate-300">
                                    You have not applied to any roles yet. Explore openings to get started.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myApplications.map((app) => (
                                        <div key={app._id} className="glass-container rounded-[24px] p-5">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="text-xl font-bold tracking-[-0.04em] text-white">{app.jobId?.title || 'Untitled role'}</div>
                                                    <div className="mt-1 text-[12px] text-slate-300">{app.jobId?.companyId?.name || 'Company unavailable'} · {app.jobId?.department || 'Department unavailable'} · {app.jobId?.location || 'Location unavailable'}</div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {app.match && (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shadow-xs ${
                                                            app.match.matchScore >= 80
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                                                : app.match.matchScore >= 50
                                                                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                                                                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                                                        }`}>
                                                            <Sparkles size={11} className={app.match.matchScore >= 80 ? 'text-emerald-300' : 'text-indigo-300'} />
                                                            <span>{app.match.matchScore}% Match Fit</span>
                                                        </span>
                                                    )}
                                                    <div className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">{app.status || 'Applied'}</div>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                <div className="glass-box glass-component rounded-2xl p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current Status</div>
                                                    <div className="mt-2 text-sm font-bold text-white">{app.status}</div>
                                                </div>
                                                <div className="glass-box glass-component rounded-2xl p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Applied Date</div>
                                                    <div className="mt-2 text-sm font-bold text-white">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Unknown date'}</div>
                                                </div>
                                                <div className="glass-box glass-component rounded-2xl p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resume</div>
                                                    <div className="mt-2 text-sm font-bold text-white">
                                                        {app.resumeUrl ? (
                                                            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                                                                View Submitted Resume
                                                            </a>
                                                        ) : (
                                                            'Not provided'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {app.interviewScheduledAt && (
                                                <div className="glass-box glass-component mt-4 rounded-2xl border-indigo-400/40 bg-indigo-500/15 p-4 text-white">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Interview scheduled</div>
                                                    <div className="mt-2 text-sm font-bold text-white">{new Date(app.interviewScheduledAt).toLocaleString()}</div>
                                                    <div className="mt-1 text-xs font-semibold text-indigo-300">{app.interviewRound || 'Interview round'}</div>
                                                    <div className="mt-1 text-xs text-slate-300">{app.interviewLocation || 'Location not provided'}</div>
                                                    {app.interviewNotes && <div className="mt-2 text-xs text-slate-300">{app.interviewNotes}</div>}
                                                </div>
                                            )}

                                            {/* Progressive Application Timeline */}
                                            <div className="mt-5">
                                                <ApplicationTimeline
                                                    currentStatus={app.status || 'Applied'}
                                                    statusHistory={app.statusHistory || []}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'Settings' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preferences</div>
                                    <h1 className="text-[28px] font-bold tracking-[-0.05em] text-white">Candidate Settings</h1>
                                    <p className="mt-1 text-sm text-slate-300">Manage your job-seeking status, notification alerts, and account preferences.</p>
                                </div>
                                {settingsSaved && (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 animate-in fade-in duration-200">
                                        <CheckCircle2 size={15} className="text-emerald-400" />
                                        <span>Preferences saved</span>
                                    </div>
                                )}
                            </div>

                            {/* Account & Profile Card */}
                            <div className="glass-container rounded-[24px] p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
                                            {(user.name || 'S').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-white">{user.name || 'Applicant'}</h3>
                                                <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                                                    Candidate
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-300">{user.email || 'applicant@avanthire.com'}</p>
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Profile completion: <span className="font-bold text-indigo-300">{profileCompletion}%</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveView('Profile');
                                            setEditingProfile(true);
                                            window.history.replaceState({}, '', '/applicant/profile');
                                        }}
                                        className="glass-box inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                    >
                                        <UserRound size={14} />
                                        <span>Edit Profile Details</span>
                                    </button>
                                </div>
                            </div>

                            {/* Job Seeking Availability Status */}
                            <div className="glass-container rounded-[24px] p-6">
                                <div className="mb-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Job Search Status</div>
                                    <h2 className="mt-1 text-base font-bold text-white">Your Availability</h2>
                                    <p className="text-xs text-slate-300">Signal your current status to hiring managers and automated matchmaking.</p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    {[
                                        {
                                            id: 'actively_looking',
                                            title: 'Actively Looking',
                                            desc: 'Ready for interviews and fast-moving job opportunities.',
                                            icon: '🚀',
                                        },
                                        {
                                            id: 'open_to_offers',
                                            title: 'Open to Offers',
                                            desc: 'Happy in current role, but open to the right next step.',
                                            icon: '✨',
                                        },
                                        {
                                            id: 'not_looking',
                                            title: 'Not Looking',
                                            desc: 'Paused job search. Do not contact for new openings.',
                                            icon: '☕',
                                        },
                                    ].map((opt) => {
                                        const isSelected = candidateSettings.jobSeekingStatus === opt.id;
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => updateCandidateSettings({ jobSeekingStatus: opt.id })}
                                                className={`cursor-pointer rounded-2xl p-4 transition ${
                                                    isSelected
                                                        ? 'border-2 border-indigo-400 bg-indigo-600/30 shadow-md ring-1 ring-indigo-400/40'
                                                        : 'glass-box hover:bg-white/15'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xl">{opt.icon}</span>
                                                    {isSelected && (
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                                                            <Check size={12} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="mt-3 text-sm font-bold text-white">{opt.title}</h3>
                                                <p className="mt-1 text-xs text-slate-300">{opt.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notification Preferences */}
                            <div className="glass-container rounded-[24px] p-6">
                                <div className="mb-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alerts & Notifications</div>
                                    <h2 className="mt-1 text-base font-bold text-white">Live In-App Alerts</h2>
                                    <p className="text-xs text-slate-300">Configure what triggers alerts in your top notification bell.</p>
                                </div>

                                <div className="divide-y divide-white/10">
                                    {[
                                        {
                                            key: 'jobAlerts',
                                            title: 'New Job Opening Alerts',
                                            desc: 'Receive alerts whenever a recruiter posts a new role matching your skills.',
                                        },
                                        {
                                            key: 'statusUpdates',
                                            title: 'Application Stage Progress',
                                            desc: 'Get notified immediately when your application moves to Screening, Interviewing, or Offered.',
                                        },
                                        {
                                            key: 'interviewReminders',
                                            title: 'Interview Invitations & Schedules',
                                            desc: 'Receive alerts when interview meetings are booked, rescheduled, or have notes added.',
                                        },
                                    ].map((item) => {
                                        const isEnabled = candidateSettings[item.key] !== false;
                                        return (
                                            <div key={item.key} className="flex items-center justify-between py-3.5">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{item.title}</div>
                                                    <div className="text-xs text-slate-300">{item.desc}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateCandidateSettings({ [item.key]: !isEnabled })}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                                                        isEnabled ? 'bg-indigo-600' : 'bg-white/20'
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                            isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                                        } mt-0.5`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Privacy & Account Actions */}
                            <div className="glass-container rounded-[24px] p-6">
                                <div className="mb-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Security & Sign out</div>
                                    <h2 className="mt-1 text-base font-bold text-white">Account Session</h2>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/15 p-4">
                                    <div>
                                        <div className="text-sm font-bold text-rose-200">Sign Out of AvantHire ATS</div>
                                        <p className="mt-0.5 text-xs text-rose-300/80">End your current session on this device.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-500 shadow-sm"
                                    >
                                        <LogOut size={14} />
                                        <span>Log out now</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <div className="ats-header fixed inset-x-0 bottom-0 z-30 p-2 lg:hidden">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
                    {['Browse', 'Applications', 'Profile', 'Settings'].map((item) => {
                        const Icon = item === 'Browse' ? Grid2x2 : item === 'Applications' ? BriefcaseBusiness : item === 'Profile' ? UserRound : Settings;
                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    setActiveView(item);
                                    window.history.replaceState({}, '', item === 'Applications' ? '/applicant/applications' : item === 'Profile' ? '/applicant/profile' : item === 'Settings' ? '/applicant/settings' : '/applicant');
                                }}
                                className={`flex flex-col items-center rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                                    activeView === item
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Icon size={16} />
                                <span className="mt-1">{item}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <ResumeParserModal
                isOpen={isParserOpen}
                onClose={() => setIsParserOpen(false)}
                onApplyParsedData={handleApplyResumeToProfile}
            />
        </div>
    );
}

function ProfileSection({ title, content }) {
    return (
        <section className="glass-container rounded-2xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-200">{content}</p>
        </section>
    );
}