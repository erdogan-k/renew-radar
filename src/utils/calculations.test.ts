import { describe, expect, it } from 'vitest';
import {
  addCalendarDays,
  addCalendarMonths,
  calculateNextBillingDate,
  getDaysInMonth,
  getDaysRemaining,
  getRenewalOccurrencesInRange,
  isLeapYear,
  isValidCalendarDate,
} from './dateUtils';
import {
  calculateAnnualEstimate,
  calculateCurrencyIsolatedTotals,
  calculateMonthlyEstimate,
  calculateSpendingByCategory,
  calculateTwelveMonthProjection,
  convertWithManualRate,
  getExpiringTrials,
  getUpcomingRenewals,
  normalizeAndValidateUrl,
  roundCurrencyAmount,
} from './financeUtils';
import { mergeSubscriptionRecords, validateBackupJson } from './backupUtils';
import { SubscriptionRecord } from '../types/subscription';

const makeSub = (overrides: Partial<SubscriptionRecord>): SubscriptionRecord => ({
  id: 'sub-1',
  name: 'Test Service',
  category: 'software',
  price: 12,
  currency: 'USD',
  billingInterval: 'monthly',
  nextRenewalDate: '2026-10-25',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('Financial Calculations & Normalization', () => {
  it('normalizes weekly, monthly, 3-month, 6-month, and yearly intervals accurately', () => {
    // Weekly: A * 52 / 12
    expect(roundCurrencyAmount(calculateMonthlyEstimate(10, 'weekly'))).toBe(43.33);
    expect(roundCurrencyAmount(calculateAnnualEstimate(10, 'weekly'))).toBe(520);

    // Monthly: A
    expect(calculateMonthlyEstimate(19.99, 'monthly')).toBe(19.99);
    expect(roundCurrencyAmount(calculateAnnualEstimate(19.99, 'monthly'))).toBe(239.88);

    // Every 3 months: A / 3
    expect(calculateMonthlyEstimate(30, 'every_3_months')).toBe(10);
    expect(calculateAnnualEstimate(30, 'every_3_months')).toBe(120);

    // Every 6 months: A / 6
    expect(calculateMonthlyEstimate(60, 'every_6_months')).toBe(10);
    expect(calculateAnnualEstimate(60, 'every_6_months')).toBe(120);

    // Yearly: A / 12
    expect(calculateMonthlyEstimate(120, 'yearly')).toBe(10);
    expect(calculateAnnualEstimate(120, 'yearly')).toBe(120);
  });

  it('normalizes custom interval in days using A * 365.2425 / d / 12', () => {
    // Custom 30 days for $30
    const monthly = calculateMonthlyEstimate(30, 'custom_days', 30);
    const expectedMonthly = (30 * 365.2425) / 30 / 12;
    expect(monthly).toBeCloseTo(expectedMonthly, 6);
    expect(calculateAnnualEstimate(30, 'custom_days', 30)).toBeCloseTo(expectedMonthly * 12, 6);

    // Invalid custom days returns 0
    expect(calculateMonthlyEstimate(30, 'custom_days', 0)).toBe(0);
    expect(calculateMonthlyEstimate(30, 'custom_days', -5)).toBe(0);
  });

  it('handles zero and negative amounts safely', () => {
    expect(calculateMonthlyEstimate(0, 'monthly')).toBe(0);
    expect(calculateMonthlyEstimate(-15, 'monthly')).toBe(0);
  });

  it('keeps currency-specific totals strictly isolated and never sums different currencies', () => {
    const subs: SubscriptionRecord[] = [
      makeSub({ id: '1', price: 20, currency: 'USD', billingInterval: 'monthly' }),
      makeSub({ id: '2', price: 120, currency: 'USD', billingInterval: 'yearly' }),
      makeSub({ id: '3', price: 299.99, currency: 'TRY', billingInterval: 'monthly' }),
      makeSub({ id: '4', price: 15, currency: 'EUR', billingInterval: 'monthly' }),
    ];

    const totals = calculateCurrencyIsolatedTotals(subs);
    expect(totals).toHaveLength(3);

    const usd = totals.find((t) => t.currency === 'USD')!;
    const tryTotal = totals.find((t) => t.currency === 'TRY')!;
    const eur = totals.find((t) => t.currency === 'EUR')!;

    expect(usd.monthlyEstimate).toBe(30); // 20 + 120/12
    expect(usd.annualEstimate).toBe(360);
    expect(usd.activeCount).toBe(2);

    expect(tryTotal.monthlyEstimate).toBe(299.99);
    expect(tryTotal.annualEstimate).toBe(3599.88);
    expect(tryTotal.activeCount).toBe(1);

    expect(eur.monthlyEstimate).toBe(15);
    expect(eur.annualEstimate).toBe(180);
  });

  it('excludes cancelled and archived subscriptions from active recurring totals', () => {
    const subs: SubscriptionRecord[] = [
      makeSub({ id: '1', price: 25, currency: 'USD', status: 'active' }),
      makeSub({ id: '2', price: 50, currency: 'USD', status: 'cancelled' }),
      makeSub({ id: '3', price: 75, currency: 'USD', status: 'archived' }),
    ];

    const totals = calculateCurrencyIsolatedTotals(subs);
    expect(totals).toHaveLength(1);
    expect(totals[0].monthlyEstimate).toBe(25);
    expect(totals[0].activeCount).toBe(1);
  });

  it('distinguishes current spending vs potential savings for subscriptions planned for cancellation', () => {
    const subs: SubscriptionRecord[] = [
      makeSub({ id: '1', price: 20, currency: 'USD', status: 'active' }),
      makeSub({
        id: '2',
        price: 15,
        currency: 'USD',
        status: 'planned_cancellation',
        plannedCancellationDate: '2026-11-15',
      }),
      makeSub({ id: '3', price: 100, currency: 'USD', status: 'cancelled' }),
    ];

    const totals = calculateCurrencyIsolatedTotals(subs);
    const usd = totals.find((t) => t.currency === 'USD')!;

    // Current spending still includes planned_cancellation because it has not been cancelled yet!
    expect(usd.monthlyEstimate).toBe(35);
    expect(usd.annualEstimate).toBe(420);
    expect(usd.activeCount).toBe(2);
    expect(usd.plannedCancellationCount).toBe(1);

    // Potential savings from planned cancellations
    expect(usd.potentialMonthlySavings).toBe(15);
    expect(usd.potentialAnnualSavings).toBe(180);

    // Hypothetical post-cancellation spending
    expect(usd.postCancellationMonthlyEstimate).toBe(20);
    expect(usd.postCancellationAnnualEstimate).toBe(240);
  });

  it('converts amounts only when a user-provided manual exchange rate exists', () => {
    const rates = [
      { fromCurrency: 'USD' as const, toCurrency: 'TRY' as const, rate: 34.5, updatedAt: '2026-10-19' },
    ];

    const direct = convertWithManualRate(10, 'USD', 'TRY', rates);
    expect(direct?.convertedAmount).toBe(345);

    const missing = convertWithManualRate(10, 'EUR', 'GBP', rates);
    expect(missing).toBeNull();
  });

  it('calculates category breakdown without mixing currencies', () => {
    const subs: SubscriptionRecord[] = [
      makeSub({ id: '1', category: 'streaming', price: 15, currency: 'USD' }),
      makeSub({ id: '2', category: 'streaming', price: 200, currency: 'TRY' }),
      makeSub({ id: '3', category: 'streaming', price: 10, currency: 'USD' }),
    ];

    const breakdown = calculateSpendingByCategory(subs);
    expect(breakdown).toHaveLength(2);
    const usdStreaming = breakdown.find((b) => b.currency === 'USD')!;
    const tryStreaming = breakdown.find((b) => b.currency === 'TRY')!;

    expect(usdStreaming.monthlyAmount).toBe(25);
    expect(usdStreaming.subscriptionCount).toBe(2);
    expect(tryStreaming.monthlyAmount).toBe(200);
    expect(tryStreaming.subscriptionCount).toBe(1);
  });
});

describe('Date Utilities, Leap Years, Month Boundaries & Upcoming Filters', () => {
  it('identifies leap years and days in month accurately', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);

    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(isValidCalendarDate('2024-02-29')).toBe(true);
    expect(isValidCalendarDate('2025-02-29')).toBe(false);
  });

  it('handles month-end renewal calculations across short months and leap years', () => {
    // Jan 31 -> Feb 28 in non-leap year 2026
    expect(addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    // Jan 31 -> Feb 29 in leap year 2024
    expect(addCalendarMonths('2024-01-31', 1)).toBe('2024-02-29');
    // Preserves anchor day 31 when stepping from Feb 28 to Mar 31
    expect(calculateNextBillingDate('2026-02-28', 'monthly', undefined, 31)).toBe('2026-03-31');
    // Yearly renewal from leap day 2024-02-29 -> 2025-02-28
    expect(calculateNextBillingDate('2024-02-29', 'yearly')).toBe('2025-02-28');
  });

  it('calculates exact calendar days remaining without timezone off-by-one errors', () => {
    expect(getDaysRemaining('2026-10-19', '2026-10-19')).toBe(0);
    expect(getDaysRemaining('2026-10-26', '2026-10-19')).toBe(7);
    expect(getDaysRemaining('2026-10-15', '2026-10-19')).toBe(-4);
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('filters upcoming renewals for 7, 30, 90, and all windows', () => {
    const refDate = '2026-10-19';
    const subs: SubscriptionRecord[] = [
      makeSub({ id: 'due-3d', name: 'Netflix', nextRenewalDate: '2026-10-22' }),
      makeSub({ id: 'due-15d', name: 'Spotify', nextRenewalDate: '2026-11-03' }),
      makeSub({ id: 'due-60d', name: 'GitHub', nextRenewalDate: '2026-12-18' }),
      makeSub({ id: 'due-120d', name: 'Domain', nextRenewalDate: '2027-02-16' }),
      makeSub({ id: 'cancelled', name: 'Old App', nextRenewalDate: '2026-10-20', status: 'cancelled' }),
    ];

    expect(getUpcomingRenewals(subs, 7, refDate).map((i) => i.subscription.id)).toEqual(['due-3d']);
    expect(getUpcomingRenewals(subs, 30, refDate).map((i) => i.subscription.id)).toEqual([
      'due-3d',
      'due-15d',
    ]);
    expect(getUpcomingRenewals(subs, 90, refDate).map((i) => i.subscription.id)).toEqual([
      'due-3d',
      'due-15d',
      'due-60d',
    ]);
    expect(getUpcomingRenewals(subs, 'all', refDate).map((i) => i.subscription.id)).toEqual([
      'due-3d',
      'due-15d',
      'due-60d',
      'due-120d',
    ]);
  });

  it('detects expiring free trials accurately', () => {
    const refDate = '2026-10-19';
    const subs: SubscriptionRecord[] = [
      makeSub({ id: 'trial-soon', trialEndDate: '2026-10-23' }),
      makeSub({ id: 'trial-far', trialEndDate: '2026-12-01' }),
    ];

    const expiring = getExpiringTrials(subs, 14, refDate);
    expect(expiring).toHaveLength(1);
    expect(expiring[0].subscription.id).toBe('trial-soon');
    expect(expiring[0].daysRemaining).toBe(4);
  });

  it('projects 12-month renewal schedule deterministically by currency', () => {
    const subs: SubscriptionRecord[] = [
      makeSub({
        id: 'm1',
        price: 10,
        currency: 'USD',
        billingInterval: 'monthly',
        nextRenewalDate: '2026-10-25',
      }),
      makeSub({
        id: 'y1',
        price: 500,
        currency: 'TRY',
        billingInterval: 'yearly',
        nextRenewalDate: '2026-12-10',
      }),
    ];

    const projection = calculateTwelveMonthProjection(subs, '2026-10-19');
    expect(projection).toHaveLength(12);
    expect(projection[0].monthKey).toBe('2026-10');
    expect(projection[0].totalsByCurrency.USD).toBe(10);
    expect(projection[0].totalsByCurrency.TRY).toBe(0);

    const decPoint = projection.find((p) => p.monthKey === '2026-12')!;
    expect(decPoint.totalsByCurrency.USD).toBe(10);
    expect(decPoint.totalsByCurrency.TRY).toBe(500);
  });

  it('generates renewal occurrences within a calendar month window', () => {
    const occ = getRenewalOccurrencesInRange(
      '2026-10-05',
      'weekly',
      '2026-10-01',
      '2026-10-31'
    );
    expect(occ).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  });
});

describe('Backup Import Validation, Duplicate ID Handling & Security', () => {
  it('validates a well-formed backup payload and detects duplicate IDs', () => {
    const payload = {
      app: 'RenewRadar',
      schemaVersion: 1,
      exportedAt: '2026-10-19T12:00:00.000Z',
      subscriptions: [
        makeSub({ id: 'sub-a', name: 'Service A' }),
        makeSub({ id: 'sub-b', name: 'Service B' }),
      ],
    };

    const result = validateBackupJson(JSON.stringify(payload), new Set(['sub-a']));
    expect(result.isValid).toBe(true);
    expect(result.recordCount).toBe(2);
    expect(result.duplicateIdCount).toBe(1);
  });

  it('rejects malformed JSON and unsafe javascript: URLs', () => {
    const badJson = validateBackupJson('{not valid json');
    expect(badJson.isValid).toBe(false);

    const unsafePayload = {
      app: 'RenewRadar',
      schemaVersion: 1,
      subscriptions: [makeSub({ id: 'xss', providerUrl: 'javascript:alert(1)' })],
    };
    const unsafeResult = validateBackupJson(JSON.stringify(unsafePayload));
    expect(unsafeResult.isValid).toBe(false);
    expect(unsafeResult.errors[0]).toContain('Unsafe or invalid providerUrl');
  });

  it('handles duplicate IDs safely in merge (keep_both vs update_existing) and replace modes', () => {
    const existing = [makeSub({ id: 'sub-1', name: 'Original Name', price: 10 })];
    const incoming = [
      makeSub({ id: 'sub-1', name: 'Updated Name', price: 20 }),
      makeSub({ id: 'sub-2', name: 'New Service', price: 30 }),
    ];

    const mergedUpdate = mergeSubscriptionRecords(existing, incoming, 'merge', 'update_existing');
    expect(mergedUpdate).toHaveLength(2);
    expect(mergedUpdate.find((s) => s.id === 'sub-1')?.name).toBe('Updated Name');

    const mergedKeepBoth = mergeSubscriptionRecords(existing, incoming, 'merge', 'keep_both');
    expect(mergedKeepBoth).toHaveLength(3);

    const replaced = mergeSubscriptionRecords(existing, incoming, 'replace');
    expect(replaced).toHaveLength(2);
    expect(replaced[0].name).toBe('Updated Name');
  });

  it('normalizes valid domain URLs and rejects unsafe schemes', () => {
    expect(normalizeAndValidateUrl('netflix.com')).toEqual({
      isValid: true,
      normalizedUrl: 'https://netflix.com/',
    });
    expect(normalizeAndValidateUrl('https://github.com/settings/billing')).toEqual({
      isValid: true,
      normalizedUrl: 'https://github.com/settings/billing',
    });
    expect(normalizeAndValidateUrl('javascript:void(0)').isValid).toBe(false);
    expect(normalizeAndValidateUrl('data:text/html,<script>').isValid).toBe(false);
  });
});

import { createDemoSubscriptions } from './demoData';
import { validateSubscriptionRecord } from './backupUtils';
import { TRANSLATIONS } from '../i18n/translations';
import {
  clearAllApplicationData,
  deleteSubscriptionRecord,
  loadAllSubscriptions,
  loadUserPreferences,
  saveSubscriptionRecord,
  saveUserPreferences,
} from '../services/storage';
import { DEFAULT_PREFERENCES } from '../types/subscription';

describe('Demo Mode Isolation, Persistence & Localization Completeness', () => {
  it('generates valid demo records that are all explicitly flagged with isDemo = true', () => {
    const demoRecords = createDemoSubscriptions('2026-10-19');
    expect(demoRecords.length).toBeGreaterThanOrEqual(5);

    for (const [idx, rec] of demoRecords.entries()) {
      expect(rec.isDemo).toBe(true);
      const validation = validateSubscriptionRecord(rec, idx);
      expect(validation.error).toBeUndefined();
      expect(validation.record?.id).toBe(rec.id);
    }
  });

  it('persists and clears subscriptions and preferences cleanly via storage service', async () => {
    await clearAllApplicationData();
    const initial = await loadAllSubscriptions();
    expect(initial.records).toHaveLength(0);

    const sample = makeSub({ id: 'persist-1', name: 'Persisted Sub' });
    await saveSubscriptionRecord(sample);

    const afterSave = await loadAllSubscriptions();
    expect(afterSave.records).toHaveLength(1);
    expect(afterSave.records[0].name).toBe('Persisted Sub');

    await saveUserPreferences({ ...DEFAULT_PREFERENCES, language: 'tr', defaultCurrency: 'TRY' });
    const prefs = await loadUserPreferences();
    expect(prefs.language).toBe('tr');
    expect(prefs.defaultCurrency).toBe('TRY');

    await deleteSubscriptionRecord('persist-1');
    const afterDelete = await loadAllSubscriptions();
    expect(afterDelete.records).toHaveLength(0);

    await clearAllApplicationData();
  });

  it('maintains complete structural parity between English (en) and Turkish (tr) translations', () => {
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const trKeys = Object.keys(TRANSLATIONS.tr).sort();
    expect(trKeys).toEqual(enKeys);

    expect(Object.keys(TRANSLATIONS.tr.categories).sort()).toEqual(
      Object.keys(TRANSLATIONS.en.categories).sort()
    );
    expect(Object.keys(TRANSLATIONS.tr.intervals).sort()).toEqual(
      Object.keys(TRANSLATIONS.en.intervals).sort()
    );
    expect(Object.keys(TRANSLATIONS.tr.statuses).sort()).toEqual(
      Object.keys(TRANSLATIONS.en.statuses).sort()
    );
  });
});

