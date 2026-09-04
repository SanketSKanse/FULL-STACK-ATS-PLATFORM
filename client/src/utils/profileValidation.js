export const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

export const validatePhone = (value) => {
  if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit phone number.';
  return '';
};

export const dateDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

export const formatExperienceDate = (value) => {
  const digits = dateDigits(value);
  return digits.length > 4 ? `${digits.slice(0, 4)}:${digits.slice(4)}` : digits;
};

export const validateExperienceDate = (value, { allowFuture = false } = {}) => {
  const digits = dateDigits(value);
  if (digits.length !== 6) return 'Enter a date as YYYY:MM.';
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4));
  const now = new Date();
  if (year < 1900 || year > now.getFullYear()) return 'Enter a reasonable 4-digit year.';
  if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
  if (!allowFuture && (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1))) return 'Start date cannot be in the future.';
  return '';
};

export const validateExperience = (experience) => {
  const startError = validateExperienceDate(experience.startDate);
  if (startError) return startError;
  if (experience.current) return '';
  const endError = validateExperienceDate(experience.endDate, { allowFuture: true });
  if (endError) return endError;
  if (dateDigits(experience.endDate) < dateDigits(experience.startDate)) return 'End date must be after the start date.';
  return '';
};