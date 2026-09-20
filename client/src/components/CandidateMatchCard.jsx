import React, { useState, useEffect } from 'react';
import api from '../utils/api';
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

    api.get(`/api/jobs/${jobId}/match/${candidateId}`)
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
  const scoreTone = matchScore >= 80 ? 'emerald' : matchScore >= 50 ? 'charcoal' : 'amber';
  const badgeColors = {
    emerald: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
    charcoal: 'bg-[#EAE3D5] text-[#2B2B2B] border-[#D8D1C7]',
    amber: 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
  }[scoreTone];

  const barColors = {
    emerald: 'bg-[#137333]',
    charcoal: 'bg-[#2B2B2B]',
    amber: 'bg-[#B06000]'
  }[scoreTone];

  if (compact) {
    return (
      <div className="rounded-2xl border border-[#D8D1C7] bg-[#FFFFFF] p-4 shadow-sm text-[#2B2B2B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#2B2B2B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A746D]">AI Match Fit</span>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColors}`}>
            {matchScore}% Match
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#5E5953]">{recommendationReason}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchingSkills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md border border-[#CEEAD6] bg-[#E6F4EA] px-2 py-0.5 text-[11px] font-semibold text-[#137333]">
              <CheckCircle2 size={10} /> {skill}
            </span>
          ))}
          {missingSkills.slice(0, 3).map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md border border-[#D8D1C7] bg-[#F3EDE2] px-2 py-0.5 text-[11px] font-medium text-[#5E5953]">
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8D1C7] bg-[#FAF7F2] p-5 shadow-md text-[#2B2B2B]">
      {showHeader && (
        <div className="mb-4 flex items-center justify-between border-b border-[#D8D1C7] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D8D1C7] bg-[#F3EDE2] text-[#2B2B2B] shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[#2B2B2B]">Explainable Candidate Match</h3>
              <p className="text-[11px] text-[#7A746D]">Multi-factor algorithmic qualification scoring</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold shadow-xs ${badgeColors}`}>
            <Award size={15} />
            <span>{matchScore}% Match Fit</span>
          </div>
        </div>
      )}

      {/* Narrative Explanation */}
      <div className="rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A746D]">Analysis Summary</div>
        <p className="mt-1 text-xs leading-relaxed text-[#5E5953]">{recommendationReason}</p>
      </div>

      {/* Core Breakdown Progress Bars */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E5953]">Skills Fit</span>
            <span className="font-bold text-[#2B2B2B]">{breakdown.skillsScore}/50</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE3D5]">
            <div className={`h-full rounded-full ${barColors}`} style={{ width: `${(breakdown.skillsScore / 50) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E5953]">Experience</span>
            <span className="font-bold text-[#2B2B2B]">{breakdown.experienceScore}/30</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE3D5]">
            <div className="h-full rounded-full bg-[#2B2B2B]" style={{ width: `${(breakdown.experienceScore / 30) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E5953]">Domain Alignment</span>
            <span className="font-bold text-[#2B2B2B]">{breakdown.contextScore}/20</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE3D5]">
            <div className="h-full rounded-full bg-[#5E5953]" style={{ width: `${(breakdown.contextScore / 20) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Experience Tenure Comparison */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#5E5953]">
          <Briefcase size={14} className="text-[#2B2B2B]" />
          <span>Experience depth:</span>
          <strong className="font-bold text-[#2B2B2B]">{candidateYears} yrs candidate</strong>
        </div>
        <div className="text-[#5E5953]">
          Requirement: <span className="font-bold text-[#2B2B2B]">{requiredExperienceYears ? `${requiredExperienceYears}+ yrs` : 'Entry / Flexible'}</span>
        </div>
      </div>

      {/* Skills Comparison Pill Tags */}
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#137333]">
            <CheckCircle2 size={13} />
            <span>Matching Requirements ({matchingSkills.length})</span>
          </div>
          {matchingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-[#CEEAD6] bg-[#E6F4EA] px-2.5 py-1 text-xs font-semibold text-[#137333]">
                  <CheckCircle2 size={11} className="text-[#137333]" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7A746D] italic">No listed skill overlap found yet.</p>
          )}
        </div>

        {missingSkills.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7A746D]">
              <TrendingUp size={13} className="text-[#2B2B2B]" />
              <span>Target Skills to Explore ({missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-lg border border-[#D8D1C7] bg-[#F3EDE2] px-2.5 py-1 text-xs font-semibold text-[#2B2B2B]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transparent Non-Gatekeeping Note */}
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] p-2.5 text-[11px] text-[#5E5953]">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#2B2B2B]" />
        <span>
          <strong className="text-[#2B2B2B]">AvantHire Fair Match Guarantee:</strong> Scores are purely informational indicators designed to assist recruiters and guide candidates. Low scores are never automatically disqualified or rejected.
        </span>
      </div>
    </div>
  );
}
