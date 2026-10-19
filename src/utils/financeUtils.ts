import {
  BillingInterval,
  CurrencyCode,
  ManualExchangeRate,
  SubscriptionCategory,
  SubscriptionRecord,
  SUPPORTED_CURRENCIES,
} from '../types/subscription';
import {
  addCalendarMonths,
  formatPartsToISO,
  getDaysInMonth,
  getDaysRemaining,
  getRenewalOccurrencesInRange,
  getTodayCalendarDate,
  isValidCalendarDate,
  parseCalendarDate,
} from './dateUtils';

/**
 * Centralized financial calculation module for RenewRadar.
 *
 * Normalization formulas for a subscription with amount A:
 * - Weekly monthly estimate: A * 52 / 12
 * - Monthly estimate: A
 * - Every 3 months: A / 3
 * - Every 6 months: A / 6
 * - Yearly: A / 12
 * - Custom interval of d days: A * 365.2425 / d / 12
 *
 * Annual estimate = monthly estimate * 12
 */

export function roundCurrencyAmount(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMonthlyEstimate(
  amount: number,
  interval: BillingInterval,
  customIntervalDays?: number
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  switch (interval) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'every_3_months':
      return amount / 3;
    case 'every_6_months':
      return amount / 6;
    case 'yearly':
      return amount / 12;
    case 'custom_days': {
      if (!customIntervalDays || customIntervalDays <= 0 || !Number.isFinite(customIntervalDays)) {
        return 0;
      }
      return (amount * 365.2425) / customIntervalDays / 12;
    }
  }
}

export function calculateAnnualEstimate(
  amount: number,
  interval: BillingInterval,
  customIntervalDays?: number
): number {
  return calculateMonthlyEstimate(amount, interval, customIntervalDays) * 12;
}

/**
 * Active recurring subscriptions include both `'active'` and `'planned_cancellation'`.
 * Why: A subscription marked as planned for cancellation is STILL active and billing until
 * the user actually cancels it and marks it as `'cancelled'`.
 * Cancelled and archived records are excluded from active recurring spending.
 */
export function isCountedInActiveRecurring(sub: SubscriptionRecord): boolean {
  return sub.status === 'active' || sub.status === 'planned_cancellation';
}

export interface CurrencyTotals {
  currency: CurrencyCode;
  monthlyEstimate: number;
  annualEstimate: number;
  activeCount: number;
  plannedCancellationCount: number;
  potentialMonthlySavings: number;
  potentialAnnualSavings: number;
  postCancellationMonthlyEstimate: number;
  postCancellationAnnualEstimate: number;
}

/**
 * Calculates strict currency-isolated totals.
 * Never sums TRY, USD, EUR, and GBP together.
 */
export function calculateCurrencyIsolatedTotals(
  subscriptions: SubscriptionRecord[]
): CurrencyTotals[] {
  const byCurrency = new Map<CurrencyCode, CurrencyTotals>();

  for (const currency of SUPPORTED_CURRENCIES) {
    byCurrency.set(currency, {
      currency,
      monthlyEstimate: 0,
      annualEstimate: 0,
      activeCount: 0,
      plannedCancellationCount: 0,
      potentialMonthlySavings: 0,
      potentialAnnualSavings: 0,
      postCancellationMonthlyEstimate: 0,
      postCancellationAnnualEstimate: 0,
    });
  }

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) {
      continue;
    }

    const bucket = byCurrency.get(sub.currency);
    if (!bucket) continue;

    const monthly = calculateMonthlyEstimate(sub.price, sub.billingInterval, sub.customIntervalDays);
    const annual = monthly * 12;

    bucket.monthlyEstimate += monthly;
    bucket.annualEstimate += annual;
    bucket.activeCount += 1;

    if (sub.status === 'planned_cancellation') {
      bucket.plannedCancellationCount += 1;
      bucket.potentialMonthlySavings += monthly;
      bucket.potentialAnnualSavings += annual;
    } else {
      bucket.postCancellationMonthlyEstimate += monthly;
      bucket.postCancellationAnnualEstimate += annual;
    }
  }

  const results: CurrencyTotals[] = [];
  for (const bucket of byCurrency.values()) {
    if (bucket.activeCount > 0 || bucket.plannedCancellationCount > 0) {
      results.push({
        ...bucket,
        monthlyEstimate: roundCurrencyAmount(bucket.monthlyEstimate),
        annualEstimate: roundCurrencyAmount(bucket.annualEstimate),
        potentialMonthlySavings: roundCurrencyAmount(bucket.potentialMonthlySavings),
        potentialAnnualSavings: roundCurrencyAmount(bucket.potentialAnnualSavings),
        postCancellationMonthlyEstimate: roundCurrencyAmount(bucket.postCancellationMonthlyEstimate),
        postCancellationAnnualEstimate: roundCurrencyAmount(bucket.postCancellationAnnualEstimate),
      });
    }
  }

  return results;
}

