import React, { useState, useEffect } from 'react';
import api from './utils/api';
import Auth from './components/Auth';
import RecruiterDashboard from './components/RecruiterDashboard';
import CandidateDashboard from './components/CandidateDashboard';
import ApplicantOnboarding from './components/ApplicantOnboarding';


export class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F3EDE2] p-6 text-center text-[#2B2B2B]">
          <div className="max-w-md rounded-2xl border border-[#D8D1C7] bg-[#FAF7F2] p-6 shadow-sm">
            <h1 className="text-lg font-bold text-[#2B2B2B]">We could not load your workspace</h1>
            <p className="mt-2 text-sm text-[#5E5953]">Your session may be outdated. Sign in again to continue.</p>
            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-600 text-left overflow-auto max-h-40">
                {this.state.error.message || String(this.state.error)}
                {this.state.error.stack && (
                  <pre className="mt-1 text-[10px] text-red-400 whitespace-pre-wrap">{this.state.error.stack.slice(0, 300)}</pre>
                )}
              </div>
            )}
            <button type="button" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }} className="mt-5 rounded-xl bg-[#242424] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] hover:bg-[#1A1A1A] transition">Return to sign in</button>
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

    api.get('/api/auth/me')
      .then((response) => {
        const authenticatedUser = response.data.user;
        if (!['applicant', 'recruiter'].includes(authenticatedUser.role)) {
          throw new Error('Unsupported account role');
        }
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
        if (authenticatedUser.role === 'applicant') {
          return api.get('/api/applicant/profile')
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
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', `/${window.location.search}`);
      }
      return;
    }
    const expectedPath = user.role === 'recruiter' ? '/recruiter' : '/applicant';
    if (window.location.pathname === '/' || window.location.pathname.startsWith(user.role === 'recruiter' ? '/applicant' : '/recruiter')) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, [user]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3EDE2] text-sm font-medium text-[#5E5953]">
        Loading your workspace...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (user.role === 'applicant' && applicantProfile === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F3EDE2] text-sm font-medium text-[#5E5953]">Loading your profile...</div>;
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
