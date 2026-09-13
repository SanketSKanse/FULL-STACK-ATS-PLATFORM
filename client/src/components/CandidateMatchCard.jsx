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
      <div className="glass-box rounded-2xl p-5 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-white/20 rounded"></div>
          <div className="h-8 w-16 bg-white/20 rounded-full"></div>
        </div>
        <div className="mt-4 h-3 w-full bg-white/10 rounded"></div>
        <div className="mt-2 h-3 w-3/4 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-box rounded-2xl border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
        <div className="flex items-center gap-1.5 font-semibold">
          <AlertCircle size={14} />
          <span>Match calculation unavailable</span>
        </div>
        <p className="mt-1 text-slate-300">{error}</p>
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
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
  }[scoreTone];

  const barColors = {
    emerald: 'bg-emerald-400',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-400'
  }[scoreTone];

  if (compact) {
    return (
      <div className="glass-box rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Match Fit</span>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColors}`}>
            {matchScore}% Match
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-200">{recommendationReason}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchingSkills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
              <CheckCircle2 size={10} /> {skill}
            </span>
          ))}
          {missingSkills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md glass-pill px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-container rounded-2xl p-5 shadow-lg">
      {showHeader && (
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 text-indigo-300 shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">Explainable Candidate Match</h3>
              <p className="text-[11px] text-slate-400">Multi-factor algorithmic qualification scoring</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold shadow-xs ${badgeColors}`}>
            <Award size={15} />
            <span>{matchScore}% Match Fit</span>
          </div>
        </div>
      )}

      {/* Narrative Explanation */}
      <div className="rounded-xl border border-white/10 glass-box glass-component p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Analysis Summary</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-200">{recommendationReason}</p>
      </div>

      {/* Core Breakdown Progress Bars */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 glass-box glass-component p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Skills Fit</span>
            <span className="font-bold text-white">{breakdown.skillsScore}/50</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className={`h-full rounded-full ${barColors}`} style={{ width: `${(breakdown.skillsScore / 50) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 glass-box glass-component p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Experience</span>
            <span className="font-bold text-white">{breakdown.experienceScore}/30</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(breakdown.experienceScore / 30) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 glass-box glass-component p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Domain Alignment</span>
            <span className="font-bold text-white">{breakdown.contextScore}/20</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-indigo-300" style={{ width: `${(breakdown.contextScore / 20) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Experience Tenure Comparison */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 glass-box glass-component px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Briefcase size={14} className="text-slate-400" />
          <span>Experience depth:</span>
          <strong className="text-white">{candidateYears} yrs candidate</strong>
        </div>
        <div className="text-slate-300">
          Requirement: <span className="font-semibold text-white">{requiredExperienceYears ? `${requiredExperienceYears}+ yrs` : 'Entry / Flexible'}</span>
        </div>
      </div>

      {/* Skills Comparison Pill Tags */}
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            <CheckCircle2 size={13} />
            <span>Matching Requirements ({matchingSkills.length})</span>
          </div>
          {matchingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 size={11} className="text-emerald-400" />
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
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <TrendingUp size={13} />
              <span>Target Skills to Explore ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center rounded-lg glass-pill px-2.5 py-1 text-xs font-medium text-white">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparent Non-Gatekeeping Note */}
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 glass-box p-2.5 text-[11px] text-slate-300">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-indigo-400" />
        <span>
          <strong className="text-white">AvantHire Fair Match Guarantee:</strong> Scores are purely informational indicators designed to assist recruiters and guide candidates. Low scores are never automatically disqualified or rejected.
        </span>
      </div>
    </div>
  );
}
