/**
 * Algorithmic Candidate Matching Service
 * Quantifies candidate alignment against job descriptions based on:
 * 1. Skills intersection (50% weight)
 * 2. Experience depth & tenure (30% weight)
 * 3. Domain & context relevance (20% weight)
 * Produces explainable reasoning without auto-rejecting or gatekeeping candidates.
 */

const normalize = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9+#.\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const unique = (values) => [...new Set((values || []).map(normalize).filter(Boolean))];

/**
 * Flexible skill matching supporting direct, substring, and tokenized comparison
 */
const skillMatches = (candidateSkill, requirement) => {
  const candidate = normalize(candidateSkill);
  const required = normalize(requirement);
  if (!candidate || !required) return false;

  if (candidate === required) return true;
  if (candidate.includes(required) || required.includes(candidate)) return true;

  // Compare multi-word tokens (e.g. "React JS" matches "React")
  const candidateTokens = candidate.split(' ').filter(t => t.length > 1);
  const requiredTokens = required.split(' ').filter(t => t.length > 1);

  return requiredTokens.some(rt => candidateTokens.includes(rt));
};

/**
 * Parses diverse date formats (YYYY:MM, YYYYMM, YYYY-MM, YYYY) into a Date object
 */
function parseExperienceDate(val, isEnd = false) {
  if (!val) return isEnd ? new Date() : new Date();

  const digits = String(val).replace(/\D/g, '');
  if (digits.length >= 6) {
    const year = Number(digits.slice(0, 4));
    const month = Math.max(0, Math.min(11, Number(digits.slice(4, 6)) - 1));
    return new Date(year, month, 1);
  }

  if (digits.length === 4) {
    const year = Number(digits);
    return new Date(year, isEnd ? 11 : 0, 1);
  }

  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Calculates total cumulative professional experience in years
 */
const experienceYears = (profile) => {
  if (!profile || !Array.isArray(profile.experiences)) return 0;

  return profile.experiences.reduce((total, experience) => {
    if (!experience) return total;

    const startDate = parseExperienceDate(experience.startDate, false);
    const endDate = experience.current ? new Date() : parseExperienceDate(experience.endDate, true);

    const diffMs = endDate.getTime() - startDate.getTime();
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);

    return total + (Number.isFinite(years) && years > 0 ? years : 0);
  }, 0);
};

/**
 * Extracts requested years of experience from job title, description, and requirements
 */
const requiredExperienceYears = (job) => {
  if (!job) return 0;

  const combined = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();

  // Pattern: "3+ years", "3-5 years", "min 2 years", "at least 4 yrs"
  const match = combined.match(/(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)/);
  if (match) {
    return Number(match[1]);
  }

  // Seniority baseline heuristics if numerical years not specified
  if (/\b(senior|sr\.|lead|principal|architect|staff)\b/i.test(job.title)) return 5;
  if (/\b(mid|intermediate)\b/i.test(job.title)) return 2;
  if (/\b(junior|jr\.|associate|entry|intern)\b/i.test(job.title)) return 0;

  return 1;
};

/**
 * Main candidate-to-job matching calculation
 * Returns quantified 0-100% score and explainable breakdown
 */
