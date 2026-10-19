import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Coins,
  Info,
  Layers,
  PiggyBank,
  Plus,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  calculateCurrencyIsolatedTotals,
  calculateSpendingByCategory,
  calculateTwelveMonthProjection,
  convertWithManualRate,
  formatCurrency,
  getExpiringTrials,
  getUpcomingRenewals,
} from '../utils/financeUtils';
import { formatDisplayDate, getTodayCalendarDate } from '../utils/dateUtils';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../types/subscription';

const CURRENCY_COLORS: Record<CurrencyCode, string> = {
  USD: '#10b981', // Emerald
  TRY: '#f59e0b', // Amber
  EUR: '#3b82f6', // Blue
  GBP: '#8b5cf6', // Violet
};

const CATEGORY_BAR_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
  '#64748b',
];

export const DashboardPage: React.FC = () => {
  const {
    subscriptions,
    preferences,
    t,
    openEditModal,
    loadDemoDataset,
    setActiveSection,
    markSubscriptionAsPaid,
  } = useApp();

  const [upcomingWindow, setUpcomingWindow] = useState<7 | 30 | 90 | 'all'>(30);
  const [excludePlannedCancelInProjection, setExcludePlannedCancelInProjection] = useState(false);

  const todayStr = getTodayCalendarDate();

  const currencyTotals = useMemo(
    () => calculateCurrencyIsolatedTotals(subscriptions),
    [subscriptions]
  );

  const activeCurrencies = useMemo(
    () => currencyTotals.map((c) => c.currency),
    [currencyTotals]
  );

  const [selectedCategoryCurrency, setSelectedCategoryCurrency] = useState<CurrencyCode>(
    preferences.defaultCurrency
  );

  useEffect(() => {
    if (activeCurrencies.length > 0 && !activeCurrencies.includes(selectedCategoryCurrency)) {
      setSelectedCategoryCurrency(activeCurrencies[0]);
    }
  }, [activeCurrencies, selectedCategoryCurrency]);

  const totalActiveCount = useMemo(
    () => currencyTotals.reduce((acc, c) => acc + c.activeCount, 0),
    [currencyTotals]
  );

  const totalPlannedCancelCount = useMemo(
    () => currencyTotals.reduce((acc, c) => acc + c.plannedCancellationCount, 0),
    [currencyTotals]
  );

  const dueNext7Days = useMemo(
    () => getUpcomingRenewals(subscriptions, 7, todayStr, true),
    [subscriptions, todayStr]
  );

  const filteredUpcoming = useMemo(
    () => getUpcomingRenewals(subscriptions, upcomingWindow, todayStr, true),
    [subscriptions, upcomingWindow, todayStr]
  );

  const expiringTrials = useMemo(
    () => getExpiringTrials(subscriptions, 14, todayStr),
    [subscriptions, todayStr]
  );

  const categoryBreakdown = useMemo(
    () => calculateSpendingByCategory(subscriptions, selectedCategoryCurrency),
    [subscriptions, selectedCategoryCurrency]
  );

  const categoryChartData = useMemo(
    () =>
      categoryBreakdown.map((item) => ({
        name: t.categories[item.category],
        monthly: item.monthlyAmount,
        annual: item.annualAmount,
        count: item.subscriptionCount,
      })),
    [categoryBreakdown, t.categories]
  );

  const projectionData = useMemo(() => {
    const raw = calculateTwelveMonthProjection(
      subscriptions,
      todayStr,
      excludePlannedCancelInProjection
    );
    return raw.map((point) => {
      const monthName = t.calendarPage.months[point.month - 1]?.slice(0, 3) || point.monthKey;
      return {
        label: `${monthName} '${String(point.year).slice(-2)}`,
        TRY: point.totalsByCurrency.TRY,
        USD: point.totalsByCurrency.USD,
        EUR: point.totalsByCurrency.EUR,
        GBP: point.totalsByCurrency.GBP,
      };
    });
  }, [subscriptions, todayStr, excludePlannedCancelInProjection, t.calendarPage.months]);

  // Optional User-Provided Manual Rate Estimate (only shown when user configured a preferred display currency and all or some currencies have user-entered manual rates)
  const manualConvertedSummary = useMemo(() => {
    const targetCurr = preferences.preferredDisplayCurrency;
    if (!targetCurr || targetCurr === 'ORIGINAL' || currencyTotals.length === 0) return null;
    if (preferences.manualExchangeRates.length === 0) return null;

    let monthlySum = 0;
    let annualSum = 0;
    let convertedCount = 0;
    const unconvertedCurrencies: CurrencyCode[] = [];

    for (const item of currencyTotals) {
      const convMonthly = convertWithManualRate(
        item.monthlyEstimate,
        item.currency,
        targetCurr,
        preferences.manualExchangeRates
      );
      if (convMonthly) {
        monthlySum += convMonthly.convertedAmount;
        annualSum += convMonthly.convertedAmount * 12;
        convertedCount++;
      } else {
        unconvertedCurrencies.push(item.currency);
      }
    }

    if (convertedCount === 0) return null;

    return {
      targetCurrency: targetCurr,
      monthlySum,
      annualSum,
      unconvertedCurrencies,
    };
  }, [
    preferences.preferredDisplayCurrency,
    preferences.manualExchangeRates,
    currencyTotals,
  ]);

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Layers className="h-7 w-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.dashboard.emptyState.title}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.dashboard.emptyState.description}
          </p>
          <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {t.dashboard.emptyState.privacyPoint}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openEditModal()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t.common.addSubscription}
            </button>
            <button
              type="button"
              onClick={loadDemoDataset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-5 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              {t.common.loadDemoData}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Estimated Monthly Recurring (Currency-Isolated) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.monthlyRecurring}</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.length === 0 ? (
              <p className="text-lg font-semibold text-slate-400">
                {t.dashboard.metrics.noActiveSpend}
              </p>
            ) : (
              currencyTotals.map((ct) => (
                <div
                  key={ct.currency}
                  className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/60 last:border-0 pb-1 last:pb-0"
                >
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {ct.currency}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatCurrency(ct.monthlyEstimate, ct.currency, preferences.language)}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.dashboard.metrics.acrossCurrencies(currencyTotals.length)}
          </p>
        </div>

        {/* 2. Estimated Annual Recurring (Currency-Isolated) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.annualRecurring}</span>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.length === 0 ? (
              <p className="text-lg font-semibold text-slate-400">
                {t.dashboard.metrics.noActiveSpend}
              </p>
            ) : (
              currencyTotals.map((ct) => (
                <div
                  key={ct.currency}
                  className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/60 last:border-0 pb-1 last:pb-0"
                >
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {ct.currency}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formatCurrency(ct.annualEstimate, ct.currency, preferences.language)}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            12 × {t.dashboard.categoryChart.monthlyNormalized.toLowerCase()}
          </p>
        </div>

        {/* 3. Potential Annual Savings from Planned Cancellations */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.potentialAnnualSavings}</span>
            <PiggyBank className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3 space-y-1.5">
            {currencyTotals.every((c) => c.potentialAnnualSavings === 0) ? (
              <p className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">
                0.00
              </p>
            ) : (
              currencyTotals
                .filter((c) => c.potentialAnnualSavings > 0)
                .map((ct) => (
                  <div
                    key={ct.currency}
                    className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800/60 last:border-0 pb-1 last:pb-0"
                  >
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {ct.currency}
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ct.potentialAnnualSavings, ct.currency, preferences.language)}
                    </span>
                  </div>
                ))
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.dashboard.metrics.hypotheticalEstimate}
          </p>
        </div>

        {/* 4. Active Subscriptions Count */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.activeCount}</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-3 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalActiveCount}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t.dashboard.metrics.plannedCancelCount(totalPlannedCancelCount)}
          </p>
        </div>

        {/* 5. Payments Due in Next 7 Days */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.dueNext7Days}</span>
            <AlertTriangle
              className={`h-4 w-4 ${
                dueNext7Days.length > 0 ? 'text-amber-500' : 'text-slate-400'
              }`}
            />
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono ${
              dueNext7Days.length > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {dueNext7Days.length}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {dueNext7Days.length > 0
              ? `${dueNext7Days[0].subscription.name} (${
                  dueNext7Days[0].daysRemaining === 0
                    ? t.common.dueToday
                    : dueNext7Days[0].daysRemaining < 0
                    ? t.common.overdueBy(dueNext7Days[0].daysRemaining)
                    : t.common.daysLeft(dueNext7Days[0].daysRemaining)
                })`
              : t.dashboard.upcoming.emptyFiltered}
          </p>
        </div>

        {/* 6. Free Trials Ending Soon */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>{t.dashboard.metrics.trialsEndingSoon}</span>
            <Timer
              className={`h-4 w-4 ${
                expiringTrials.length > 0 ? 'text-rose-500' : 'text-slate-400'
              }`}
            />
          </div>
          <p
            className={`mt-3 text-2xl font-bold font-mono ${
              expiringTrials.length > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {expiringTrials.length}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {expiringTrials.length > 0
              ? `${expiringTrials[0].subscription.name} (${t.common.daysLeft(
                  expiringTrials[0].daysRemaining
                )})`
              : t.dashboard.metrics.within14Days}
          </p>
        </div>
      </div>

      {/* Optional User-Entered Manual Exchange Rate Estimate Banner */}
      {manualConvertedSummary && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                {t.dashboard.manualRateEstimate.badge}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.dashboard.manualRateEstimate.title} ({manualConvertedSummary.targetCurrency})
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.dashboard.manualRateEstimate.disclaimer}
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0 font-mono">
            <div>
              <span className="block text-[11px] uppercase text-slate-500">
                {t.dashboard.metrics.monthlyRecurring}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                ≈{' '}
                {formatCurrency(
                  manualConvertedSummary.monthlySum,
                  manualConvertedSummary.targetCurrency,
                  preferences.language
                )}
              </span>
            </div>
            <div>
              <span className="block text-[11px] uppercase text-slate-500">
                {t.dashboard.metrics.annualRecurring}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                ≈{' '}
                {formatCurrency(
                  manualConvertedSummary.annualSum,
                  manualConvertedSummary.targetCurrency,
                  preferences.language
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Basis & Assumptions Notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50 px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <span>{t.dashboard.assumptionsNote}</span>
      </div>

      {/* Main Content Split: Upcoming Renewals & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Renewals Panel (7 columns on desktop) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.dashboard.upcoming.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.dashboard.upcoming.subtitle}
                </p>
              </div>

              {/* Timeframe filter pills */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 text-xs">
                {(
                  [
                    { key: 7, label: t.dashboard.upcoming.filter7d },
                    { key: 30, label: t.dashboard.upcoming.filter30d },
                    { key: 90, label: t.dashboard.upcoming.filter90d },
                    { key: 'all', label: t.dashboard.upcoming.filterAll },
                  ] as const
                ).map((tab) => (
                  <button
                    key={String(tab.key)}
                    type="button"
                    onClick={() => setUpcomingWindow(tab.key)}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                      upcomingWindow === tab.key
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUpcoming.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.upcoming.emptyFiltered}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/70 mt-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredUpcoming.map(({ subscription: sub, daysRemaining, isOverdue, isDueSoon }) => (
                  <div
                    key={sub.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.accentColor || '#10b981' }}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-500 dark:hover:text-emerald-400 text-left"
                          >
                            {sub.name}
                          </button>
                          {sub.isDemo && (
                            <span className="rounded-sm bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                              {t.common.demoBadge}
                            </span>
                          )}
                          {sub.status === 'planned_cancellation' && (
                            <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              {t.statuses.planned_cancellation}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{t.categories[sub.category]}</span>
                          <span>•</span>
                          <span>
                            {sub.billingInterval === 'custom_days'
                              ? `${sub.customIntervalDays}d`
                              : t.intervals[sub.billingInterval]}
                          </span>
                          <span>•</span>
                          <span className="font-mono">
                            {formatDisplayDate(sub.nextRenewalDate, preferences.dateFormat)}
                          </span>
                          {sub.trialEndDate && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              ({t.dashboard.upcoming.trialEndsLabel}:{' '}
                              {formatDisplayDate(sub.trialEndDate, preferences.dateFormat)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-5 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(sub.price, sub.currency, preferences.language)}
                        </div>
                        <span
                          className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isOverdue
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : daysRemaining === 0
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : isDueSoon
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isOverdue
                            ? t.common.overdueBy(daysRemaining)
                            : daysRemaining === 0
                            ? t.common.dueToday
                            : daysRemaining === 1
                            ? t.common.dueTomorrow
                            : t.common.daysLeft(daysRemaining)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => markSubscriptionAsPaid(sub.id)}
                        title={t.common.markAsPaid}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setActiveSection('subscriptions')}
              className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t.nav.subscriptions}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('calendar')}
              className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              {t.nav.calendar}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Spending by Category Chart (5 columns on desktop) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.dashboard.categoryChart.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.dashboard.categoryChart.subtitle}
                </p>
              </div>

              {/* Currency selector to prevent mixing currencies */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="cat-currency-select" className="sr-only">
                  {t.dashboard.categoryChart.currencySelectorLabel}
                </label>
                <select
                  id="cat-currency-select"
                  value={selectedCategoryCurrency}
                  onChange={(e) => setSelectedCategoryCurrency(e.target.value as CurrencyCode)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
                >
                  {(activeCurrencies.length > 0 ? activeCurrencies : SUPPORTED_CURRENCIES).map(
                    (curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {categoryChartData.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.categoryChart.emptyChart}
              </div>
            ) : (
              <div className="mt-4">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickFormatter={(val) => `${val} ${selectedCategoryCurrency}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value, selectedCategoryCurrency, preferences.language),
                          t.dashboard.categoryChart.monthlyNormalized,
                        ]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '0.5rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="monthly" radius={[0, 6, 6, 0]}>
                        {categoryChartData.map((_, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                  {categoryChartData.map((row, idx) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-xs"
                          style={{
                            backgroundColor:
                              CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length],
                          }}
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {row.name}
                        </span>
                        <span className="text-slate-400">({row.count})</span>
                      </div>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(
                          row.monthly,
                          selectedCategoryCurrency,
                          preferences.language
                        )}
                        /mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 12-Month Deterministic Cash-Flow Projection Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.dashboard.projectionChart.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.dashboard.projectionChart.subtitle}
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludePlannedCancelInProjection}
              onChange={(e) => setExcludePlannedCancelInProjection(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            {t.dashboard.projectionChart.includePlannedCancelToggle}
          </label>
        </div>

        {activeCurrencies.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.dashboard.projectionChart.emptyProjection}
          </div>
        ) : (
          <div className="mt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectionData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value, name as CurrencyCode, preferences.language),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {activeCurrencies.map((curr) => (
                    <Bar
                      key={curr}
                      dataKey={curr}
                      name={curr}
                      fill={CURRENCY_COLORS[curr]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.projectionChart.assumptionsDisclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
