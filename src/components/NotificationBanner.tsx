import React from 'react';
import { AlertCircle, Bell, Clock, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDaysRemaining, getTodayCalendarDate, isValidCalendarDate } from '../utils/dateUtils';
import { isCountedInActiveRecurring } from '../utils/financeUtils';

export const NotificationBanner: React.FC = () => {
  const {
    subscriptions,
    preferences,
    t,
    hasDemoRecords,
    removeDemoDataset,
    setActiveSection,
  } = useApp();

  const todayStr = getTodayCalendarDate();

  let overdueCount = 0;
  let dueWithinReminderCount = 0;
  let trialsEndingCount = 0;

  for (const sub of subscriptions) {
    if (!isCountedInActiveRecurring(sub)) continue;

    if (isValidCalendarDate(sub.nextRenewalDate)) {
      const days = getDaysRemaining(sub.nextRenewalDate, todayStr);
      const lead = sub.reminderLeadDays ?? preferences.defaultReminderLeadDays;
      if (days < 0) {
        overdueCount++;
      } else if (days <= lead) {
        dueWithinReminderCount++;
      }
    }

    if (sub.trialEndDate && isValidCalendarDate(sub.trialEndDate)) {
      const trialDays = getDaysRemaining(sub.trialEndDate, todayStr);
      if (trialDays >= 0 && trialDays <= 7) {
        trialsEndingCount++;
      }
    }
  }

  const hasAlerts = overdueCount > 0 || dueWithinReminderCount > 0 || trialsEndingCount > 0;

  return (
    <div className="space-y-3 mb-6">
      {hasDemoRecords && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <div className="flex items-start sm:items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-300">
                {t.demoBanner.title}:
              </span>{' '}
              <span className="text-amber-800 dark:text-amber-200/90">
                {t.demoBanner.description}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={removeDemoDataset}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-500/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.demoBanner.removeDemoButton}
          </button>
        </div>
      )}

      {hasAlerts && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-4 py-3 text-sm shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <Bell className="h-4 w-4 text-emerald-500" />
              <span>{t.notifications.bannerTitle}:</span>
            </div>

            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection('subscriptions')}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {t.notifications.overdueCount(overdueCount)}
              </button>
            )}

            {dueWithinReminderCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection('dashboard')}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                {t.notifications.dueSoonCount(dueWithinReminderCount)}
              </button>
            )}

            {trialsEndingCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection('calendar')}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                {t.notifications.trialsEndingCount(trialsEndingCount)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
