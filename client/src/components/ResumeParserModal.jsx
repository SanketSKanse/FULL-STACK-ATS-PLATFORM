import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X, ArrowRight } from 'lucide-react';

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

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/api/candidates/parse-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Resume Parser</h2>
              <p className="text-xs text-slate-500">Upload your PDF resume to auto-fill your profile details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!parsedResult ? (
          <div className="mt-6 space-y-5">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-white'
              }`}
            >
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft text-indigo-600">
                <Upload size={22} />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click to select PDF or drag & drop'}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to parse` : 'Supports standard PDF resumes up to 10MB'}
              </p>
            </div>

            {/* Parse Trigger Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isParsing}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || isParsing}
                onClick={handleParse}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isParsing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Extracting Profile Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Extract & Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Extraction Results Preview */
          <div className="mt-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">Successfully extracted profile data!</span>
              </div>
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                Upload different file
              </button>
            </div>

            {/* Extracted Details Overview */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Candidate Name</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{parsedResult.name || 'Not detected'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Headline</div>
                <div className="mt-1 text-sm font-semibold text-slate-800 truncate">{parsedResult.headline || 'Not detected'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email & Phone</div>
                <div className="mt-1 text-xs text-slate-700">
                  {parsedResult.email || 'No email'} · {parsedResult.phone || 'No phone'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Location</div>
                <div className="mt-1 text-xs text-slate-700">{parsedResult.location || 'Not specified'}</div>
              </div>
            </div>

            {/* Extracted Skills */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Extracted Skills ({parsedResult.skills?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                {(parsedResult.skills || []).map((skill) => (
                  <span key={skill} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Experience Count & Education Count */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="font-semibold text-slate-800">Experience Items ({parsedResult.experiences?.length || 0})</div>
                <ul className="mt-1.5 space-y-1 text-slate-600">
                  {(parsedResult.experiences || []).slice(0, 3).map((exp, idx) => (
                    <li key={idx} className="truncate">• {exp.title} ({exp.company})</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="font-semibold text-slate-800">Education Details ({parsedResult.education?.length || 0})</div>
                <ul className="mt-1.5 space-y-1 text-slate-600">
                  {(parsedResult.education || []).slice(0, 2).map((edu, idx) => (
                    <li key={idx} className="truncate">• {edu.degree}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <span>Apply Extracted Data to Profile</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
