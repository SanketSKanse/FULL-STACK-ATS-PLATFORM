import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchOpenJobs();
    fetchMyApplications();
  }, []);

  const fetchOpenJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/jobs/candidate/applications/${user.id}`);
      setMyApplications(res.data);
    } catch (err) {
      console.error("Error fetching my applications:", err);
    }
  };

  const handleApply = async (jobId) => {
    setError('');
    setMessage('');

    try {
      const payload = {
        jobId,
        candidateId: user.id,
        resumeUrl: "https://example.com/sample-resume.pdf"
      };

      const res = await axios.post('http://localhost:5001/api/jobs/apply', payload);
      setMessage(res.data.message);
      fetchMyApplications();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
              ATS
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Candidate Job Portal</h1>
              <p className="text-xs text-slate-500">Welcome, {user.name}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex space-x-2 border-b border-slate-200 pb-4">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs ${activeTab === 'browse' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            Explore Openings
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs flex items-center space-x-2 ${activeTab === 'applications' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <span>My Applications</span>
            <span className="ml-1 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] text-white">{myApplications.length}</span>
          </button>
        </div>

        {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-xs font-medium text-red-600 border border-red-100">{error}</div>}
        {message && <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-600 border border-emerald-100">{message}</div>}

        {activeTab === 'browse' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-slate-900">Active Open Roles</h2>

            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-400">No active job listings are currently available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job._id} className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition hover:border-slate-200 hover:bg-white hover:shadow-sm md:flex-row md:items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      <span className="inline-block mt-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">{job.department} • {job.location}</span>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{job.description}</p>
                    </div>
                    <button 
                      onClick={() => handleApply(job._id)}
                      className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 md:mt-0 md:shrink-0"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-slate-900">Application Tracking History</h2>

            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-400">You haven't submitted any applications yet. Explore openings to apply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div key={app._id} className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-6 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{app.jobId?.title || 'Position'}</h3>
                      <span className="inline-block mt-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">{app.jobId?.department} • {app.jobId?.location}</span>
                      <p className="mt-3 text-xs font-semibold text-slate-400">Submitted on: {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className={`inline-block rounded-full px-4 py-2 text-xs font-bold tracking-wide shadow-xs ${
                        app.status === 'Offered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        app.status === 'Shortlisted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        app.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Stage: {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}