function calculateMatch(job, profile) {
  if (!job || !profile) {
    return {
      matchScore: 0,
      matchingSkills: [],
      missingSkills: job?.requirements || [],
      recommendationReason: 'Profile or job details unavailable for comparison.',
      breakdown: { skillsScore: 0, experienceScore: 0, contextScore: 0, totalWeight: 100 },
      candidateYears: 0,
      requiredExperienceYears: 0
    };
  }

  const rawRequirements = job.requirements || [];
  const requirements = unique(rawRequirements);

  // Collect candidate skill signals from skills array, headline, summary, and experience details
  const candidateSkills = unique([
    ...(profile.skills || []),
    profile.headline,
    profile.summary,
    ...(profile.experiences || []).map(exp => `${exp.title || ''} ${exp.company || ''} ${exp.description || ''}`),
    ...(profile.projects || []).map(p => `${p.name || ''} ${(p.technologies || []).join(' ')}`)
  ]);

  // Determine matching and missing requirements
  const matchingSkills = rawRequirements.filter(req =>
    candidateSkills.some(candSkill => skillMatches(candSkill, req))
  );

  const missingSkills = rawRequirements.filter(req => !matchingSkills.includes(req));

  // 1. Skill Match Score (Max 50 points)
  let skillsScore = 25;
  if (rawRequirements.length > 0) {
    skillsScore = Math.round((matchingSkills.length / rawRequirements.length) * 50);
  } else {
    // If no explicit requirements are listed on the job, calculate overlap with job description
    const desc = normalize(job.description || '');
    const matchedFromDesc = candidateSkills.filter(s => s.length > 2 && desc.includes(s));
    skillsScore = Math.min(50, Math.max(25, matchedFromDesc.length * 8));
  }

  // 2. Experience Match Score (Max 30 points)
  const candidateYears = Number(experienceYears(profile).toFixed(1));
  const requiredYears = requiredExperienceYears(job);

  let experienceScore = 15;
  if (requiredYears === 0) {
    experienceScore = candidateYears > 0 ? 30 : 20;
  } else {
    const ratio = candidateYears / requiredYears;
    experienceScore = Math.min(30, Math.round(ratio * 30));
  }

  // 3. Domain & Context Relevance Score (Max 20 points)
  const contextText = normalize([
    profile.headline,
    profile.summary,
    ...(profile.interests || []),
    ...(profile.preferredJobTitles || []),
    ...(profile.education || []).map(e => `${e.degree || ''} ${e.fieldOfStudy || ''}`)
  ].join(' '));

  let contextScore = 10;
  const deptNorm = normalize(job.department);
  const titleNorm = normalize(job.title);

  if (deptNorm && contextText.includes(deptNorm)) contextScore += 5;
  if (titleNorm && contextText.includes(titleNorm)) contextScore += 5;
  contextScore = Math.min(20, contextScore);

  // Total Quantified Match Score (0 - 100%)
  const matchScore = Math.min(100, Math.max(0, skillsScore + experienceScore + contextScore));

  // Structured, explainable recommendation text
  const reasonSentences = [];

  if (rawRequirements.length > 0) {
    if (matchingSkills.length === rawRequirements.length) {
      reasonSentences.push(`Matches all ${rawRequirements.length} required skills (${matchingSkills.slice(0, 4).join(', ')})`);
    } else if (matchingSkills.length > 0) {
      reasonSentences.push(`Matches ${matchingSkills.length} of ${rawRequirements.length} required skills (${matchingSkills.slice(0, 3).join(', ')})`);
    } else {
      reasonSentences.push(`Candidate has not yet listed direct matches for ${rawRequirements.length} specific requirements`);
    }
  } else {
    reasonSentences.push('General alignment with role requirements');
  }

  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) {
      reasonSentences.push(`${candidateYears} yrs experience meets the requested ${requiredYears}+ yrs depth`);
    } else {
      reasonSentences.push(`${candidateYears} yrs experience recorded against ${requiredYears}+ yrs requested`);
    }
  } else {
    reasonSentences.push(`${candidateYears} yrs cumulative experience`);
  }

  if (missingSkills.length > 0) {
    reasonSentences.push(`${missingSkills.length} potential skill gaps (${missingSkills.slice(0, 3).join(', ')}) may benefit from interview exploration`);
  } else {
    reasonSentences.push('Strong overall qualification fit');
  }

  return {
    matchScore,
    matchingSkills,
    missingSkills,
    recommendationReason: reasonSentences.join('. ') + '.',
    breakdown: {
      skillsScore,
      experienceScore,
      contextScore,
      totalWeight: 100
    },
    candidateYears,
    requiredExperienceYears: requiredYears
  };
}

module.exports = {
  calculateMatch,
  experienceYears,
  requiredExperienceYears
};
