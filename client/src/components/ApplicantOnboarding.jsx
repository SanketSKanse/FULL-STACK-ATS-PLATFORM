import React, { useState } from 'react';
import api from '../utils/api';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Sparkles, FileText, CheckCircle2, Upload, ExternalLink, Loader2 } from 'lucide-react';
import { formatExperienceDate, normalizePhone, validateExperience, validatePhone } from '../utils/profileValidation';
import ResumeParserModal from './ResumeParserModal';


const steps = ['About you', 'Interests', 'Experience', 'Education', 'Skills & resume'];
const blankExperience = { company: '', title: '', startDate: '', endDate: '', current: false, location: '', description: '' };
const blankEducation = { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', current: false };

export default function ApplicantOnboarding({ user, initialProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [autoFillNotice, setAutoFillNotice] = useState('');
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [experienceErrors, setExperienceErrors] = useState({});
  const [profile, setProfile] = useState({ phone: '', location: '', headline: '', summary: '', interests: [], preferredJobTitles: [], preferredWorkArrangements: [], preferredLocations: [], employmentTypes: [], skills: [], experiences: [], education: [], projects: [], certifications: [], achievements: [], resumeUrl: '', resumeFileName: '', ...(initialProfile || {}) });

  const update = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const toggle = (field, value) => update(field, profile[field].includes(value) ? profile[field].filter((item) => item !== value) : [...profile[field], value]);
  const addText = (field, value) => { const next = value.trim(); if (next && !profile[field].includes(next)) update(field, [...profile[field], next]); };
  const updateItem = (field, index, key, value) => update(field, profile[field].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));

  const handleApplyParsedData = (parsedData, file) => {
    setProfile((prev) => {
      const mergedSkills = [...new Set([...(prev.skills || []), ...(parsedData.skills || [])])];
      return {
        ...prev,
        phone: parsedData.phone || prev.phone,
        location: parsedData.location || prev.location,
        headline: parsedData.headline || prev.headline,
        summary: parsedData.summary || prev.summary,
        skills: mergedSkills,
        experiences: parsedData.experiences && parsedData.experiences.length > 0 ? parsedData.experiences : prev.experiences,
        education: parsedData.education && parsedData.education.length > 0 ? parsedData.education : prev.education,
        resumeFileName: file?.name || prev.resumeFileName || 'uploaded-resume.pdf',
      };
    });
    setAutoFillNotice(`Successfully auto-filled from "${file?.name || 'Resume'}". Verify and fine-tune your details across the steps below.`);
  };

  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file size must be less than 10MB.');
      return;
    }

    setUploadingResume(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/api/applicant/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      update('resumeUrl', res.data.resumeUrl);
      update('resumeFileName', res.data.resumeFileName);
      setAutoFillNotice(`Resume "${res.data.resumeFileName}" uploaded and attached to your profile.`);
    } catch (err) {
      console.error('Resume upload failed:', err);
      setError(err.response?.data?.error || 'Failed to upload resume file.');
    } finally {
      setUploadingResume(false);
    }
  };

  const save = async () => {
    const phoneError = profile.phone ? validatePhone(profile.phone) : '';
    const nextExperienceErrors = Object.fromEntries(profile.experiences.map((experience, index) => [index, validateExperience(experience)]).filter(([, value]) => value));
    setPhoneTouched(true);
    setExperienceErrors(nextExperienceErrors);
    if (phoneError || Object.keys(nextExperienceErrors).length) {
      setError(phoneError || 'Fix the highlighted experience dates before saving.');
      return;
    }
    setSaving(true); setError('');
    try {
      const response = await api.put('/api/applicant/profile', { ...profile, profileCompleted: true });
      onComplete(response.data.profile);
    } catch (err) { setError(err.response?.data?.error || 'Profile could not be saved.'); } finally { setSaving(false); }
  };
  const canContinue = step !== 0 || (profile.headline.trim() && profile.location.trim());


  return <div className="app-shell flex min-h-screen items-center justify-center p-4 sm:p-8 bg-[#F3EDE2]"><div className="w-full max-w-4xl rounded-[28px] border border-[#D8D1C7] bg-[#FAF7F2] shadow-xl text-[#2B2B2B]">
    <div className="border-b border-[#D8D1C7] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A746D]">Build your career profile</div>
        <button
          type="button"
          onClick={() => setIsParserOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FAF7F2] border border-[#D8D1C7] px-3.5 py-1.5 text-xs font-bold text-[#2B2B2B] hover:bg-[#ECE4D6] hover:border-[#BDB5A9] transition shadow-xs"
        >
          <Sparkles size={14} className="text-[#2B2B2B]" />
          <span>Auto-fill with Resume</span>
          <span className="rounded-md border border-[#D8D1C7] bg-[#F3EDE2] px-1.5 py-0.5 text-[10px] font-bold text-[#7A746D]">PDF</span>
        </button>
      </div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold tracking-[-0.05em] text-[#2B2B2B]">Tell us what makes you a great hire.</h1><p className="mt-2 text-sm text-[#5E5953]">Hi {user.name}. You can upload your PDF resume to auto-fill or enter details manually.</p></div><div className="text-sm font-bold text-[#7A746D]">Step {step + 1} of {steps.length}</div></div>
      <div className="mt-6 grid grid-cols-5 gap-2">{steps.map((label, index) => <div key={label} className={`h-1.5 rounded-full ${index <= step ? 'bg-[#2B2B2B]' : 'bg-[#D8D1C7]'}`} aria-label={label} />)}</div>
    </div>
    <div className="min-h-[390px] p-6 sm:p-8">
      {error && <div className="mb-5 rounded-xl border border-[#FAD2CF] bg-[#FCE8E6] px-3 py-2 text-sm font-semibold text-[#C5221F]">{error}</div>}
      {autoFillNotice && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-[#CEEAD6] bg-[#E6F4EA] px-4 py-2.5 text-xs font-medium text-[#137333] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#137333] shrink-0" />
            <span>{autoFillNotice}</span>
          </div>
          <button type="button" onClick={() => setAutoFillNotice('')} className="text-[#137333] hover:text-[#0C5424] font-bold ml-2">✕</button>
        </div>
      )}
      {step === 0 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={user.name} disabled /><Field label="Email" value={user.email} disabled /><Field label="Phone number" type="tel" inputMode="numeric" maxLength={10} value={profile.phone} onChange={(value) => update('phone', normalizePhone(value))} onBlur={() => setPhoneTouched(true)} placeholder="9876543210" error={phoneTouched && profile.phone ? validatePhone(profile.phone) : ''} /><Field label="Current location" value={profile.location} onChange={(value) => update('location', value)} placeholder="City, country" required /><div className="sm:col-span-2"><Field label="Professional headline" value={profile.headline} onChange={(value) => update('headline', value)} placeholder="Frontend Developer | React | JavaScript" required /></div><div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-[#2B2B2B]">Professional summary</label><textarea value={profile.summary} onChange={(event) => update('summary', event.target.value)} rows="4" className="w-full rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none focus:border-[#2B2B2B]" placeholder="A short introduction about your experience and goals." /></div></div>}
      {step === 1 && <div className="space-y-6"><ChoiceGroup label="What kind of work are you looking for?" field="interests" values={['Frontend Development', 'Backend Development', 'Full Stack Development', 'Mobile Development', 'UI/UX Design', 'Data Science', 'DevOps', 'Cloud Engineering', 'Cybersecurity', 'Product Management']} profile={profile} toggle={toggle} /><ChoiceGroup label="Preferred work arrangement" field="preferredWorkArrangements" values={['Remote', 'Hybrid', 'On-site']} profile={profile} toggle={toggle} /><ChoiceGroup label="Employment type" field="employmentTypes" values={['Full-time', 'Part-time', 'Internship', 'Contract']} profile={profile} toggle={toggle} /><TagInput label="Preferred job titles" field="preferredJobTitles" profile={profile} addText={addText} placeholder="React Developer" /><TagInput label="Preferred locations" field="preferredLocations" profile={profile} addText={addText} placeholder="Mumbai" /></div>}
      {step === 2 && <RepeatableSection title="Experience" items={profile.experiences} field="experiences" blank={blankExperience} update={update} renderItem={(item, index) => <div className="grid gap-3 sm:grid-cols-2"><Field label="Company" value={item.company} onChange={(value) => updateItem('experiences', index, 'company', value)} /><Field label="Job title" value={item.title} onChange={(value) => updateItem('experiences', index, 'title', value)} /><DateField label="Start date" value={item.startDate} onChange={(value) => updateItem('experiences', index, 'startDate', formatExperienceDate(value))} onBlur={() => setExperienceErrors((current) => ({ ...current, [index]: validateExperience(item) }))} error={experienceErrors[index] && !item.current ? experienceErrors[index] : ''} /><DateField label="End date" value={item.current ? 'Present' : item.endDate} disabled={item.current} onChange={(value) => updateItem('experiences', index, 'endDate', formatExperienceDate(value))} onBlur={() => setExperienceErrors((current) => ({ ...current, [index]: validateExperience(item) }))} error={experienceErrors[index] && !item.current && item.endDate ? experienceErrors[index] : ''} placeholder="YYYYMM" /><label className="flex items-center gap-2 text-sm text-[#5E5953]"><input type="checkbox" checked={item.current} onChange={(event) => { updateItem('experiences', index, 'current', event.target.checked); setExperienceErrors((current) => ({ ...current, [index]: '' })); }} /> Currently working here</label><div className="sm:col-span-2"><Field label="Description" value={item.description} onChange={(value) => updateItem('experiences', index, 'description', value)} /></div></div>} />}
      {step === 3 && <RepeatableSection title="Education" items={profile.education} field="education" blank={blankEducation} update={update} renderItem={(item, index) => <div className="grid gap-3 sm:grid-cols-2"><Field label="College or university" value={item.institution} onChange={(value) => updateItem('education', index, 'institution', value)} /><Field label="Degree" value={item.degree} onChange={(value) => updateItem('education', index, 'degree', value)} /><Field label="Field of study" value={item.fieldOfStudy} onChange={(value) => updateItem('education', index, 'fieldOfStudy', value)} /><Field label="Start year" value={item.startYear} onChange={(value) => updateItem('education', index, 'startYear', value)} /><Field label="End year" value={item.endYear} onChange={(value) => updateItem('education', index, 'endYear', value)} /><label className="flex items-center gap-2 text-sm text-[#5E5953]"><input type="checkbox" checked={item.current} onChange={(event) => updateItem('education', index, 'current', event.target.checked)} /> Currently studying</label></div>} />}
      {step === 4 && <div className="space-y-6"><TagInput label="Skills" field="skills" profile={profile} addText={addText} placeholder="React" /><div className="rounded-2xl border border-[#D8D1C7] bg-[#FFFFFF] p-6 shadow-2xs"><div className="flex items-center justify-between"><div><div className="text-sm font-bold text-[#2B2B2B]">Resume Document (PDF)</div><p className="mt-1 text-sm text-[#5E5953]">Upload your PDF resume. Recruiters can view this directly when reviewing your applications.</p></div>{profile.resumeUrl && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} className="text-emerald-600" /> Uploaded</span>}</div><div className="mt-4 rounded-xl border border-dashed border-[#D8D1C7] bg-[#FAF7F2] p-5">{profile.resumeUrl ? <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 font-bold text-xs">PDF</div><div><div className="text-sm font-semibold text-[#2B2B2B]">{profile.resumeFileName || 'Candidate_Resume.pdf'}</div><div className="text-xs text-[#7A746D]">Attached to your applicant profile</div></div></div><div className="flex items-center gap-2"><a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8D1C7] bg-white px-3.5 py-2 text-xs font-bold text-[#2B2B2B] hover:bg-[#F3EDE2] transition shadow-2xs"><ExternalLink size={13} /><span>View Resume</span></a><label className="inline-flex items-center gap-1.5 rounded-xl bg-[#2B2B2B] px-3.5 py-2 text-xs font-bold text-[#F3EDE2] hover:bg-[#1A1A1A] cursor-pointer transition shadow-2xs"><Upload size={13} /><span>{uploadingResume ? 'Uploading...' : 'Replace File'}</span><input type="file" accept=".pdf" disabled={uploadingResume} onChange={handleResumeFileSelect} className="hidden" /></label></div></div> : <div className="text-center py-4"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAE3D5] text-[#2B2B2B] mb-3">{uploadingResume ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}</div><div className="text-sm font-semibold text-[#2B2B2B]">{uploadingResume ? 'Uploading your resume...' : 'Upload your PDF resume'}</div><p className="mt-1 text-xs text-[#7A746D]">PDF documents up to 10MB</p><label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2B2B2B] px-4 py-2.5 text-xs font-bold text-[#F3EDE2] hover:bg-[#1A1A1A] cursor-pointer transition shadow-xs"><Upload size={14} /><span>Select PDF File</span><input type="file" accept=".pdf" disabled={uploadingResume} onChange={handleResumeFileSelect} className="hidden" /></label></div>}</div></div></div>}

    </div>
    <div className="flex items-center justify-between border-t border-[#D8D1C7] p-6 sm:p-8"><button type="button" disabled={step === 0 || saving} onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-2 rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-4 py-2.5 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F3EDE2] disabled:invisible"><ArrowLeft size={15} /> Back</button>{step < steps.length - 1 ? <button type="button" disabled={!canContinue || saving} onClick={() => setStep((current) => current + 1)} className="inline-flex items-center gap-2 rounded-xl bg-[#2B2B2B] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:bg-[#D8D1C7] disabled:text-[#7A746D]">Continue <ArrowRight size={15} /></button> : <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[#2B2B2B] px-4 py-2.5 text-sm font-semibold text-[#F3EDE2] hover:bg-[#1A1A1A] disabled:bg-[#D8D1C7] disabled:text-[#7A746D]">{saving ? 'Saving...' : 'Complete profile'} <Check size={15} /></button>}</div>
    <ResumeParserModal isOpen={isParserOpen} onClose={() => setIsParserOpen(false)} onApplyParsedData={handleApplyParsedData} />
  </div></div>;
}

function Field({ label, value, onChange, placeholder, disabled, required, error, onBlur, type = 'text', inputMode, maxLength }) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-[#2B2B2B]">{label}{required && <span className="text-red-500"> *</span>}</span><input type={type} inputMode={inputMode} maxLength={maxLength} value={value || ''} onChange={(event) => onChange?.(event.target.value)} onBlur={onBlur} placeholder={placeholder} disabled={disabled} className={`w-full rounded-xl border bg-[#FFFFFF] px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none focus:border-[#2B2B2B] disabled:cursor-not-allowed disabled:bg-[#F3EDE2] disabled:text-[#7A746D] ${error ? 'border-[#FAD2CF] focus:border-[#C5221F]' : 'border-[#D8D1C7] focus:border-[#2B2B2B]'}`} />{error && <span className="mt-1 block text-xs font-semibold text-[#C5221F]">{error}</span>}</label>; }
function DateField({ label, value, onChange, placeholder, disabled, error, onBlur }) { return <Field label={label} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder || 'YYYYMM'} disabled={disabled} error={error} inputMode="numeric" maxLength={7} />; }
function ChoiceGroup({ label, field, values, profile, toggle }) { return <div><div className="mb-2 text-sm font-semibold text-[#2B2B2B]">{label}</div><div className="flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" aria-pressed={profile[field].includes(value)} onClick={() => toggle(field, value)} className={`rounded-full border px-3 py-2 text-sm font-medium transition ${profile[field].includes(value) ? 'border-[#2B2B2B] bg-[#2B2B2B] text-[#F3EDE2] font-semibold shadow-xs' : 'border-[#D8D1C7] bg-[#FFFFFF] text-[#5E5953] hover:border-[#2B2B2B] hover:text-[#2B2B2B]'}`}>{value}</button>)}</div></div>; }
function TagInput({ label, field, profile, addText, placeholder }) { const [value, setValue] = useState(''); return <div><label className="mb-1.5 block text-sm font-semibold text-[#2B2B2B]">{label}</label><div className="flex gap-2"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addText(field, value); setValue(''); } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-3.5 py-2.5 text-sm text-[#2B2B2B] outline-none focus:border-[#2B2B2B]" /><button type="button" onClick={() => { addText(field, value); setValue(''); }} className="inline-flex items-center gap-1 rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-3 py-2 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F3EDE2]"><Plus size={15} /> Add</button></div><div className="mt-2 flex flex-wrap gap-2">{profile[field].map((item) => <span key={item} className="rounded-full border border-[#D8D1C7] bg-[#F3EDE2] px-3 py-1.5 text-xs font-semibold text-[#2B2B2B]">{item}</span>)}</div></div>; }
function RepeatableSection({ title, items, field, blank, update, renderItem }) { return <div><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#2B2B2B]">{title}</h2><p className="mt-1 text-sm text-[#5E5953]">Add as many entries as apply to you.</p></div><button type="button" onClick={() => update(field, [...items, { ...blank }])} className="inline-flex items-center gap-1 rounded-xl border border-[#D8D1C7] bg-[#FFFFFF] px-3 py-2 text-sm font-semibold text-[#2B2B2B] hover:bg-[#F3EDE2]"><Plus size={15} /> Add {title.toLowerCase()}</button></div>{items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#D8D1C7] bg-[#FFFFFF] p-10 text-center text-sm text-[#7A746D]">No {title.toLowerCase()} added yet. You can continue without one.</div> : <div className="space-y-4">{items.map((item, index) => <div key={item._id || index} className="rounded-2xl border border-[#D8D1C7] bg-[#FFFFFF] p-4"><div className="mb-4 flex justify-end"><button type="button" onClick={() => update(field, items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${title.toLowerCase()}`} className="text-[#7A746D] hover:text-[#C5221F]"><Trash2 size={16} /></button></div>{renderItem(item, index)}</div>)}</div>}</div>; }