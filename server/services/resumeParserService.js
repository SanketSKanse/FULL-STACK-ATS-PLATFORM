const { PDFParse } = require('pdf-parse');

// Comprehensive dictionary of common technical and professional skills
const SKILL_KEYWORDS = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Solidity', 'SQL', 'HTML', 'HTML5', 'CSS', 'CSS3',
  'Sass', 'SCSS', 'Shell', 'Bash',

  // Frontend
  'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte',
  'Tailwind CSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux', 'Zustand', 'MobX',
  'Vite', 'Webpack', 'Framer Motion', 'Responsive Design', 'Webflow',

  // Backend & APIs
  'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'FastAPI', 'Flask', 'Spring Boot',
  'GraphQL', 'REST', 'RESTful APIs', 'Microservices', 'WebSockets', 'gRPC',

  // Databases & ORMs
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'DynamoDB', 'Firebase', 'Firestore',
  'Supabase', 'Prisma', 'Mongoose', 'TypeORM', 'Cassandra', 'Elasticsearch',

  // Cloud & DevOps
  'AWS', 'Amazon Web Services', 'GCP', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
  'CI/CD', 'GitHub Actions', 'Git', 'GitHub', 'GitLab', 'Jenkins', 'Terraform', 'Linux',
  'Nginx', 'Serverless',

  // Blockchain / Web3
  'Hardhat', 'Ethers.js', 'Web3.js', 'Smart Contracts', 'IPFS', 'Truffle',

  // AI & Data
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Pandas', 'NumPy',
  'Scikit-learn', 'NLP', 'Computer Vision', 'Generative AI', 'LLM', 'LangChain',

  // Core Competencies & Testing
  'Data Structures', 'Algorithms', 'System Design', 'Agile', 'Scrum', 'Jest', 'Mocha',
  'Cypress', 'Unit Testing', 'Object-Oriented Programming', 'OOP'
];

/**
 * Normalizes text for comparison and search
 */
function cleanText(text) {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g, '')
    .trim();
}

/**
 * Extracts candidate contact information (email, phone, location, links)
 */
function extractContactInfo(lines, fullText) {
  const contact = {
    email: '',
    phone: '',
    location: '',
    links: { github: '', linkedin: '', website: '' }
  };

  // 1. Email extraction
  const emailMatch = fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    contact.email = emailMatch[0].toLowerCase();
  }

  // 2. Phone extraction (handles +91, dashes, spaces, brackets, 10-12 digits)
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}/);
  if (phoneMatch) {
    const rawDigits = phoneMatch[0].replace(/\D/g, '');
    contact.phone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
  }

  // 3. Links extraction
  const githubMatch = fullText.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch) {
    contact.links.github = `https://${githubMatch[0]}`;
  }

  const linkedinMatch = fullText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    contact.links.linkedin = `https://${linkedinMatch[0]}`;
  }

  // 4. Location extraction: look for common cities or patterns
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    const match = line.match(/(Navi Mumbai|Mumbai|Pune|Bengaluru|Bangalore|Delhi|Hyderabad|Chennai|San Francisco|New York|London|Remote(?:,\s*[A-Za-z]+)?)/i);
    if (match) {
      contact.location = match[0].trim();
      break;
    }
  }

  return contact;
}

/**
 * Extracts candidate name and headline from the top header lines
 */
