import React, { useState } from 'react';
import axios from 'axios';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const endpoint = isLogin ? 'http://localhost:5001/api/auth/login' : 'http://localhost:5001/api/auth/register';
      const response = await axios.post(endpoint, formData);

      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setSuccessMessage("Logged in successfully! Redirecting...");
        
        // --- ADDED THIS TIMEOUT & RELOAD ---
        setTimeout(() => {
          window.location.reload();
        }, 500);
        // ----------------------------------

      } else {
        setSuccessMessage("Registration successful! Please log in.");
        setIsLogin(true); // Switch to login view after signing up
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {isLogin ? 'Log in to ATS' : 'Create an ATS Account'}
        </h2>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">{error}</div>}
        {successMessage && <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">I am a:</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              >
                <option value="candidate">Candidate (Job Seeker)</option>
                <option value="recruiter">Recruiter / Company</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold transition hover:bg-blue-700"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}