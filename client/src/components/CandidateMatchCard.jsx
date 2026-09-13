import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertCircle, Sparkles, TrendingUp, Briefcase, Award, ShieldCheck } from 'lucide-react';

/**
 * CandidateMatchCard
 * Explainable candidate-to-job matching breakdown card.
 * Can be provided with direct `matchData` or `(jobId, candidateId)` to fetch dynamically.
 */
export default function CandidateMatchCard({ jobId, candidateId, matchData: initialMatchData, compact = false, showHeader = true }) {
  const [matchData, setMatchData] = useState(initialMatchData || null);
  const [loading, setLoading] = useState(!initialMatchData && Boolean(jobId && candidateId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialMatchData) {
      setMatchData(initialMatchData);
      setLoading(false);
      return;
    }

    if (!jobId || !candidateId) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5001/api/jobs/${jobId}/match/${candidateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (isMounted) {
          setMatchData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching match breakdown:', err);
          setError(err.response?.data?.error || 'Unable to calculate match analysis.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [jobId, candidateId, initialMatchData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-8 w-16 bg-slate-200 rounded-full"></div>
        </div>
        <div className="mt-4 h-3 w-full bg-slate-100 rounded"></div>
        <div className="mt-2 h-3 w-3/4 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-600">
        <div className="flex items-center gap-1.5 font-semibold">
          <AlertCircle size={14} />
          <span>Match calculation unavailable</span>
        </div>
        <p className="mt-1 text-slate-500">{error}</p>
      </div>
    );
  }

  if (!matchData) return null;

  const {
    matchScore = 0,
    matchingSkills = [],
    missingSkills = [],
    recommendationReason = '',
    breakdown = { skillsScore: 0, experienceScore: 0, contextScore: 0 },
    candidateYears = 0,
    requiredExperienceYears = 0
  } = matchData;

  // Visual styling accents based on score threshold
  const scoreTone = matchScore >= 80 ? 'emerald' : matchScore >= 50 ? 'indigo' : 'amber';
  const badgeColors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200'
  }[scoreTone];

  const barColors = {
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-600',
    amber: 'bg-amber-500'
  }[scoreTone];

  if (compact) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Match Fit</span>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColors}`}>
            {matchScore}% Match
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{recommendationReason}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchingSkills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 size={10} /> {skill}
            </span>
          ))}
          {missingSkills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition">
      {showHeader && (
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">Explainable Candidate Match</h3>
              <p className="text-[11px] text-slate-400">Multi-factor algorithmic qualification scoring</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold shadow-xs ${badgeColors}`}>
            <Award size={15} />
            <span>{matchScore}% Match</span>
          </div>
        </div>
      )}

      {/* Narrative Explanation */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Analysis Summary</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-700">{recommendationReason}</p>
      </div>

      {/* Core Breakdown Progress Bars */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Skills Fit</span>
            <span className="font-bold text-slate-900">{breakdown.skillsScore}/50</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${barColors}`} style={{ width: `${(breakdown.skillsScore / 50) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Experience</span>
            <span className="font-bold text-slate-900">{breakdown.experienceScore}/30</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(breakdown.experienceScore / 30) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Domain Alignment</span>
            <span className="font-bold text-slate-900">{breakdown.contextScore}/20</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(breakdown.contextScore / 20) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Experience Tenure Comparison */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Briefcase size={14} className="text-slate-400" />
          <span>Experience depth:</span>
          <strong className="text-slate-800">{candidateYears} yrs candidate</strong>
        </div>
        <div className="text-slate-500">
          Requirement: <span className="font-semibold text-slate-700">{requiredExperienceYears ? `${requiredExperienceYears}+ yrs` : 'Entry / Flexible'}</span>
        </div>
      </div>

      {/* Skills Comparison Pill Tags */}
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 size={13} />
            <span>Matching Requirements ({matchingSkills.length})</span>
          </div>
          {matchingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No listed skill overlap found yet.</p>
          )}
        </div>

        {missingSkills.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <TrendingUp size={13} />
              <span>Target Skills to Explore ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparent Non-Gatekeeping Note */}
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-500" />
        <span>
          <strong>AvantHire Fair Match Guarantee:</strong> Scores are purely informational indicators designed to assist recruiters and guide candidates. Low scores are never automatically disqualified or rejected.
        </span>
      </div>
    </div>
  );
}
