import React, { useState } from 'react';
import { Check, Clock, X, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'Applied', label: 'Applied', desc: 'Application received' },
  { id: 'Screening', label: 'Screening', desc: 'Profile & resume evaluation' },
  { id: 'Shortlisted', label: 'Shortlisted', desc: 'Qualified for rounds' },
  { id: 'Interviewing', label: 'Interviewing', desc: 'Interviews & assessments' },
  { id: 'Offered', label: 'Offered', desc: 'Formal offer extended' },
  { id: 'Hired', label: 'Hired', desc: 'Onboarding & joined' },
];

/**
 * Normalizes status names across recruiter & candidate views
 */
function normalizeStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'interview') return 'Interviewing';
  if (s === 'offer') return 'Offered';
  if (s === 'screening') return 'Screening';
  if (s === 'shortlisted' || s === 'shortlist') return 'Shortlisted';
  if (s === 'interviewing') return 'Interviewing';
  if (s === 'offered') return 'Offered';
  if (s === 'hired') return 'Hired';
  if (s === 'rejected') return 'Rejected';
  return 'Applied';
}

/**
 * ApplicationTimeline
 * Progressive multi-stage timeline & audit trail.
 * The active indicator circle advances seamlessly as recruiter updates status.
 */
export default function ApplicationTimeline({ currentStatus = 'Applied', statusHistory = [], compact = false }) {
  const [showFullHistory, setShowFullHistory] = useState(false);

  const normalizedCurrent = normalizeStatus(currentStatus);
  const isRejected = normalizedCurrent === 'Rejected';

  // Find the index of the active stage in standard pipeline
  let activeIndex = PIPELINE_STAGES.findIndex((stage) => stage.id === normalizedCurrent);
  if (activeIndex === -1) {
    activeIndex = isRejected ? 0 : 0;
  }

  // Ensure chronological ordering of status history
  const sortedHistory = Array.isArray(statusHistory) && statusHistory.length > 0
    ? [...statusHistory].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    : [{ status: currentStatus || 'Applied', createdAt: new Date().toISOString() }];

  const latestHistoryIndex = sortedHistory.length - 1;

  return (
    <div className="space-y-6">
      {/* 1. Progressive Milestone Stepper */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Application Progress</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              Current Stage:{' '}
              <span className={`inline-flex items-center gap-1 font-bold ${
                isRejected
                  ? 'text-rose-600'
                  : normalizedCurrent === 'Hired'
                  ? 'text-emerald-600'
                  : 'text-indigo-600'
              }`}>
                {normalizedCurrent}
              </span>
            </div>
          </div>
          {isRejected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700">
              <X size={13} />
              <span>Not Selected</span>
            </span>
          )}
        </div>

        {/* Milestone Steps Bar */}
        <div className="relative pt-2 pb-1">
          <div className="grid grid-cols-6 gap-1">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = !isRejected && idx < activeIndex;
              const isCurrent = !isRejected && idx === activeIndex;
              const isUpcoming = !isRejected && idx > activeIndex;

              return (
                <div key={stage.id} className="relative flex flex-col items-center text-center">
                  {/* Connector Line */}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div
                      className={`absolute top-4 left-[50%] right-[-50%] h-1 z-0 transition-colors duration-300 ${
                        idx < activeIndex && !isRejected
                          ? 'bg-indigo-600'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Stage Circle Indicator */}
                  <div className="relative z-10">
                    {isCompleted ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm ring-4 ring-white transition-all">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    ) : isCurrent ? (
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-4 ring-indigo-100 transition-all animate-pulse">
                        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-xs" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-400 ring-4 ring-white transition-all">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Stage Label & Details */}
                  <div className="mt-2.5 max-w-[85px]">
                    <div
                      className={`text-xs transition-colors ${
                        isCurrent
                          ? 'font-bold text-indigo-700'
                          : isCompleted
                          ? 'font-semibold text-slate-800'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </div>
                    {isCurrent && (
                      <span className="mt-0.5 inline-block rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Chronological Audit Trail & Status Updates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Timeline Activity Log ({sortedHistory.length})
          </div>
          {sortedHistory.length > 2 && (
            <button
              type="button"
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>{showFullHistory ? 'Collapse' : 'View all'}</span>
              {showFullHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div className="relative space-y-4">
          {(showFullHistory ? sortedHistory : sortedHistory.slice(-4)).map((item, idx, arr) => {
            const rawIndex = sortedHistory.indexOf(item);
            const isLatest = rawIndex === latestHistoryIndex;
            const norm = normalizeStatus(item.status);
            const isItemRejected = norm === 'Rejected';

            return (
              <div key={item._id || `${item.status}-${item.createdAt}-${idx}`} className="relative flex gap-3.5">
                {/* Connecting vertical trail */}
                {idx < arr.length - 1 && (
                  <div className="absolute left-[13px] top-6 bottom-[-16px] w-0.5 bg-slate-200" />
                )}

                {/* Event Dot */}
                <div className="relative z-10 flex flex-col items-center pt-0.5">
                  {isLatest ? (
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm ring-4 ${
                      isItemRejected
                        ? 'bg-rose-600 text-white ring-rose-100'
                        : 'bg-indigo-600 text-white ring-indigo-100 animate-pulse'
                    }`}>
                      {isItemRejected ? <X size={14} /> : <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-indigo-600 ring-2 ring-white">
                      <Check size={13} strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                {/* Event Card */}
                <div className={`flex-1 rounded-xl border p-3 transition-colors ${
                  isLatest
                    ? isItemRejected
                      ? 'border-rose-200 bg-rose-50/50'
                      : 'border-indigo-100 bg-indigo-50/40'
                    : 'border-slate-200 bg-slate-50/70'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        isLatest
                          ? isItemRejected ? 'text-rose-700' : 'text-indigo-900'
                          : 'text-slate-800'
                      }`}>
                        {item.status}
                      </span>
                      {isLatest && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isItemRejected
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          Current Status
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock size={12} className="text-slate-400" />
                      <span>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })
                          : 'Date pending'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.note || (
                      item.status === 'Applied'
                        ? 'Candidate submitted application with resume.'
                        : item.status === 'Screening'
                        ? 'Application moved to initial resume and qualifications review.'
                        : item.status === 'Shortlisted'
                        ? 'Candidate passed screening and was shortlisted.'
                        : item.status === 'Interviewing'
                        ? 'Candidate in active interview evaluation stages.'
                        : item.status === 'Offered'
                        ? 'Employment offer extended to the candidate.'
                        : item.status === 'Hired'
                        ? 'Offer finalized and candidate successfully hired!'
                        : item.status === 'Rejected'
                        ? 'Application concluded without selection at this time.'
                        : 'Application status updated.'
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
