import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import RecruiterDashboard from './components/RecruiterDashboard';
import CandidateDashboard from './components/CandidateDashboard';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) {
    return <Auth />;
  }

  if (user.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  if (user.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return null;
}