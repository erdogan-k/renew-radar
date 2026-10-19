import { BillingInterval, DateFormatPreference } from '../types/subscription';

/**
 * RenewRadar uses strict calendar date strings ("YYYY-MM-DD") for all subscription dates
 * (startDate, nextRenewalDate, trialEndDate, plannedCancellationDate).
 *
 * All calendar arithmetic uses UTC noon or pure integer (year, month, day) math
 * so local timezones or DST transitions never shift a date by ±1 day.
 */

export interface CalendarDateParts {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
}

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  const daysPerMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysPerMonth[month - 1];
}

export function parseCalendarDate(dateStr: string): CalendarDateParts | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = DATE_REGEX.exec(dateStr.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;

  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

export function isValidCalendarDate(dateStr: string): boolean {
  return parseCalendarDate(dateStr) !== null;
}

export function formatPartsToISO({ year, month, day }: CalendarDateParts): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's local calendar date in YYYY-MM-DD format without UTC shift.
 */
export function getTodayCalendarDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return formatPartsToISO({ year, month, day });
}

/**
 * Converts a valid YYYY-MM-DD string to an integer day number (UTC epoch days)
 * for exact, timezone-free day difference calculations.
 */
export function toEpochDayNumber(dateStr: string): number {
  const parts = parseCalendarDate(dateStr);
  if (!parts) {
    throw new Error(`Invalid calendar date: "${dateStr}"`);
  }
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day);
  return Math.round(utcMs / 86_400_000);
}

/**
 * Returns the exact number of calendar days from `referenceDateStr` to `targetDateStr`.
 * - 0 means due today
 * - Positive means in the future (e.g., +3 means in 3 days)
 * - Negative means overdue (e.g., -2 means 2 days ago)
 */
export function getDaysRemaining(
  targetDateStr: string,
  referenceDateStr: string = getTodayCalendarDate()
): number {
  return toEpochDayNumber(targetDateStr) - toEpochDayNumber(referenceDateStr);
}

/**
 * Adds a specified number of calendar days to a YYYY-MM-DD string.
 */
export function addCalendarDays(dateStr: string, daysToAdd: number): string {
  const parts = parseCalendarDate(dateStr);
  if (!parts) {
    throw new Error(`Invalid calendar date: "${dateStr}"`);
  }
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Math.trunc(daysToAdd)));
  return formatPartsToISO({
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  });
}

/**
 * Adds calendar months with deterministic month-end clamping.
 * Rule:
 * - If `anchorDay` is provided (or defaults to `parts.day`), the target month uses
 *   `Math.min(targetAnchorDay, getDaysInMonth(targetYear, targetMonth))`.
 * - For example, adding 1 month to 2026-01-31 yields 2026-02-28 (or 2024-02-29 in a leap year).
 * - Adding 1 year (12 months) to 2024-02-29 yields 2025-02-28.
 */
export function addCalendarMonths(
  dateStr: string,
  monthsToAdd: number,
  anchorDay?: number
): string {
  const parts = parseCalendarDate(dateStr);
  if (!parts) {
    throw new Error(`Invalid calendar date: "${dateStr}"`);
  }

  const totalMonths = (parts.year * 12 + (parts.month - 1)) + Math.trunc(monthsToAdd);
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;

  const desiredDay = anchorDay ?? parts.day;
  const clampedDay = Math.min(desiredDay, getDaysInMonth(targetYear, targetMonth));

  return formatPartsToISO({
    year: targetYear,
    month: targetMonth,
    day: clampedDay,
  });
}

/**
 * Calculates the next renewal date after a single billing cycle from `currentRenewalDate`.
 *
 * Documented month-end rule:
 * - If `anchorDate` (such as `startDate`) is provided and its day-of-month was a month-end
 *   date (e.g., 31st) that got clamped in February (28th), passing `anchorDay` preserves
 *   the original billing day when possible; otherwise it clamps to the target month's last day.
 */
