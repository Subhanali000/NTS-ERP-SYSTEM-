import {
  format,
  parseISO,
  differenceInDays,
  isToday,
  isYesterday,
  isTomorrow,
  isValid,
} from 'date-fns';

/**
 * Safely converts a string or Date into a valid Date object.
 */
export const toDateObject = (date: string | Date): Date | null => {
  if (!date) return null;

  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }

  return isValid(date) ? date : null;
};

/**
 * Format date as 'MMM dd, yyyy' (e.g., Jan 01, 2025).
 */
export const formatDate = (date: string | Date): string => {
  const validDate = toDateObject(date);
  return validDate ? format(validDate, 'MMM dd, yyyy') : 'Invalid Date';
};

/**
 * Format date and time as 'MMM dd, yyyy HH:mm'.
 */
export const formatDateTime = (date: string | Date): string => {
  const validDate = toDateObject(date);
  return validDate ? format(validDate, 'MMM dd, yyyy HH:mm') : 'Invalid DateTime';
};

/**
 * Format a time string (HH:mm) to 12-hour format with AM/PM.
 */
export const formatTime = (time: string): string => {
  try {
    if (!time || typeof time !== 'string') return 'Invalid Time';

    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return 'Invalid Time';

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch {
    return 'Invalid Time';
  }
};

/**
 * Get a relative label for a given date (e.g., Today, Yesterday, Tomorrow, or formatted).
 */
export const getRelativeDate = (date: string | Date): string => {
  const d = toDateObject(date);
  if (!d) return 'Invalid Date';

  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isTomorrow(d)) return 'Tomorrow';

  return formatDate(d);
};

/**
 * Get number of days remaining until a deadline.
 */
export const getDaysUntilDeadline = (dueDate: string | Date): number => {
  const targetDate = toDateObject(dueDate);
  return targetDate ? differenceInDays(targetDate, new Date()) : NaN;
};

/**
 * Check if a due date has passed.
 */
export const isOverdue = (dueDate: string | Date): boolean => {
  const targetDate = toDateObject(dueDate);
  return targetDate ? differenceInDays(targetDate, new Date()) < 0 : false;
};

/**
 * Combine a time string (HH:mm) with today's date to return a full timestamp.
 */
export const combineTimeWithToday = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) throw new Error('Invalid time format');

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  } catch {
    return 'Invalid Timestamp';
  }
};

/**
 * Get current date in 'yyyy-MM-dd' format.
 */
export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get current time in 'HH:mm' format.
 */
export const getCurrentTime = (): string => {
  return format(new Date(), 'HH:mm');
};
