import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs');
  const [formData, setFormData] = useState({ title: '', description: '', department: '', location: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/jobs/applications/${user.id}`);
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await axios.post('http://localhost:5001/api/jobs', { ...formData, postedBy: user.id });
      setMessage('Job successfully published to the public board!');
      setFormData({ title: '', description: '', department: '', location: '' });
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job.');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5001/api/jobs/applications/${appId}/status`, { status: newStatus });
      fetchApplications();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
              ATS
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Enterprise Recruiter Portal</h1>
              <p className="text-xs text-slate-500">{user.name} • {user.email}</p>
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex space-x-2 border-b border-slate-200 pb-4">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            Manage Job Openings
          </button>
          <button 
            onClick={() => setActiveTab('applicants')}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs flex items-center space-x-2 ${activeTab === 'applicants' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            <span>Candidate Pipeline</span>
            <span className="ml-1 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] text-white">{applications.length}</span>
          </button>
        </div>

        {activeTab === 'jobs' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Post Job Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-1">
              <h2 className="mb-4 text-base font-bold text-slate-900">Post New Role</h2>
              {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">{error}</div>}
              {message && <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-600 border border-emerald-100">{message}</div>}

              <form onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Job Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Senior Product Designer" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} required placeholder="e.g. Design & Creative" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g. Mumbai / Remote" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" placeholder="Core requirements & responsibilities..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition"></textarea>
                </div>
                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700">Publish Position</button>
              </form>
            </div>

            {/* Job Listings Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
              <h2 className="mb-4 text-base font-bold text-slate-900">Active Openings</h2>
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center">
                  <p className="text-sm text-slate-400">No active job listings found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                          <span className="inline-block mt-1 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">{job.department} • {job.location}</span>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-600 border border-emerald-100">Live</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{job.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Applicant Management Table View */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="mb-4 text-base font-bold text-slate-900">Candidate Pipeline Management</h2>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-400">No candidate submissions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Target Role</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Update Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {applications.map((app) => (
                      <tr key={app._id} className="transition hover:bg-slate-50/80">
                        <td className="py-4 px-4 font-bold text-slate-800">{app.candidateId?.name || 'Unknown'}</td>
                        <td className="py-4 px-4 text-slate-500 font-medium text-xs">{app.candidateId?.email || 'N/A'}</td>
                        <td className="py-4 px-4 font-semibold text-indigo-600 text-xs">{app.jobId?.title || 'Closed'}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${
                            app.status === 'Offered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            app.status === 'Shortlisted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            app.status === 'Interviewing' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offered">Offered</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}