function extractNameAndHeadline(lines) {
  let name = '';
  let headline = '';

  const cleanLines = lines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('Page ') && !/^curriculum vitae|resume$/i.test(line));

  for (let i = 0; i < Math.min(cleanLines.length, 8); i++) {
    let line = cleanLines[i];

    // Check if line 1 or early line contains name before symbols like ƒ, •, #, |, phone, or email
    if (!name) {
      let candidateSegment = line;
      // Strip everything after special delimiter symbols or phone/email patterns
      const splitParts = candidateSegment.split(/[ƒ•#§ï|\u0080-\u009F\u00A0-\u00FF]/);
      if (splitParts.length > 0) {
        candidateSegment = splitParts[0].trim();
      }
      candidateSegment = candidateSegment.replace(/[^a-zA-Z\s.-]+$/g, '').trim();

      // Strip trailing phone numbers like +91-8591911072 or 10 digit numbers
      candidateSegment = candidateSegment.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '').trim();

      // Ensure it's not a label or role header
      if (
        candidateSegment.length >= 2 &&
        candidateSegment.length <= 40 &&
        !candidateSegment.includes('@') &&
        !candidateSegment.includes('http') &&
        !/^(education|projects|experience|skills|roll no|summary)/i.test(candidateSegment) &&
        !/college|university|institute|bachelor|master|engineering/i.test(candidateSegment)
      ) {
        name = candidateSegment.replace(/[^a-zA-Z\s.-]+$/g, '').trim();
        continue;
      }
    }

    // Headline detection
    if (!headline && line !== name) {
      if (
        /bachelor|master|engineer|developer|architect|designer|manager|student|intern|analyst|scientist|full-stack/i.test(line) &&
        !/college|university|institute/i.test(line) &&
        !line.includes('@') &&
        !line.includes('http')
      ) {
        // Strip delimiter symbols
        const cleanHeadline = line.split(/[ƒ•#§ï|]/)[0].trim();
        if (cleanHeadline.length >= 3 && cleanHeadline.length <= 60) {
          headline = cleanHeadline;
        }
      }
    }
  }

  return { name, headline };
}

/**
 * Extracts skills by scanning both the entire text and specific "Skills" sections
 */
function extractSkills(fullText, lines) {
  const matchedSkills = new Set();

  // 1. Direct dictionary lookup with boundary safety
  for (const skill of SKILL_KEYWORDS) {
    const escaped = skill.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
    if (regex.test(fullText)) {
      matchedSkills.add(skill);
    }
  }

  // 2. Scan dedicated Skills sections
  let inSkillsSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(technical skills|skills|technologies|core competencies|technical skills and interests)$/i.test(line)) {
      inSkillsSection = true;
      continue;
    }

    if (inSkillsSection) {
      if (/^(experience|education|projects|certifications|achievements|summary|work experience|position of responsibility)$/i.test(line)) {
        inSkillsSection = false;
        continue;
      }

      // Handle lines like "Languages: C, C++, JavaScript, HTML, CSS"
      const content = line.includes(':') ? line.split(':')[1] : line;
      const parts = content.split(/[,|•·;/\n]/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.length >= 2 && part.length <= 30 && !part.includes(':')) {
          matchedSkills.add(part);
        }
      }
    }
  }

  return Array.from(matchedSkills).slice(0, 35);
}

/**
 * Extracts education records from the resume
 */
function extractEducation(lines, fullText) {
  const education = [];
  let inEduSection = false;
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(education|academic background|qualifications)$/i.test(line)) {
      inEduSection = true;
      continue;
    }

    if (inEduSection) {
      if (/^(experience|projects|skills|certifications|achievements|work experience|position of responsibility|technical skills)/i.test(line)) {
        inEduSection = false;
        if (currentEntry && (currentEntry.degree || currentEntry.institution)) {
          education.push(currentEntry);
          currentEntry = null;
        }
        break;
      }

      if (!line) continue;

      const degreeMatch = line.match(/(Bachelor|Master|B\.E|B\.Tech|B\.S|M\.S|M\.Tech|Ph\.D|Diploma|Associate|High School)/i);
      const yearMatch = line.match(/\b(20\d{2})\s*(?:-|–|to)\s*(20\d{2}|\d{2}|Present)\b/i) || line.match(/\b(20\d{2})\b/);

      if (degreeMatch) {
        if (currentEntry && (currentEntry.degree || currentEntry.institution)) {
          education.push(currentEntry);
        }

        let cleanDegree = line.replace(/^[•–-]\s*/, '').trim();
        // Remove trailing year interval from degree title
        cleanDegree = cleanDegree.replace(/\s*\b20\d{2}\s*(?:-|–|to)\s*(?:20\d{2}|\d{2}|Present)\b/i, '').trim();

        currentEntry = {
          degree: cleanDegree,
          institution: '',
          fieldOfStudy: '',
          startYear: '',
          endYear: '',
          current: /present/i.test(line)
        };

        if (yearMatch) {
          currentEntry.startYear = yearMatch[1] || '';
          let end = yearMatch[2] || '';
          if (end.length === 2 && currentEntry.startYear.length === 4) {
            end = currentEntry.startYear.slice(0, 2) + end;
          }
          currentEntry.endYear = end === 'Present' ? '' : end;
          currentEntry.current = /present/i.test(end);
        }

        const fieldMatch = cleanDegree.match(/in\s+([A-Za-z\s]+?)(?:\s+20|\s*\(|$)/i);
        if (fieldMatch) {
          currentEntry.fieldOfStudy = fieldMatch[1].trim();
        }
        continue;
      }

      if (currentEntry) {
        if (!currentEntry.institution && /(college|university|institute|school|academy)/i.test(line)) {
          currentEntry.institution = line.replace(/^[•–-]\s*/, '').trim();
        } else if (!currentEntry.startYear && yearMatch) {
          currentEntry.startYear = yearMatch[1] || '';
          let end = yearMatch[2] || '';
          if (end.length === 2 && currentEntry.startYear.length === 4) {
            end = currentEntry.startYear.slice(0, 2) + end;
          }
          currentEntry.endYear = end === 'Present' ? '' : end;
          currentEntry.current = /present/i.test(end);
        }
      }
    }
  }

  if (currentEntry && (currentEntry.degree || currentEntry.institution)) {
    education.push(currentEntry);
  }

  // Deduplicate entries by degree + institution
  const uniqueEdu = [];
  const seenEdu = new Set();
  for (const item of education) {
    const key = `${item.degree}-${item.institution}`.toLowerCase();
    if (!seenEdu.has(key)) {
      seenEdu.add(key);
      uniqueEdu.push(item);
    }
  }

  return uniqueEdu;
}

