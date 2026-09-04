import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import RecruiterDashboard from './components/RecruiterDashboard';
import CandidateDashboard from './components/CandidateDashboard';
import ApplicantOnboarding from './components/ApplicantOnboarding';

export class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-soft">
            <h1 className="text-lg font-semibold text-slate-900">We could not load your workspace</h1>
            <p className="mt-2 text-sm text-slate-500">Your session may be outdated. Sign in again to continue.</p>
            <button type="button" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Return to sign in</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [applicantProfile, setApplicantProfile] = useState(undefined);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    axios.get('http://localhost:5001/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        const authenticatedUser = response.data.user;
        if (!['applicant', 'recruiter'].includes(authenticatedUser.role)) {
          throw new Error('Unsupported account role');
        }
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        if (authenticatedUser.role === 'applicant') {
          return axios.get('http://localhost:5001/api/applicant/profile', { headers: { Authorization: `Bearer ${token}` } })
            .then((profileResponse) => setApplicantProfile(profileResponse.data.profile));
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
      return;
    }
    const expectedPath = user.role === 'recruiter' ? '/recruiter' : '/applicant';
    if (window.location.pathname === '/' || window.location.pathname.startsWith(user.role === 'recruiter' ? '/applicant' : '/recruiter')) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, [user]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] text-sm text-slate-500">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (user.role === 'applicant' && applicantProfile === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] text-sm text-slate-500">Loading your profile...</div>;
  }

  if (user.role === 'applicant' && (!applicantProfile || !applicantProfile.profileCompleted)) {
    return <ApplicantOnboarding user={user} initialProfile={applicantProfile} onComplete={(profile) => { setApplicantProfile(profile); window.history.replaceState({}, '', '/applicant'); }} />;
  }

  if (user.role === 'recruiter') {
    return <RecruiterDashboard />;
  }

  if (user.role === 'applicant') {
    return <CandidateDashboard />;
  }

  return <Auth />;
}
