import React, { useState, useRef } from 'react';
import api from '../utils/api';
import {

  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  MapPin,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';

export default function ResumeParserModal({ isOpen, onClose, onApplyParsedData }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setParsedResult(null);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleParse = async () => {
    if (!file) {
      setError('Please choose a PDF resume to parse.');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/api/candidates/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });


      if (response.data.success && response.data.parsedData) {
        setParsedResult(response.data.parsedData);
      } else {
        throw new Error(response.data.error || 'Failed to extract text from resume.');
      }
    } catch (err) {
      console.error('Resume parse error:', err);
      setError(err.response?.data?.error || err.message || 'Error occurred while analyzing resume.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmApply = () => {
    if (parsedResult && onApplyParsedData) {
      onApplyParsedData(parsedResult, file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2B2B]/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-[28px] border border-[#D8D1C7] bg-[#FAF7F2] p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto text-[#2B2B2B] custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D8D1C7] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#242424] text-[#F3EDE2] shadow-sm">
              <Sparkles size={18} className="text-[#F3EDE2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2B2B2B]">AI Resume Parser</h2>
                <span className="rounded-md border border-[#D8D1C7] bg-[#F3EDE2] px-1.5 py-0.5 text-[10px] font-bold text-[#7A746D]">PDF ONLY</span>
              </div>
              <p className="text-xs text-[#5E5953] mt-0.5">Upload your resume to automatically extract and populate your profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D8D1C7] bg-white text-[#2B2B2B] hover:bg-[#F3EDE2] transition"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#FAD2CF] bg-[#FCE8E6] px-4 py-3 text-xs font-semibold text-[#C5221F]">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!parsedResult ? (
          <div className="mt-5 space-y-5">
            {/* Drag & Drop Upload Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) validateAndSetFile(selected);
              }}
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition shadow-xs overflow-hidden ${isDragging
                    ? 'border-[#242424] bg-[#ECE4D6]'
                    : 'border-[#D8D1C7] bg-[#FFFFFF] hover:border-[#7A746D] hover:bg-[#FAF7F2]'
                  }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D8D1C7] bg-[#F3EDE2] text-[#2B2B2B] shadow-xs">
                  <Upload size={22} />
                </div>
                <div className="mt-3.5 text-sm font-bold text-[#2B2B2B]">
                  Click to select PDF or drag & drop here
                </div>
                <p className="mt-1 text-xs text-[#5E5953]">
                  Standard PDF resumes up to 10 MB supported
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#D8D1C7] bg-[#FAF7F2] px-3 py-1 text-[11px] font-semibold text-[#7A746D]">
                  <span>Fast AI text & section extraction</span>
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#2B2B2B] truncate">{file.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5E5953]">
                        <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                          <CheckCircle2 size={11} /> Ready to parse
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#2B2B2B] hover:bg-[#ECE4D6] transition"
                  >
                    <RefreshCw size={13} />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            )}

            {/* Parse Trigger Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isParsing}
                className="rounded-xl border border-[#D8D1C7] bg-white px-4 py-2.5 text-xs font-semibold text-[#2B2B2B] hover:bg-[#F3EDE2] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || isParsing}
                onClick={handleParse}
                className="btn-modal-primary inline-flex items-center gap-2 rounded-xl bg-[#242424] px-5 py-2.5 text-xs font-bold text-[#F3EDE2] shadow-sm hover:bg-black transition disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#F3EDE2]" />
                    <span>Extracting Profile Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-[#F3EDE2]" />
                    <span>Extract & Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Extraction Results Preview */
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            {/* Status notification banner */}
            <div className="flex items-center justify-between rounded-2xl border border-[#CEEAD6] bg-[#E6F4EA] px-4 py-3 text-xs text-[#137333] shadow-xs overflow-hidden">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#CEEAD6]/60 text-[#137333]">
                  <CheckCircle2 size={15} />
                </div>
                <span className="font-bold">Successfully extracted profile data!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedResult(null);
                }}
                className="text-[11px] font-bold text-[#137333] hover:text-[#0C5424] hover:underline transition"
              >
                Upload different file
              </button>
            </div>

            {/* Extracted Details 2x2 Overview Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7A746D]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                    <User size={13} className="text-[#5E5953]" />
                  </div>
                  <span>Candidate Name</span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-[#2B2B2B]">{parsedResult.name || 'Not detected'}</div>
              </div>

              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7A746D]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                    <Briefcase size={13} className="text-[#5E5953]" />
                  </div>
                  <span>Headline</span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-[#2B2B2B] truncate">{parsedResult.headline || 'Not detected'}</div>
              </div>

              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7A746D]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                    <Mail size={13} className="text-[#5E5953]" />
                  </div>
                  <span>Email & Phone</span>
                </div>
                <div className="mt-2.5 text-xs font-semibold text-[#5E5953]">
                  {parsedResult.email || 'No email'} {parsedResult.phone ? `· ${parsedResult.phone}` : ''}
                </div>
              </div>

              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7A746D]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                    <MapPin size={13} className="text-[#5E5953]" />
                  </div>
                  <span>Location</span>
                </div>
                <div className="mt-2.5 text-xs font-semibold text-[#5E5953]">{parsedResult.location || 'Not specified'}</div>
              </div>
            </div>

            {/* Extracted Skills Section Card */}
            <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#2B2B2B]">Extracted Skills</span>
                  <span className="rounded-full bg-[#F3EDE2] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#5E5953]">
                    {parsedResult.skills?.length || 0}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#7A746D]">Included in profile sync</span>
              </div>
              <div className="max-h-36 overflow-y-auto custom-scrollbar p-1">
                <div className="flex flex-wrap gap-2">
                  {(parsedResult.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-xl border border-[#D8D1C7] bg-[#FAF7F2] px-3 py-1.5 text-xs font-semibold text-[#2B2B2B] shadow-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Extracted Experience & Education Summary Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2 font-bold text-[#2B2B2B]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                      <Briefcase size={13} className="text-[#5E5953]" />
                    </div>
                    <span>Experience Items</span>
                  </div>
                  <span className="rounded-full bg-[#F3EDE2] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#5E5953]">
                    {parsedResult.experiences?.length || 0}
                  </span>
                </div>
                <ul className="space-y-2.5 text-[#5E5953]">
                  {(parsedResult.experiences || []).length > 0 ? (
                    (parsedResult.experiences || []).slice(0, 3).map((exp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2B2B2B] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#2B2B2B] truncate">{exp.title || 'Role'}</div>
                          {exp.company && <div className="text-[11px] text-[#7A746D] truncate">{exp.company}</div>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#7A746D] italic">No experiences detected</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#D8D1C7] bg-white p-4 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2 font-bold text-[#2B2B2B]">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E5DFD5]">
                      <GraduationCap size={13} className="text-[#5E5953]" />
                    </div>
                    <span>Education Details</span>
                  </div>
                  <span className="rounded-full bg-[#F3EDE2] border border-[#D8D1C7] px-2 py-0.5 text-[10px] font-bold text-[#5E5953]">
                    {parsedResult.education?.length || 0}
                  </span>
                </div>
                <ul className="space-y-2.5 text-[#5E5953]">
                  {(parsedResult.education || []).length > 0 ? (
                    (parsedResult.education || []).slice(0, 2).map((edu, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#2B2B2B] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-[#2B2B2B] truncate">{edu.degree || 'Degree'}</div>
                          {edu.institution && <div className="text-[11px] text-[#7A746D] truncate">{edu.institution}</div>}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#7A746D] italic">No education details detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-[#D8D1C7] pt-4">
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8D1C7] bg-white px-4 py-2.5 text-xs font-semibold text-[#2B2B2B] hover:bg-[#F3EDE2] transition"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="btn-modal-primary inline-flex items-center gap-2 rounded-xl bg-[#242424] px-5 py-2.5 text-xs font-bold text-[#F3EDE2] shadow-sm hover:bg-black transition"
              >
                <span>Apply Extracted Data to Profile</span>
                <ArrowRight size={14} className="text-[#F3EDE2]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