/**
 * Looks up a user-provided manual exchange rate between `from` and `to`.
 * Supports direct match or inverse match if user entered the reverse pair.
 * Never fabricates rates. Returns null if no valid manual rate exists.
 */
export function findManualExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ManualExchangeRate[]
): { rate: number; updatedAt: string; isInverse: boolean } | null {
  if (from === to) {
    return { rate: 1, updatedAt: '', isInverse: false };
  }
  const direct = rates.find(
    (r) => r.fromCurrency === from && r.toCurrency === to && r.rate > 0 && Number.isFinite(r.rate)
  );
  if (direct) {
    return { rate: direct.rate, updatedAt: direct.updatedAt, isInverse: false };
  }
  const inverse = rates.find(
    (r) => r.fromCurrency === to && r.toCurrency === from && r.rate > 0 && Number.isFinite(r.rate)
  );
  if (inverse) {
    return { rate: 1 / inverse.rate, updatedAt: inverse.updatedAt, isInverse: true };
  }
  return null;
}

/**
 * Converts an amount using only user-entered manual exchange rates.
 * Returns null if conversion is not possible with user-provided rates.
 */
export function convertWithManualRate(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ManualExchangeRate[]
): { convertedAmount: number; rateUsed: number; updatedAt: string } | null {
  const match = findManualExchangeRate(from, to, rates);
  if (!match) return null;
  return {
    convertedAmount: roundCurrencyAmount(amount * match.rate),
    rateUsed: match.rate,
    updatedAt: match.updatedAt,
  };
}

/**
 * Formats a currency amount using `Intl.NumberFormat` with locale-aware formatting.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'en-US'
): string {
  const safeAmount = Number.isFinite(amount) ? roundCurrencyAmount(amount) : 0;
  try {
    return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toFixed(2)} ${currency}`;
  }
}

export interface UpcomingRenewalItem {
  subscription: SubscriptionRecord;
  daysRemaining: number;
  isOverdue: boolean;
  isDueSoon: boolean; // within 7 days
}

/**
 * Filters and sorts active subscriptions by their next renewal date.
 * - `maxDays`:
 *   - `7`, `30`, `90`: includes renewals due within [0, maxDays] days, plus overdue items if `includeOverdue` is true.
 *   - `'all'`: includes all active recurring subscriptions sorted by nearest renewal date.
 */
export function getUpcomingRenewals(
  subscriptions: SubscriptionRecord[],
  maxDays: 7 | 30 | 90 | 'all' = 'all',
  referenceDateStr: string = getTodayCalendarDate(),
  includeOverdue: boolean = true
): UpcomingRenewalItem[] {
  const items: UpcomingRenewalItem[] = [];

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) continue;
    if (!isValidCalendarDate(sub.nextRenewalDate)) continue;

    const daysRemaining = getDaysRemaining(sub.nextRenewalDate, referenceDateStr);
    const isOverdue = daysRemaining < 0;
    const isDueSoon = daysRemaining >= 0 && daysRemaining <= 7;

    if (maxDays !== 'all') {
      if (isOverdue) {
        if (!includeOverdue) continue;
      } else if (daysRemaining > maxDays) {
        continue;
      }
    }

    items.push({
      subscription: sub,
      daysRemaining,
      isOverdue,
      isDueSoon,
    });
  }

  return items.sort((a, b) => {
    if (a.daysRemaining !== b.daysRemaining) {
      return a.daysRemaining - b.daysRemaining;
    }
    return a.subscription.name.localeCompare(b.subscription.name);
  });
}

export interface ExpiringTrialItem {
  subscription: SubscriptionRecord;
  trialEndDate: string;
  daysRemaining: number;
}

/**
 * Finds active subscriptions that have a `trialEndDate` ending within `maxDays` (default 14 days) or today.
 */
export function getExpiringTrials(
  subscriptions: SubscriptionRecord[],
  maxDays: number = 14,
  referenceDateStr: string = getTodayCalendarDate()
): ExpiringTrialItem[] {
  const items: ExpiringTrialItem[] = [];

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) continue;
    if (!sub.trialEndDate || !isValidCalendarDate(sub.trialEndDate)) continue;

    const daysRemaining = getDaysRemaining(sub.trialEndDate, referenceDateStr);
    if (daysRemaining >= 0 && daysRemaining <= maxDays) {
      items.push({
        subscription: sub,
        trialEndDate: sub.trialEndDate,
        daysRemaining,
      });
    }
  }

  return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export interface CategorySpendingBreakdown {
  category: SubscriptionCategory;
  currency: CurrencyCode;
  monthlyAmount: number;
  annualAmount: number;
  subscriptionCount: number;
}

