import React, { useState } from 'react';
import axios from 'axios';
import { BriefcaseBusiness, CircleDashed, Sparkles, UserRound } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'applicant', companyName: '', companyWebsite: '', companyDescription: '' });
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
        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.user.role === 'recruiter' ? '/recruiter' : '/applicant';
        }, 400);
      } else {
        setSuccessMessage('Registration successful! Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F8FA] text-slate-900">
      <div className="hidden w-[48%] bg-[#101828] p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white">A</div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">ATS</div>
            <div className="text-base font-semibold text-white">AvantHire</div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-indigo-100">
            <Sparkles size={12} className="text-indigo-300" />
            Built for modern hiring teams
          </div>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.06em] text-white">
            Build better teams,
            <span className="block text-indigo-200">one great hire at a time.</span>
          </h1>

          <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
            Everything your recruiting team needs to source, evaluate, and hire exceptional candidates.
          </p>

        </div>

        <div className="border-t border-white/10 pt-5 text-sm leading-6 text-slate-400">
          One career profile for every opportunity you discover on AvantHire.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">A</div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">ATS</div>
                <div className="text-sm font-semibold text-slate-900">AvantHire</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-500">
              <CircleDashed size={12} />
              Secure access
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">{isLogin ? 'Welcome back' : 'Create account'}</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
              {isLogin ? 'Sign in to your workspace.' : 'Choose how you will use AvantHire.'}
            </h2>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {successMessage && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white" placeholder="Sanket Kanse" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Work email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white" placeholder="you@company.com" />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {isLogin && <button type="button" className="text-xs font-medium text-indigo-600">Forgot password?</button>}
              </div>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white" placeholder="••••••••" />
            </div>

            {!isLogin && (
              <div>
                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-slate-700">How will you use AvantHire?</legend>
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
                          className={`relative flex min-h-[158px] flex-col items-start rounded-2xl border p-4 text-left transition ${selected ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'}`}
                        >
                          <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{label}</span>
                          <span className="mt-1 text-xs leading-5 text-slate-500">{description}</span>
                          {selected && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-indigo-600" aria-label="Selected" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {!isLogin && formData.role === 'recruiter' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Company name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white" placeholder="Your company" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Company website <span className="text-slate-400">(optional)</span></label>
                  <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-200 focus:bg-white" placeholder="https://company.com" />
                </div>
              </>
            )}

            <button type="submit" className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
              {isLogin ? 'Sign In' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.7h5.2c-.2 1.3-1.5 3.7-5.2 3.7-3.1 0-5.6-2.6-5.6-5.8s2.5-5.8 5.6-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.9 3.5 14.8 2.8 12 2.8 6.9 2.8 2.8 7 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.5H12Z" />
              <path fill="#34A853" d="M3.7 7.7l3.5 2.6c1-1.8 3-3 5.8-3 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.9 3.5 14.8 2.8 12 2.8c-3.4 0-6.3 1.9-8.3 4.9Z" opacity="0.2" />
              <path fill="#FBBC05" d="M3.7 16.3l3.8-2.9c1 1.9 3.1 3.2 5.5 3.2 1.8 0 3-.8 3.7-1.4l2.5 2.5C16.9 20.5 14.8 21.2 12 21.2c-3.4 0-6.3-1.9-8.3-4.9Z" opacity="0.2" />
              <path fill="#4285F4" d="M12 21.2c2.8 0 5.1-.9 6.8-2.5l-3.1-2.5c-.9.6-2.1 1-3.7 1-2.7 0-5-2-5.6-4.5l-3.2 2.5C1.1 18.7 4.9 21.2 12 21.2Z" opacity="0.2" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => setIsLogin((value) => !value)} className="font-semibold text-indigo-600">
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}