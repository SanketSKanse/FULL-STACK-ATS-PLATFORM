import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BriefcaseBusiness, Building2, ChevronDown, CircleHelp, FolderKanban, Grid2x2, MapPin, Menu, Search, Settings, Sparkles, UserRound, Users, ArrowRight, X } from 'lucide-react';

export default function CandidateDashboard() {
    const [jobs, setJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [activeView, setActiveView] = useState('Browse');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const authConfig = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    useEffect(() => {
        fetchOpenJobs();
        fetchMyApplications();
    }, []);

    const fetchOpenJobs = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/jobs', authConfig);
            setJobs(res.data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
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
            const payload = {
                jobId,
                resumeUrl: 'https://example.com/sample-resume.pdf',
            };

            const res = await axios.post('http://localhost:5001/api/jobs/apply', payload, authConfig);
            setMessage(res.data.message);
            fetchMyApplications();
            setActiveView('Applications');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit application.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    };

    const navItems = ['Browse', 'Applications'];

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
                        <div className="text-sm font-semibold text-slate-800">{user.name || 'Sanket'}</div>
                        <div className="text-[11px] text-slate-500">Candidate profile</div>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeView === item;
                    const Icon = item === 'Browse' ? Grid2x2 : BriefcaseBusiness;
                    return (
                        <button key={item} type="button" onClick={() => setActiveView(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
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
                        <div className="truncate text-sm font-semibold text-slate-800">{user.name || 'Sanket'}</div>
                        <div className="truncate text-[11px] text-slate-500">Frontend developer</div>
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
                                const Icon = item === 'Browse' ? Grid2x2 : BriefcaseBusiness;
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

                    {activeView === 'Browse' && (
                        <>
                            <div className="mb-6 border-b border-slate-200 pb-5">
                                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Find your next opportunity</div>
                                <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-900">Hi {user.name || 'Sanket'}, discover what’s next.</h1>
                                <p className="mt-2 text-sm text-slate-500">Explore curated roles that match your experience and skills.</p>
                            </div>

                            <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr]">
                                <div className="relative">
                                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input placeholder="Search jobs" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-200" />
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">Location <span className="text-slate-400">Mumbai</span></div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">Department <span className="text-slate-400">Engineering</span></div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">Job type <span className="text-slate-400">Full-time</span></div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                                {jobs.length === 0 ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">No open roles right now. New jobs will appear here soon.</div>
                                ) : (
                                    jobs.map((job) => (
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

                                            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                                <div className="text-[12px] text-slate-500">{job.requirements?.length || 0} listed requirements</div>
                                                <button type="button" disabled={myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id)} onClick={() => handleApply(job._id)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-emerald-600">
                                                    {myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id) ? 'Applied' : 'Apply now'} {!myApplications.some((application) => application.jobId?._id === job._id || application.jobId === job._id) && <ArrowRight size={14} />}
                                                </button>
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
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">{myApplications.length || 0} active</div>
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
                                                    <div className="mt-2 text-sm font-semibold text-slate-800">Uploaded</div>
                                                </div>
                                            </div>

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