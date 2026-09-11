import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BriefcaseBusiness, Building2, ChevronDown, CircleHelp, FolderKanban, Grid2x2, MapPin, Menu, Search, Settings, UserRound, Users, X } from 'lucide-react';
import ApplicantOnboarding from './ApplicantOnboarding';

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
    const [activeView, setActiveView] = useState(window.location.pathname.includes('/applications') ? 'Applications' : window.location.pathname.includes('/profile') ? 'Profile' : 'Browse');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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
                    <span>Career mode</span>
                    <ChevronDown size={14} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">{(user.name || 'S').charAt(0).toUpperCase()}</div>
                    <div>
                        <div className="text-sm font-semibold text-slate-800">{user.name || 'Applicant'}</div>
                        <div className="text-[11px] text-slate-500">Candidate profile</div>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeView === item;
                    const Icon = item === 'Browse' ? Grid2x2 : item === 'Applications' ? BriefcaseBusiness : UserRound;
                    return (
                        <button key={item} type="button" onClick={() => { setActiveView(item); window.history.replaceState({}, '', item === 'Applications' ? '/applicant/applications' : item === 'Profile' ? '/applicant/profile' : '/applicant'); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                            <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                            <span>{item}</span>
                            {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
                <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Profile</div>
                {['Saved jobs', 'Settings'].map((item) => {
                    const Icon = item === 'Saved jobs' ? Users : Settings;
                    return (
                        <button key={item} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
                            <Icon size={16} className="text-slate-400" />
                            <span>{item}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {(user.name || 'S').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{user.name || 'Applicant'}</div>
                        <div className="truncate text-[11px] text-slate-500">{profile?.headline || 'Profile incomplete'}</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const mobileNav = (
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
                                const isActive = activeView === item;
                                const Icon = item === 'Browse' ? Grid2x2 : item === 'Applications' ? BriefcaseBusiness : UserRound;
                                return (
                                    <button key={item} type="button" onClick={() => {
                                        setActiveView(item);
                                        window.history.replaceState({}, '', item === 'Applications' ? '/applicant/applications' : item === 'Profile' ? '/applicant/profile' : '/applicant');
                                        setMobileNavOpen(false);
                                    }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                                        <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                        <span>{item}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="app-shell flex">
            {renderSidebar()}
            {mobileNav}

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
                                <input placeholder="Search roles, teams, skills..." className="w-[290px] rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-12 text-sm text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white" />
                                <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-500">⌘ K</div>
                            </div>
                            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                                <Bell size={16} />
                            </button>
                            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                                <CircleHelp size={16} />
                            </button>
                            <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">
                                Sign out
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pb-24 lg:pb-6">
                    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                    {message && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

                    {activeView === 'Profile' && profile && !editingProfile && (
                        <div>
                            <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-5"><div><div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Your profile</div><h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">{user.name}</h1><p className="mt-2 text-sm text-slate-500">{profile.headline || 'Add a professional headline'} · {profile.location || 'Location not added'}</p></div><button type="button" onClick={() => setEditingProfile(true)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Edit profile</button></div>
                            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Profile completion</div><div className="mt-2 text-3xl font-semibold text-slate-900">{profileCompletion}%</div></div><div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600" style={{ width: `${profileCompletion}%` }} /></div></div></div>
                            <div className="grid gap-4 lg:grid-cols-2"><ProfileSection title="About" content={profile.summary || 'No professional summary added yet.'} /><ProfileSection title="Skills" content={profile.skills?.length ? profile.skills.join(' · ') : 'No skills added yet.'} /><ProfileSection title="Experience" content={profile.experiences?.length ? profile.experiences.map((item) => `${item.title || 'Role'} at ${item.company || 'Company'}`).join(' · ') : 'No experience added yet.'} /><ProfileSection title="Education" content={profile.education?.length ? profile.education.map((item) => `${item.degree || 'Degree'} at ${item.institution || 'Institution'}`).join(' · ') : 'No education added yet.'} /><ProfileSection title="Certifications" content={profile.certifications?.length ? profile.certifications.map((item) => item.name).join(' · ') : 'No certifications added yet.'} /><ProfileSection title="Achievements" content={profile.achievements?.length ? profile.achievements.map((item) => item.title).join(' · ') : 'No achievements added yet.'} /><ProfileSection title="Resume" content={profile.resumeFileName || 'No resume uploaded.'} /></div>
                        </div>
                    )}

                    {activeView === 'Profile' && editingProfile && <ApplicantOnboarding user={user} initialProfile={profile} onComplete={(updatedProfile) => { setProfile(updatedProfile); setEditingProfile(false); fetchProfile(); }} />}

                    {activeView === 'Browse' && (
                        <>
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Find your next opportunity</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Hi {user.name || 'Applicant'}, discover what’s next.</h1>
                                <p className="mt-2 text-sm text-slate-500">Explore roles from companies hiring on AvantHire.</p>
                            </div>

                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Based on your profile</div><h2 className="mt-1 text-lg font-semibold text-slate-900">Recommended jobs</h2></div><span className="text-xs text-slate-500">{recommendedJobs.length} matches</span></div>
                                {recommendedJobs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">No roles match your profile yet. Update your skills or career preferences to improve recommendations.</div> : <div className="grid gap-3 lg:grid-cols-2">{recommendedJobs.slice(0, 4).map((job) => <div key={job._id} className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-900">{job.title}</div><div className="mt-1 truncate text-xs text-slate-500">{job.companyId?.name || 'Company unavailable'} · {job.location}</div></div><div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700">{job.matchScore}% match</div></div>)}</div>}
                            </div>

                            <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr]">
                                <div className="relative">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search jobs" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-200" />
                                </div>
                                <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"><option value="">All locations</option>{locations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
                                <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"><option value="">All departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select>
                                <select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"><option value="">All job types</option>{employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                                {filteredJobs.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">No open roles right now. New jobs will appear here soon.</div>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <div key={job._id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-semibold tracking-[-0.04em] text-slate-900">{job.title}</div>
                                                        <div className="mt-1 text-[12px] text-slate-500">{job.department}</div>
                                                    </div>
                                                </div>
                                                <div className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">{job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : 'Recently posted'}</div>
                                            </div>

                                            <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                                                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                                                <span>•</span>
                                                <span>{job.employmentType || 'Employment type unavailable'}</span>
                                            </div>

                                            <p className="mb-4 text-sm leading-6 text-slate-600">{job.description}</p>

                                            <div className="mb-5 flex flex-wrap gap-2">
                                                {(job.requirements || []).map((skill) => (
                                                    <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{skill}</span>
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                                                <div className="text-[12px] text-slate-500">{job.requirements?.length ? `${job.requirements.length} requirements` : 'No requirements specified'}</div>
                                                <div className="mt-4 flex flex-col space-y-3 md:mt-0 md:w-64">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(event) => setResumeFile(event.target.files[0])}
                                                        className="text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-indigo-600 hover:file:bg-indigo-100"
                                                    />
                                                    <button type="button" disabled={myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id)} onClick={() => handleApply(job._id)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-emerald-600">
                                                        {myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id) ? 'Applied' : 'Apply Now'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeView === 'Applications' && (
                        <div>
                            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-5">
                                <div>
                                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Your activity</div>
                                    <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">My Applications</h1>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">{myApplications.length} total</div>
                            </div>

                            {myApplications.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">You have not applied to any roles yet. Explore openings to get started.</div>
                            ) : (
                                <div className="space-y-4">
                                    {myApplications.map((app) => (
                                        <div key={app._id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="text-xl font-semibold tracking-[-0.04em] text-slate-900">{app.jobId?.title || 'Untitled role'}</div>
                                                    <div className="mt-1 text-[12px] text-slate-500">{app.jobId?.companyId?.name || 'Company unavailable'} · {app.jobId?.department || 'Department unavailable'} · {app.jobId?.location || 'Location unavailable'}</div>
                                                </div>
                                                <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">{app.status || 'Applied'}</div>
                                            </div>

                                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-800">{app.status}</div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Applied</div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-800">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Unknown date'}</div>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resume</div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-800">{app.resumeUrl ? 'Available' : 'Not provided'}</div>
                                                </div>
                                            </div>

                                            {app.interviewScheduledAt && (
                                                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Interview scheduled</div>
                                                    <div className="mt-2 text-sm font-semibold text-slate-800">{new Date(app.interviewScheduledAt).toLocaleString()}</div>
                                                    <div className="mt-1 text-xs font-medium text-indigo-700">{app.interviewRound || 'Interview round'}</div>
                                                    <div className="mt-1 text-xs text-slate-600">{app.interviewLocation || 'Location not provided'}</div>
                                                    {app.interviewNotes && <div className="mt-2 text-xs text-slate-600">{app.interviewNotes}</div>}
                                                </div>
                                            )}

                                            <div className="mt-5">
                                                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Timeline</div>
                                                <div className="space-y-4">
                                                    {(app.statusHistory || []).map((history, index) => (
                                                        <div key={history._id || history.createdAt} className="flex gap-3">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`mt-0.5 h-3 w-3 rounded-full ${index === 0 ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                                                                {index < (app.statusHistory || []).length - 1 && <div className="mt-2 h-8 w-px bg-slate-200" />}
                                                            </div>
                                                            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                                <div className="text-sm font-medium text-slate-800">{history.status}</div>
                                                                <div className="mt-1 text-[11px] text-slate-500">{new Date(history.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
        </div>
    );
}

function ProfileSection({ title, content }) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div><p className="mt-3 text-sm leading-6 text-slate-600">{content}</p></section>;
}