export function calculateNextBillingDate(
  currentRenewalDate: string,
  interval: BillingInterval,
  customIntervalDays?: number,
  anchorDay?: number
): string {
  const parts = parseCalendarDate(currentRenewalDate);
  if (!parts) {
    throw new Error(`Invalid renewal date: "${currentRenewalDate}"`);
  }

  switch (interval) {
    case 'weekly':
      return addCalendarDays(currentRenewalDate, 7);
    case 'monthly':
      return addCalendarMonths(currentRenewalDate, 1, anchorDay);
    case 'every_3_months':
      return addCalendarMonths(currentRenewalDate, 3, anchorDay);
    case 'every_6_months':
      return addCalendarMonths(currentRenewalDate, 6, anchorDay);
    case 'yearly':
      return addCalendarMonths(currentRenewalDate, 12, anchorDay);
    case 'custom_days': {
      const days = customIntervalDays && customIntervalDays > 0 ? Math.trunc(customIntervalDays) : 30;
      return addCalendarDays(currentRenewalDate, days);
    }
  }
}

/**
 * Generates all renewal occurrences for a subscription within a given date window
 * [windowStartStr, windowEndStr] (inclusive), starting from the subscription's stored
 * `nextRenewalDate` and stepping forward deterministically.
 */
export function getRenewalOccurrencesInRange(
  nextRenewalDate: string,
  interval: BillingInterval,
  windowStartStr: string,
  windowEndStr: string,
  customIntervalDays?: number,
  plannedCancellationDate?: string
): string[] {
  if (!isValidCalendarDate(nextRenewalDate)) return [];
  if (!isValidCalendarDate(windowStartStr) || !isValidCalendarDate(windowEndStr)) return [];

  const startEpoch = toEpochDayNumber(windowStartStr);
  const endEpoch = toEpochDayNumber(windowEndStr);
  if (endEpoch < startEpoch) return [];

  const cancelEpoch =
    plannedCancellationDate && isValidCalendarDate(plannedCancellationDate)
      ? toEpochDayNumber(plannedCancellationDate)
      : null;

  const initialParts = parseCalendarDate(nextRenewalDate)!;
  const anchorDay = initialParts.day;

  const occurrences: string[] = [];
  let cursor = nextRenewalDate;
  let safetyCounter = 0;

  while (safetyCounter < 1000) {
    safetyCounter++;
    const cursorEpoch = toEpochDayNumber(cursor);

    if (cursorEpoch > endEpoch) {
      break;
    }

    if (cancelEpoch !== null && cursorEpoch >= cancelEpoch) {
      // Subscription is planned to be cancelled before or on this renewal date
      break;
    }

    if (cursorEpoch >= startEpoch) {
      occurrences.push(cursor);
    }

    const nextCursor = calculateNextBillingDate(cursor, interval, customIntervalDays, anchorDay);
    if (toEpochDayNumber(nextCursor) <= cursorEpoch) {
      break;
    }
    cursor = nextCursor;
  }

  return occurrences;
}

/**
 * Formats a YYYY-MM-DD string according to the user's preferred date format.
 */
export function formatDisplayDate(
  dateStr: string | undefined,
  format: DateFormatPreference = 'YYYY-MM-DD'
): string {
  if (!dateStr) return '—';
  const parts = parseCalendarDate(dateStr);
  if (!parts) return dateStr;

  const y = String(parts.year).padStart(4, '0');
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');

  switch (format) {
    case 'DD.MM.YYYY':
      return `${d}.${m}.${y}`;
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`;
    case 'YYYY-MM-DD':
    default:
      return `${y}-${m}-${d}`;
  }
}

/**
 * Returns the day of the week (0 = Sunday, 6 = Saturday) for a calendar date without local TZ shift.
 */
export function getDayOfWeek(dateStr: string): number {
  const parts = parseCalendarDate(dateStr);
  if (!parts) return 0;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}
