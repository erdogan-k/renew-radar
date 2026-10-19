import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  PiggyBank,
  Scissors,
  Undo2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateAnnualEstimate,
  calculateCurrencyIsolatedTotals,
  calculateMonthlyEstimate,
  formatCurrency,
} from '../utils/financeUtils';
import { formatDisplayDate, getTodayCalendarDate } from '../utils/dateUtils';

export const SavingsPage: React.FC = () => {
  const {
    subscriptions,
    preferences,
    t,
    setSubscriptionStatus,
    updateSubscription,
  } = useApp();

  const currencyTotals = useMemo(
    () => calculateCurrencyIsolatedTotals(subscriptions),
    [subscriptions]
  );

  const plannedCancellationSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'planned_cancellation'),
    [subscriptions]
  );

  const activeCandidateSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'active'),
    [subscriptions]
  );

  const cancelledAndArchivedSubs = useMemo(
    () => subscriptions.filter((s) => s.status === 'cancelled' || s.status === 'archived'),
    [subscriptions]
  );

  return (
    <div className="space-y-6">
      {/* Explicit Hypothetical & Local-Only Notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <h3 className="font-semibold text-amber-900 dark:text-amber-300">
            {t.savingsPage.hypotheticalNoticeTitle}
          </h3>
          <p className="mt-1 text-amber-800 dark:text-amber-200/90">
            {t.savingsPage.hypotheticalNoticeBody}
          </p>
        </div>
      </div>

      {/* Currency-Isolated Savings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Active Monthly Spend (Before Cancellation) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.savingsPage.cards.currentActiveSpend}
          </span>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.length === 0 ? (
              <p className="text-lg font-mono font-bold text-slate-400">0.00</p>
            ) : (
              currencyTotals.map((ct) => (
                <div key={ct.currency} className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-500">{ct.currency}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(ct.monthlyEstimate, ct.currency, preferences.language)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Planned Monthly Savings */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t.savingsPage.cards.plannedMonthlySavings}
          </span>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.every((c) => c.potentialMonthlySavings === 0) ? (
              <p className="text-lg font-mono font-bold text-slate-400">0.00</p>
            ) : (
              currencyTotals
                .filter((c) => c.potentialMonthlySavings > 0)
                .map((ct) => (
                  <div key={ct.currency} className="flex items-baseline justify-between font-mono">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {ct.currency}
                    </span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        ct.potentialMonthlySavings,
                        ct.currency,
                        preferences.language
                      )}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* 3. Annualized Potential Savings */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t.savingsPage.cards.plannedAnnualSavings}
            </span>
            <PiggyBank className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.every((c) => c.potentialAnnualSavings === 0) ? (
              <p className="text-lg font-mono font-bold text-slate-400">0.00</p>
            ) : (
              currencyTotals
                .filter((c) => c.potentialAnnualSavings > 0)
                .map((ct) => (
                  <div key={ct.currency} className="flex items-baseline justify-between font-mono">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      {ct.currency}
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        ct.potentialAnnualSavings,
                        ct.currency,
                        preferences.language
                      )}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* 4. Estimated Future Spending After Planned Cancellations */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.savingsPage.cards.postCancelSpend}
          </span>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.length === 0 ? (
              <p className="text-lg font-mono font-bold text-slate-400">0.00</p>
            ) : (
              currencyTotals.map((ct) => (
                <div key={ct.currency} className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-500">{ct.currency}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(
                      ct.postCancellationMonthlyEstimate,
                      ct.currency,
                      preferences.language
                    )}
                    /mo
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Subscriptions Marked as Planned for Cancellation */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
          {t.savingsPage.plannedListTitle} ({plannedCancellationSubs.length})
        </h2>

        {plannedCancellationSubs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.savingsPage.plannedListEmpty}
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
            {plannedCancellationSubs.map((sub) => {
              const monthlyEst = calculateMonthlyEstimate(
                sub.price,
                sub.billingInterval,
                sub.customIntervalDays
              );
              const annualEst = calculateAnnualEstimate(
                sub.price,
                sub.billingInterval,
                sub.customIntervalDays
              );

              return (
                <div
                  key={sub.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: sub.accentColor || '#f59e0b' }}
                      />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({t.categories[sub.category]})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        {t.subscriptionsPage.tableHeaders.nextRenewal}:{' '}
                        <strong className="font-mono">
                          {formatDisplayDate(sub.nextRenewalDate, preferences.dateFormat)}
                        </strong>
                      </span>

                      <label className="inline-flex items-center gap-1.5">
                        <span>{t.savingsPage.targetCancelDateLabel}:</span>
                        <input
                          type="date"
                          value={sub.plannedCancellationDate || ''}
                          onChange={(e) =>
                            updateSubscription({
                              ...sub,
                              plannedCancellationDate: e.target.value || undefined,
                            })
                          }
                          className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 font-mono text-xs text-slate-900 dark:text-slate-100"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4">
                    <div className="text-left lg:text-right font-mono">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(annualEst, sub.currency, preferences.language)}/yr
                      </div>
                      <div className="text-xs text-slate-500">
                        ({formatCurrency(monthlyEst, sub.currency, preferences.language)}/mo)
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubscriptionStatus(sub.id, 'active')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        {t.savingsPage.keepActive}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubscriptionStatus(sub.id, 'cancelled')}
                        title={t.savingsPage.localRecordOnlyHint}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.savingsPage.markCancelledCompleted}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Active Subscriptions (Candidates to Plan for Cancellation) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.savingsPage.candidatesTitle} ({activeCandidateSubs.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.savingsPage.candidatesSubtitle}
          </p>
        </div>

        {activeCandidateSubs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.dashboard.metrics.noActiveSpend}
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
            {activeCandidateSubs.map((sub) => {
              const annualEst = calculateAnnualEstimate(
                sub.price,
                sub.billingInterval,
                sub.customIntervalDays
              );
              return (
                <div
                  key={sub.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: sub.accentColor || '#10b981' }}
                      />
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        • {t.categories[sub.category]}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 font-mono">
                      {formatCurrency(sub.price, sub.currency, preferences.language)} (
                      {t.intervals[sub.billingInterval]}) •{' '}
                      {t.subscriptionsPage.tableHeaders.nextRenewal}:{' '}
                      {formatDisplayDate(sub.nextRenewalDate, preferences.dateFormat)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {formatCurrency(annualEst, sub.currency, preferences.language)}/yr
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSubscriptionStatus(
                          sub.id,
                          'planned_cancellation',
                          sub.nextRenewalDate || getTodayCalendarDate()
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      {t.savingsPage.markForCancellation}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Cancelled & Archived History */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
          {t.savingsPage.historyTitle} ({cancelledAndArchivedSubs.length})
        </h2>

        {cancelledAndArchivedSubs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.savingsPage.historyEmpty}
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-2">
            {cancelledAndArchivedSubs.map((sub) => (
              <div
                key={sub.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {t.statuses[sub.status]}
                  </span>
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {sub.name}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    ({formatCurrency(sub.price, sub.currency, preferences.language)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSubscriptionStatus(sub.id, 'active')}
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArchiveRestore className="h-3.5 w-3.5 text-emerald-500" />
                  {t.common.restore}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
