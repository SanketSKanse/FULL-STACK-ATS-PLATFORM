import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BriefcaseBusiness, CircleDashed, Sparkles, UserRound, Users } from 'lucide-react';


export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'applicant', companyName: '', companyWebsite: '', companyDescription: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    if (token) {
      setInviteToken(token);
      setLoadingInvite(true);
      api.get(`/api/team/invite-info/${token}`)
        .then((res) => {
          setInviteData(res.data);
          setIsLogin(false); // Switch to registration for the invited teammate
          setFormData((prev) => ({
            ...prev,
            name: res.data.name || prev.name,
            email: res.data.email || prev.email,
            role: 'recruiter',
          }));
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'This invitation link is invalid or has expired.');
        })
        .finally(() => {
          setLoadingInvite(false);
        });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = {
        ...formData,
        ...(inviteToken ? { inviteToken } : {})
      };
      const response = await api.post(endpoint, payload);


      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.user.role === 'recruiter' ? '/recruiter' : '/applicant';
        }, 400);
      } else {
        if (response.data.token) {
          // If registered with inviteToken, session token is already generated!
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setSuccessMessage(`Welcome to ${inviteData?.companyName || 'the workspace'}! Joining your team...`);
          setTimeout(() => {
            window.location.href = '/recruiter';
          }, 400);
        } else {
          setSuccessMessage('Registration successful! Please log in.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F3EDE2] text-[#2B2B2B]">
      <div className="hidden w-[48%] bg-[#242424] p-10 lg:flex lg:flex-col lg:justify-between border-r border-[#383838]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EDE2] text-sm font-bold text-[#2B2B2B]">A</div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D8D1C7]">ATS</div>
            <div className="text-base font-semibold text-[#F3EDE2]">AvantHire</div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#D8D1C7]">
            <Sparkles size={12} className="text-[#F3EDE2]" />
            Built for modern hiring teams
          </div>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.06em] text-[#F3EDE2]">
            Build better teams,
            <span className="block text-[#D8D1C7]">one great hire at a time.</span>
          </h1>

          <p className="mt-6 max-w-sm text-base leading-7 text-[#D8D1C7]">
            Everything your recruiting team needs to source, evaluate, and hire exceptional candidates.
          </p>

        </div>

        <div className="border-t border-white/10 pt-5 text-sm leading-6 text-[#D8D1C7]/70">
          One career profile for every opportunity you discover on AvantHire.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md rounded-[30px] border border-[#D8D1C7] bg-[#FAF7F2] p-6 shadow-soft sm:p-8 text-[#2B2B2B]">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B2B2B] text-sm font-bold text-[#F3EDE2]">A</div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">ATS</div>
                <div className="text-sm font-semibold text-[#2B2B2B]">AvantHire</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[#D8D1C7] bg-[#F3EDE2] px-2.5 py-1.5 text-[11px] font-medium text-[#5E5953]">
              <CircleDashed size={12} />
              Secure access
            </div>
          </div>

          <div className="mb-6">
            {inviteData ? (
              <div className="rounded-2xl border border-[#D8D1C7] bg-[#F3EDE2] p-4 mb-4 text-[#2B2B2B]">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5E5953]">
                  <Sparkles size={14} className="text-[#2B2B2B]" />
                  Team Invitation
                </div>
                <h3 className="mt-1 text-base font-bold text-[#2B2B2B]">
                  Join {inviteData.companyName}
                </h3>
                <p className="mt-0.5 text-xs text-[#5E5953]">
                  <span className="font-semibold text-[#2B2B2B]">{inviteData.inviterName}</span> invited you to join the hiring team as <span className="font-semibold text-[#2B2B2B]">{inviteData.role}</span>.
                </p>
                {inviteData.note && (
                  <div className="mt-2.5 rounded-xl border border-[#D8D1C7] bg-white p-2.5 text-xs italic text-[#2B2B2B]">
                    "{inviteData.note}"
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A746D]">
              {isLogin ? 'Welcome back' : inviteData ? 'Accept Invitation' : 'Create account'}
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#2B2B2B]">
              {isLogin ? 'Sign in to your workspace.' : inviteData ? 'Create your teammate account.' : 'Choose how you will use AvantHire.'}
            </h2>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {successMessage && <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#2B2B2B]">Full name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition focus:border-[#2B2B2B]" placeholder="Sanket Kanse" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#2B2B2B]">Work email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition focus:border-[#2B2B2B]" placeholder="you@company.com" readOnly={Boolean(inviteData?.email)} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-[#2B2B2B]">Password</label>
                {isLogin && <button type="button" className="text-xs font-semibold text-[#2B2B2B] hover:underline">Forgot password?</button>}
              </div>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition focus:border-[#2B2B2B]" placeholder="••••••••" />
            </div>

            {!isLogin && !inviteData && (
              <div>
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-[#2B2B2B]">How will you use AvantHire?</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { value: 'applicant', label: 'Applicant', description: 'Find jobs and track applications.', icon: UserRound },
                      { value: 'recruiter', label: 'Recruiter', description: 'Hire candidates and manage your pipeline.', icon: BriefcaseBusiness },
                    ].map(({ value, label, description, icon: Icon }) => {
                      const selected = formData.role === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setFormData((current) => ({ ...current, role: value }))}
                          className={`relative flex min-h-[158px] flex-col items-start rounded-2xl border p-4 text-left transition ${selected ? 'border-[#2B2B2B] bg-[#F3EDE2] ring-2 ring-[#2B2B2B]/20' : 'border-[#D8D1C7] bg-white hover:border-[#2B2B2B]'}`}
                        >
                          <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-[#2B2B2B] text-[#F3EDE2]' : 'bg-[#FAF7F2] text-[#2B2B2B]'}`}>
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span className="text-sm font-semibold text-[#2B2B2B]">{label}</span>
                          <span className="mt-1 text-xs leading-5 text-[#5E5953]">{description}</span>
                          {selected && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#2B2B2B]" aria-label="Selected" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {!isLogin && !inviteData && formData.role === 'recruiter' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#2B2B2B]">Company name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition focus:border-[#2B2B2B]" placeholder="Your company" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#2B2B2B]">Company website <span className="text-[#7A746D]">(optional)</span></label>
                  <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="w-full rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none transition focus:border-[#2B2B2B]" placeholder="https://company.com" />
                </div>
              </>
            )}

            <button type="submit" className="mt-2 w-full rounded-xl bg-[#2B2B2B] px-4 py-3 text-sm font-bold text-[#F3EDE2] transition hover:bg-[#1A1A1A] shadow-md">
              {isLogin ? 'Sign In' : inviteData ? 'Accept & Join Workspace' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7A746D]">
            <span className="h-px flex-1 bg-[#D8D1C7]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#D8D1C7]" />
          </div>

          <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D8D1C7] bg-white px-4 py-3 text-sm font-semibold text-[#2B2B2B] transition hover:bg-[#F3EDE2]">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.7h5.2c-.2 1.3-1.5 3.7-5.2 3.7-3.1 0-5.6-2.6-5.6-5.8s2.5-5.8 5.6-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.9 3.5 14.8 2.8 12 2.8 6.9 2.8 2.8 7 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.5H12Z" />
              <path fill="#34A853" d="M3.7 7.7l3.5 2.6c1-1.8 3-3 5.8-3 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.9 3.5 14.8 2.8 12 2.8c-3.4 0-6.3 1.9-8.3 4.9Z" opacity="0.2" />
              <path fill="#FBBC05" d="M3.7 16.3l3.8-2.9c1 1.9 3.1 3.2 5.5 3.2 1.8 0 3-.8 3.7-1.4l2.5 2.5C16.9 20.5 14.8 21.2 12 21.2c-3.4 0-6.3-1.9-8.3-4.9Z" opacity="0.2" />
              <path fill="#4285F4" d="M12 21.2c2.8 0 5.1-.9 6.8-2.5l-3.1-2.5c-.9.6-2.1 1-3.7 1-2.7 0-5-2-5.6-4.5l-3.2 2.5C1.1 18.7 4.9 21.2 12 21.2Z" opacity="0.2" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm text-[#5E5953]">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setIsLogin((value) => !value)} className="font-bold text-[#2B2B2B] underline">
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}