/**
 * Computes spending grouped by category and currency.
 * Never sums different currencies together.
 */
export function calculateSpendingByCategory(
  subscriptions: SubscriptionRecord[],
  filterCurrency?: CurrencyCode
): CategorySpendingBreakdown[] {
  const map = new Map<string, CategorySpendingBreakdown>();

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) continue;
    if (filterCurrency && sub.currency !== filterCurrency) continue;

    const key = `${sub.category}__${sub.currency}`;
    const monthly = calculateMonthlyEstimate(sub.price, sub.billingInterval, sub.customIntervalDays);
    const annual = monthly * 12;

    const existing = map.get(key);
    if (existing) {
      existing.monthlyAmount += monthly;
      existing.annualAmount += annual;
      existing.subscriptionCount += 1;
    } else {
      map.set(key, {
        category: sub.category,
        currency: sub.currency,
        monthlyAmount: monthly,
        annualAmount: annual,
        subscriptionCount: 1,
      });
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      monthlyAmount: roundCurrencyAmount(item.monthlyAmount),
      annualAmount: roundCurrencyAmount(item.annualAmount),
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

export interface MonthlyProjectionPoint {
  monthKey: string; // YYYY-MM
  year: number;
  month: number; // 1-12
  totalsByCurrency: Record<CurrencyCode, number>;
}

/**
 * Deterministic 12-month projected cash-flow schedule based on actual renewal dates
 * and billing intervals starting from the month of `referenceDateStr`.
 *
 * Each currency is tracked in its own series (`totalsByCurrency.USD`, `totalsByCurrency.TRY`, etc.)
 * so different currencies are never summed together.
 */
export function calculateTwelveMonthProjection(
  subscriptions: SubscriptionRecord[],
  referenceDateStr: string = getTodayCalendarDate(),
  excludePlannedCancellationsAfterTargetDate: boolean = false
): MonthlyProjectionPoint[] {
  const refParts = parseCalendarDate(referenceDateStr);
  if (!refParts) return [];

  const firstMonthStart = formatPartsToISO({ year: refParts.year, month: refParts.month, day: 1 });
  const points: MonthlyProjectionPoint[] = [];

  for (let i = 0; i < 12; i++) {
    const monthStartStr = addCalendarMonths(firstMonthStart, i, 1);
    const parts = parseCalendarDate(monthStartStr)!;
    const monthKey = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}`;

    points.push({
      monthKey,
      year: parts.year,
      month: parts.month,
      totalsByCurrency: {
        TRY: 0,
        USD: 0,
        EUR: 0,
        GBP: 0,
      },
    });
  }

  const lastPoint = points[points.length - 1];
  const windowEndStr = formatPartsToISO({
    year: lastPoint.year,
    month: lastPoint.month,
    day: getDaysInMonth(lastPoint.year, lastPoint.month),
  });

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) continue;
    if (!isValidCalendarDate(sub.nextRenewalDate) || sub.price <= 0) continue;

    const cancelCutoff =
      excludePlannedCancellationsAfterTargetDate && sub.status === 'planned_cancellation'
        ? sub.plannedCancellationDate || firstMonthStart
        : undefined;

    const occurrences = getRenewalOccurrencesInRange(
      sub.nextRenewalDate,
      sub.billingInterval,
      firstMonthStart,
      windowEndStr,
      sub.customIntervalDays,
      cancelCutoff
    );

    for (const occDateStr of occurrences) {
      const occMonthKey = occDateStr.slice(0, 7);
      const point = points.find((p) => p.monthKey === occMonthKey);
      if (point) {
        point.totalsByCurrency[sub.currency] = roundCurrencyAmount(
          point.totalsByCurrency[sub.currency] + sub.price
        );
      }
    }
  }

  return points;
}

/**
 * Safely validates and normalizes user-entered URLs.
 * - Rejects `javascript:`, `data:`, `vbscript:` or malformed URLs.
 * - Allows empty string (optional field).
 * - Prepends `https://` if the user entered a bare domain like `netflix.com`.
 */
export function normalizeAndValidateUrl(rawUrl: string | undefined): {
  isValid: boolean;
  normalizedUrl?: string;
} {
  if (!rawUrl || !rawUrl.trim()) {
    return { isValid: true, normalizedUrl: undefined };
  }

  const trimmed = rawUrl.trim();
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return { isValid: false };
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.') || parsed.hostname.startsWith('.') || parsed.hostname.endsWith('.')) {
      return { isValid: false };
    }
    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { isValid: false };
  }
}