/**
 * Helper to convert date strings to YYYY:MM
 */
function parseDateToMonth(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const monthYearMatch = clean.match(/([a-zA-Z]{3,9})\s+(\d{4})/i);
  if (monthYearMatch) {
    const m = months[monthYearMatch[1].slice(0, 3).toLowerCase()] || '01';
    return `${monthYearMatch[2]}:${m}`;
  }

  const yearOnly = clean.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearOnly) {
    return `${yearOnly[1]}:01`;
  }

  return '';
}

/**
 * Extracts experiences and projects from the resume
 */
function extractExperience(lines, fullText) {
  const experiences = [];
  let inSection = false;
  let currentExp = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(experience|work experience|professional experience|projects|position of responsibility|employment history)$/i.test(line)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      if (/^(education|academic background|technical skills|skills|certifications|achievements)$/i.test(line)) {
        if (currentExp && (currentExp.title || currentExp.company)) {
          experiences.push(currentExp);
          currentExp = null;
        }
        // If it's technical skills or education, close section
        if (/^(education|academic background|technical skills|skills)$/i.test(line)) {
          inSection = false;
          break;
        }
      }

      if (!line) continue;

      const isBullet = /^[•–\-\*]/.test(line);
      const hasBulletChar = line.startsWith('•');

      // Check for bullet header like "•BountyBoard | Decentralized Escrow Platform" or "•Technical Team Member..."
      if (hasBulletChar || (!isBullet && /(developer|engineer|intern|lead|member|platform|system|project)/i.test(line))) {
        if (currentExp && (currentExp.title || currentExp.company)) {
          experiences.push(currentExp);
        }

        const rawLine = line.replace(/^[•–\-\*]\s*/, '').trim();
        const dateMatch = rawLine.match(/([a-zA-Z]{3,9}\s+\d{4}|\d{4})\s*(?:-|–|to)\s*([a-zA-Z]{3,9}\s+\d{4}|\d{4}|Present)/i);

        let title = rawLine;
        let company = '';
        let startDate = '2024:01';
        let endDate = '';
        let current = true;

        if (dateMatch) {
          title = rawLine.replace(dateMatch[0], '').trim();
          startDate = parseDateToMonth(dateMatch[1]) || '2024:01';
          if (/present/i.test(dateMatch[2])) {
            current = true;
            endDate = '';
          } else {
            current = false;
            endDate = parseDateToMonth(dateMatch[2]) || '';
          }
        }

        if (title.includes('|')) {
          const parts = title.split('|').map(p => p.trim());
          title = parts[0];
          company = parts[1];
        } else {
          company = 'Project / Venture';
        }

        currentExp = {
          title: title.slice(0, 60),
          company: company.slice(0, 60) || 'Project Experience',
          startDate,
          endDate,
          current,
          location: '',
          description: ''
        };
        continue;
      }

      if (currentExp) {
        if (isBullet || currentExp.description.length < 350) {
          const cleanBullet = line.replace(/^[•–\-\*]\s*/, '').trim();
          currentExp.description = currentExp.description ? `${currentExp.description} ${cleanBullet}` : cleanBullet;
        }
      }
    }
  }

  if (currentExp && (currentExp.title || currentExp.company)) {
    experiences.push(currentExp);
  }

  return experiences.slice(0, 6);
}

/**
 * Main parser entry point: takes a PDF file buffer, extracts raw text,
 * and parses all target resume fields into a clean, normalized structure.
 */
async function parseResumeBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid PDF buffer is required for resume parsing.');
  }

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const rawText = cleanText(result.text || '');
  if (!rawText || rawText.length < 20) {
    throw new Error('Extracted text is empty or could not be read from the provided PDF.');
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const contact = extractContactInfo(lines, rawText);
  const { name, headline } = extractNameAndHeadline(lines);
  const skills = extractSkills(rawText, lines);
  const education = extractEducation(lines, rawText);
  const experiences = extractExperience(lines, rawText);

  // Generate a clean summary
  const summary = `${name || 'Candidate'} is a ${headline || 'software engineering professional'} skilled in ${skills.slice(0, 6).join(', ') || 'modern full-stack technologies'}. Experienced in building robust end-to-end applications and delivering clean, maintainable solutions.`;

  return {
    name: name || 'Candidate',
    email: contact.email || '',
    phone: contact.phone || '',
    location: contact.location || '',
    headline: headline || (skills.length ? `${skills[0]} Developer` : 'Software Professional'),
    summary,
    skills,
    experiences,
    education,
    links: contact.links,
    rawTextLength: rawText.length
  };
}

module.exports = {
  parseResumeBuffer,
  cleanText
};
