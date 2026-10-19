import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FilterX,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  BILLING_INTERVALS,
  BillingInterval,
  CurrencyCode,
  INITIAL_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  SubscriptionCategory,
  SubscriptionRecord,
  SubscriptionStatus,
  SUPPORTED_CURRENCIES,
} from '../types/subscription';
import {
  calculateMonthlyEstimate,
  convertWithManualRate,
  formatCurrency,
} from '../utils/financeUtils';
import { formatDisplayDate, getDaysRemaining, getTodayCalendarDate } from '../utils/dateUtils';
import { ConfirmDialog } from '../components/ConfirmDialog';

type SortOption = 'nextRenewal' | 'amount' | 'name' | 'updated';
type UpcomingFilterOption = 'all' | '7d' | '30d' | 'overdue';

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    preferences,
    t,
    openEditModal,
    duplicateSubscription,
    setSubscriptionStatus,
    deleteSubscription,
    markSubscriptionAsPaid,
    undoMarkSubscriptionAsPaid,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SubscriptionCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'all'>('all');
  const [intervalFilter, setIntervalFilter] = useState<BillingInterval | 'all'>('all');
  const [upcomingFilter, setUpcomingFilter] = useState<UpcomingFilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('nextRenewal');

  const [deletingSub, setDeletingSub] = useState<SubscriptionRecord | null>(null);

  const todayStr = getTodayCalendarDate();

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    currencyFilter !== 'all' ||
    intervalFilter !== 'all' ||
    upcomingFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrencyFilter('all');
    setIntervalFilter('all');
    setUpcomingFilter('all');
  };

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = subscriptions.filter((sub) => {
      if (query) {
        const matchName = sub.name.toLowerCase().includes(query);
        const matchNotes = sub.notes ? sub.notes.toLowerCase().includes(query) : false;
        const matchPayment = sub.paymentMethodLabel
          ? sub.paymentMethodLabel.toLowerCase().includes(query)
          : false;
        if (!matchName && !matchNotes && !matchPayment) return false;
      }

      if (categoryFilter !== 'all' && sub.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (currencyFilter !== 'all' && sub.currency !== currencyFilter) return false;
      if (intervalFilter !== 'all' && sub.billingInterval !== intervalFilter) return false;

      if (upcomingFilter !== 'all') {
        const days = getDaysRemaining(sub.nextRenewalDate, todayStr);
        if (upcomingFilter === 'overdue' && days >= 0) return false;
        if (upcomingFilter === '7d' && (days < 0 || days > 7)) return false;
        if (upcomingFilter === '30d' && (days < 0 || days > 30)) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'amount': {
          const monthlyA = calculateMonthlyEstimate(
            a.price,
            a.billingInterval,
            a.customIntervalDays
          );
          const monthlyB = calculateMonthlyEstimate(
            b.price,
            b.billingInterval,
            b.customIntervalDays
          );
          return monthlyB - monthlyA;
        }
        case 'updated':
          return b.updatedAt.localeCompare(a.updatedAt);
        case 'nextRenewal':
        default:
          return a.nextRenewalDate.localeCompare(b.nextRenewalDate);
      }
    });
  }, [
    subscriptions,
    searchQuery,
    categoryFilter,
    statusFilter,
    currencyFilter,
    intervalFilter,
    upcomingFilter,
    sortBy,
    todayStr,
  ]);

  const handleExportSingleRecord = (sub: SubscriptionRecord) => {
    const blob = new Blob([JSON.stringify(sub, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = sub.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    a.download = `renewradar-${safeName || sub.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Search and Combined Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              aria-label={t.common.searchPlaceholder}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-medium text-slate-500">
              {t.subscriptionsPage.sortByLabel}:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              <option value="nextRenewal">{t.subscriptionsPage.sortNextRenewal}</option>
              <option value="amount">{t.subscriptionsPage.sortAmount}</option>
              <option value="name">{t.subscriptionsPage.sortName}</option>
              <option value="updated">{t.subscriptionsPage.sortUpdated}</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FilterX className="h-3.5 w-3.5 text-rose-500" />
                {t.common.clearAllFilters}
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SubscriptionCategory | 'all')}
            aria-label={t.form.categoryLabel}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.common.allCategories}</option>
            {INITIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t.categories[cat]}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
            aria-label={t.form.statusLabel}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.common.allStatuses}</option>
            {SUBSCRIPTION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {t.statuses[st]}
              </option>
            ))}
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as CurrencyCode | 'all')}
            aria-label={t.form.currencyLabel}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.common.allCurrencies}</option>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>

          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value as BillingInterval | 'all')}
            aria-label={t.form.billingIntervalLabel}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.common.allIntervals}</option>
            {BILLING_INTERVALS.map((intv) => (
              <option key={intv} value={intv}>
                {t.intervals[intv]}
              </option>
            ))}
          </select>

          <select
            value={upcomingFilter}
            onChange={(e) => setUpcomingFilter(e.target.value as UpcomingFilterOption)}
            aria-label={t.subscriptionsPage.upcomingFilterLabel}
            className="col-span-2 sm:col-span-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.subscriptionsPage.upcomingAll}</option>
            <option value="7d">{t.subscriptionsPage.upcoming7d}</option>
            <option value="30d">{t.subscriptionsPage.upcoming30d}</option>
            <option value="overdue">{t.subscriptionsPage.upcomingOverdue}</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            {t.subscriptionsPage.showingCount(filteredAndSorted.length, subscriptions.length)}
          </span>
        </div>
      </div>

      {/* Results List / Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-10 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.subscriptionsPage.emptyMatching}
          </p>
          <div className="flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.common.clearAllFilters}
              </button>
            )}
            <button
              type="button"
              onClick={() => openEditModal()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.common.addSubscription}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.service}</th>
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.category}</th>
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.billing}</th>
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.normalizedMonthly}</th>
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.nextRenewal}</th>
                  <th className="py-3.5 px-4">{t.subscriptionsPage.tableHeaders.status}</th>
                  <th className="py-3.5 px-4 text-right">
                    {t.subscriptionsPage.tableHeaders.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                {filteredAndSorted.map((sub) => {
                  const monthlyNormalized = calculateMonthlyEstimate(
                    sub.price,
                    sub.billingInterval,
                    sub.customIntervalDays
                  );
                  const daysRemaining = getDaysRemaining(sub.nextRenewalDate, todayStr);
                  const isActiveLike =
                    sub.status === 'active' || sub.status === 'planned_cancellation';

                  // Check if user wants a converted secondary display estimate
                  const manualConverted =
                    preferences.preferredDisplayCurrency &&
                    preferences.preferredDisplayCurrency !== 'ORIGINAL' &&
                    preferences.preferredDisplayCurrency !== sub.currency
                      ? convertWithManualRate(
                          monthlyNormalized,
                          sub.currency,
                          preferences.preferredDisplayCurrency,
                          preferences.manualExchangeRates
                        )
                      : null;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.accentColor || '#10b981' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {sub.name}
                              </span>
                              {sub.isDemo && (
                                <span className="rounded-sm bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                                  {t.common.demoBadge}
                                </span>
                              )}
                              {sub.providerUrl && (
                                <a
                                  href={sub.providerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={t.common.openProvider}
                                  className="text-slate-400 hover:text-emerald-500"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            {(sub.notes || sub.paymentMethodLabel) && (
                              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                {sub.paymentMethodLabel ? `[${sub.paymentMethodLabel}] ` : ''}
                                {sub.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {t.categories[sub.category]}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(sub.price, sub.currency, preferences.language)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {sub.billingInterval === 'custom_days'
                            ? `${sub.customIntervalDays}d`
                            : t.intervals[sub.billingInterval]}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {formatCurrency(
                            monthlyNormalized,
                            sub.currency,
                            preferences.language
                          )}
                          /mo
                        </div>
                        {manualConverted && preferences.preferredDisplayCurrency !== 'ORIGINAL' && (
                          <div
                            className="text-[11px] text-blue-600 dark:text-blue-400"
                            title={t.dashboard.manualRateEstimate.disclaimer}
                          >
                            ≈{' '}
                            {formatCurrency(
                              manualConverted.convertedAmount,
                              preferences.preferredDisplayCurrency!,
                              preferences.language
                            )}{' '}
                            (manual)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-900 dark:text-slate-100">
                          {formatDisplayDate(sub.nextRenewalDate, preferences.dateFormat)}
                        </div>
                        {isActiveLike && (
                          <div
                            className={`text-[11px] font-medium mt-0.5 ${
                              daysRemaining < 0
                                ? 'text-rose-500'
                                : daysRemaining <= 7
                                ? 'text-amber-500'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {daysRemaining < 0
                              ? t.common.overdueBy(daysRemaining)
                              : daysRemaining === 0
                              ? t.common.dueToday
                              : t.common.daysLeft(daysRemaining)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : sub.status === 'planned_cancellation'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : sub.status === 'cancelled'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t.statuses[sub.status]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {isActiveLike && (
                            <button
                              type="button"
                              onClick={() => markSubscriptionAsPaid(sub.id)}
                              title={t.common.markAsPaid}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {sub.previousRenewalDateBeforeMarkPaid && (
                            <button
                              type="button"
                              onClick={() => undoMarkSubscriptionAsPaid(sub.id)}
                              title={t.common.undoMarkPaid}
                              className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            title={t.common.edit}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => duplicateSubscription(sub.id)}
                            title={t.common.duplicate}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          {sub.status !== 'archived' ? (
                            <button
                              type="button"
                              onClick={() => setSubscriptionStatus(sub.id, 'archived')}
                              title={t.common.archive}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSubscriptionStatus(sub.id, 'active')}
                              title={t.common.restore}
                              className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10"
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExportSingleRecord(sub)}
                            title={t.common.exportSingleRecord}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingSub(sub)}
                            title={t.common.delete}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingSub)}
        title={t.subscriptionsPage.deleteConfirmTitle}
        message={
          deletingSub ? t.subscriptionsPage.deleteConfirmMessage(deletingSub.name) : ''
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        variant="danger"
        onConfirm={async () => {
          if (deletingSub) {
            await deleteSubscription(deletingSub.id);
            setDeletingSub(null);
          }
        }}
        onCancel={() => setDeletingSub(null)}
      />
    </div>
  );
};
