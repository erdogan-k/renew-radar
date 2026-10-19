import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit3, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDisplayDate,
  formatPartsToISO,
  getDayOfWeek,
  getDaysInMonth,
  getRenewalOccurrencesInRange,
  getTodayCalendarDate,
  parseCalendarDate,
} from '../utils/dateUtils';
import { formatCurrency, isCountedInActiveRecurring, roundCurrencyAmount } from '../utils/financeUtils';
import { CurrencyCode, SubscriptionRecord } from '../types/subscription';

interface CalendarEventItem {
  id: string;
  dateStr: string;
  type: 'renewal' | 'trial_end' | 'planned_cancel';
  subscription: SubscriptionRecord;
}

export const CalendarPage: React.FC = () => {
  const { subscriptions, preferences, t, openEditModal } = useApp();

  const todayStr = getTodayCalendarDate();
  const todayParts = parseCalendarDate(todayStr)!;

  const [viewYear, setViewYear] = useState<number>(todayParts.year);
  const [viewMonth, setViewMonth] = useState<number>(todayParts.month); // 1-12
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleReturnToCurrentMonth = () => {
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
    setSelectedDateStr(todayStr);
  };

  const daysInViewMonth = getDaysInMonth(viewYear, viewMonth);
  const monthStartStr = formatPartsToISO({ year: viewYear, month: viewMonth, day: 1 });
  const monthEndStr = formatPartsToISO({ year: viewYear, month: viewMonth, day: daysInViewMonth });

  // Compute all calendar events in the viewed month without timezone shifts
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();

    const addEvent = (item: CalendarEventItem) => {
      const list = map.get(item.dateStr) || [];
      list.push(item);
      map.set(item.dateStr, list);
    };

    for (const sub of subscriptions) {
      if (!isCountedInActiveRecurring(sub)) continue;

      // 1. Expected Renewal Occurrences in this month
      const occurrences = getRenewalOccurrencesInRange(
        sub.nextRenewalDate,
        sub.billingInterval,
        monthStartStr,
        monthEndStr,
        sub.customIntervalDays
      );

      for (const occDate of occurrences) {
        addEvent({
          id: `${sub.id}-renewal-${occDate}`,
          dateStr: occDate,
          type: 'renewal',
          subscription: sub,
        });
      }

      // 2. Trial Ending Event in this month
      if (
        sub.trialEndDate &&
        sub.trialEndDate >= monthStartStr &&
        sub.trialEndDate <= monthEndStr
      ) {
        addEvent({
          id: `${sub.id}-trial-${sub.trialEndDate}`,
          dateStr: sub.trialEndDate,
          type: 'trial_end',
          subscription: sub,
        });
      }

      // 3. Planned Cancellation Target Date in this month
      if (
        sub.status === 'planned_cancellation' &&
        sub.plannedCancellationDate &&
        sub.plannedCancellationDate >= monthStartStr &&
        sub.plannedCancellationDate <= monthEndStr
      ) {
        addEvent({
          id: `${sub.id}-cancel-${sub.plannedCancellationDate}`,
          dateStr: sub.plannedCancellationDate,
          type: 'planned_cancel',
          subscription: sub,
        });
      }
    }

    return map;
  }, [subscriptions, monthStartStr, monthEndStr]);

  // Build calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDayDow = getDayOfWeek(monthStartStr); // 0 = Sun ... 6 = Sat
    const leadingEmptyCount =
      preferences.weekStart === 'monday' ? (firstDayDow + 6) % 7 : firstDayDow;

    const cells: Array<{ dateStr: string | null; dayNumber: number | null }> = [];
    for (let i = 0; i < leadingEmptyCount; i++) {
      cells.push({ dateStr: null, dayNumber: null });
    }
    for (let d = 1; d <= daysInViewMonth; d++) {
      cells.push({
        dateStr: formatPartsToISO({ year: viewYear, month: viewMonth, day: d }),
        dayNumber: d,
      });
    }
    return cells;
  }, [monthStartStr, preferences.weekStart, daysInViewMonth, viewYear, viewMonth]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDateStr) || [],
    [eventsByDate, selectedDateStr]
  );

  // Daily totals grouped by currency for the selected date (renewal events only)
  const selectedDailyTotals = useMemo(() => {
    const map = new Map<CurrencyCode, number>();
    for (const ev of selectedDateEvents) {
      if (ev.type === 'renewal') {
        const prev = map.get(ev.subscription.currency) || 0;
        map.set(ev.subscription.currency, roundCurrencyAmount(prev + ev.subscription.price));
      }
    }
    return Array.from(map.entries());
  }, [selectedDateEvents]);

  // Sorted monthly agenda for mobile & quick scanning
  const monthlyAgendaDates = useMemo(() => {
    return Array.from(eventsByDate.keys()).sort();
  }, [eventsByDate]);

  const weekdayHeaders =
    preferences.weekStart === 'monday'
      ? t.calendarPage.weekdaysMonStart
      : t.calendarPage.weekdaysSunStart;

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-500">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t.calendarPage.months[viewMonth - 1]} {viewYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.calendarPage.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label={t.calendarPage.prevMonth}
            className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReturnToCurrentMonth}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t.calendarPage.returnToCurrentMonth}
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label={t.calendarPage.nextMonth}
            className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Desktop & Tablet Month Grid */}
        <div className="hidden md:block lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {weekdayHeaders.map((dayLabel) => (
              <div
                key={dayLabel}
                className="py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {dayLabel}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, index) => {
              if (!cell.dateStr || !cell.dayNumber) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-24 rounded-lg bg-slate-50/40 dark:bg-slate-950/30 border border-transparent"
                  />
                );
              }

              const dayEvents = eventsByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr!)}
                  className={`h-24 rounded-lg border p-2 text-left flex flex-col justify-between transition-all overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5'
                      : isToday
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isToday
                          ? 'text-amber-600 dark:text-amber-400'
                          : isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                          ev.type === 'trial_end'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : ev.type === 'planned_cancel'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {ev.subscription.name}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-mono text-slate-400 pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector Panel */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.calendarPage.selectedDateTitle(
                  formatDisplayDate(selectedDateStr, preferences.dateFormat)
                )}
              </h3>
              {selectedDailyTotals.length > 0 && (
                <div className="mt-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 p-3 space-y-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {t.calendarPage.dailyTotalsLabel}
                  </span>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {selectedDailyTotals.map(([curr, total]) => (
                      <span
                        key={curr}
                        className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {formatCurrency(total, curr, preferences.language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                {t.calendarPage.noEventsOnDate}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedDateEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            ev.type === 'trial_end'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : ev.type === 'planned_cancel'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {ev.type === 'trial_end'
                            ? t.calendarPage.trialEndingBadge
                            : ev.type === 'planned_cancel'
                            ? t.calendarPage.plannedCancelBadge
                            : t.calendarPage.renewalEventBadge}
                        </span>
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {ev.subscription.name}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.categories[ev.subscription.category]} •{' '}
                        {t.intervals[ev.subscription.billingInterval]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(
                          ev.subscription.price,
                          ev.subscription.currency,
                          preferences.language
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(ev.subscription)}
                        title={t.common.edit}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile & Compact Monthly Agenda List View */}
      <div className="md:hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          {t.calendarPage.mobileAgendaTitle}
        </h3>
        {monthlyAgendaDates.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.calendarPage.noEventsOnDate}
          </p>
        ) : (
          <div className="space-y-3">
            {monthlyAgendaDates.map((dateStr) => {
              const items = eventsByDate.get(dateStr) || [];
              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2 cursor-pointer"
                >
                  <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatDisplayDate(dateStr, preferences.dateFormat)}
                  </div>
                  {items.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {ev.type === 'trial_end' && (
                          <Timer className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {ev.subscription.name}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(
                          ev.subscription.price,
                          ev.subscription.currency,
                          preferences.language
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
