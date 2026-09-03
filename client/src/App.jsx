import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import RecruiterDashboard from './components/RecruiterDashboard';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // If not logged in, show Auth component
  if (!user) {
    return <Auth />;
  }

  // If logged in as recruiter, show Recruiter Dashboard
  if (user.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  // Fallback for Candidate view (we will build this next)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Candidate Dashboard Coming Soon!</h1>
      <p className="mt-2 text-sm text-gray-600">Logged in as: {user.name} ({user.email})</p>
      <button 
        onClick={() => { localStorage.clear(); window.location.reload(); }}
        className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Log Out
      </button>
    </div>
  );
}