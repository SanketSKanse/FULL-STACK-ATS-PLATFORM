import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchOpenJobs();
  }, []);

  const fetchOpenJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const handleApply = async (jobId) => {
    setError('');
    setMessage('');

    try {
      const payload = {
        jobId,
        candidateId: user.id,
        resumeUrl: "https://example.com/sample-resume.pdf" // Placeholder for now until resume upload phase
      };

      const res = await axios.post('http://localhost:5001/api/jobs/apply', payload);
      setMessage(res.data.message);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Candidate Portal</h1>
            <p className="text-sm text-gray-500">Welcome, {user.name} • Looking for your next role</p>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Log Out
          </button>
        </div>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">{message}</div>}

        {/* Job Board Listings */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Available Openings</h2>

          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No active job openings available at the moment. Check back soon!</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="flex flex-col justify-between rounded-lg border border-gray-200 p-5 transition hover:shadow-md md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{job.title}</h3>
                    <p className="text-xs font-semibold text-blue-600">{job.department} • {job.location}</p>
                    <p className="mt-2 text-sm text-gray-600">{job.description}</p>
                    <p className="mt-2 text-xs text-gray-400">Posted by: {job.postedBy?.name || 'Company Recruiter'}</p>
                  </div>
                  <button 
                    onClick={() => handleApply(job._id)}
                    className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 md:mt-0"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}