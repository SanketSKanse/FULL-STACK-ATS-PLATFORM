import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get logged-in user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Fetch jobs posted by this company/recruiter on load
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
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
      const payload = {
        ...formData,
        postedBy: user.id // Attach the logged-in recruiter's ID
      };

      await axios.post('http://localhost:5001/api/jobs', payload);
      setMessage('Job posted successfully!');
      setFormData({ title: '', description: '', department: '', location: '' });
      fetchJobs(); // Refresh job list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); // Reload to switch back to Auth view
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Recruiter Portal</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.name} ({user.email})</p>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Post Job Form */}
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-1">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Post a New Position</h2>

            {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}
            {message && <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">{message}</div>}

            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Senior React Developer"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input 
                  type="text" 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Engineering"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Mumbai / Remote"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  rows="4"
                  placeholder="Provide brief role requirements..."
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Publish Job Listing
              </button>
            </form>
          </div>

          {/* Job Listings View */}
          <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-gray-800">Active Company Openings</h2>
            
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No job openings found. Create your first post on the left!</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job._id} className="rounded-lg border border-gray-200 p-4 transition hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-800">{job.title}</h3>
                        <p className="text-xs font-medium text-blue-600">{job.department} • {job.location}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Active</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{job.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}