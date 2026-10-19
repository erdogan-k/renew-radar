import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  BILLING_INTERVALS,
  BillingInterval,
  CurrencyCode,
  INITIAL_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  SubscriptionCategory,
  SubscriptionStatus,
  SUPPORTED_CURRENCIES,
} from '../types/subscription';
import { getTodayCalendarDate, isValidCalendarDate } from '../utils/dateUtils';
import { normalizeAndValidateUrl } from '../utils/financeUtils';

const ACCENT_PRESETS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#e11d48', // Rose
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const SubscriptionFormModal: React.FC = () => {
  const {
    isFormModalOpen,
    closeFormModal,
    editingSubscription,
    addSubscription,
    updateSubscription,
    preferences,
    t,
  } = useApp();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(preferences.defaultCurrency);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [customIntervalDays, setCustomIntervalDays] = useState('30');
  const [nextRenewalDate, setNextRenewalDate] = useState(getTodayCalendarDate());
  const [category, setCategory] = useState<SubscriptionCategory>('software');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [providerUrl, setProviderUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [trialEndDate, setTrialEndDate] = useState('');
  const [plannedCancellationDate, setPlannedCancellationDate] = useState('');
  const [paymentMethodLabel, setPaymentMethodLabel] = useState('');
  const [reminderLeadDays, setReminderLeadDays] = useState(
    String(preferences.defaultReminderLeadDays)
  );
  const [notes, setNotes] = useState('');
  const [accentColor, setAccentColor] = useState(ACCENT_PRESETS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isFormModalOpen) return;
    setErrors({});

    if (editingSubscription) {
      setName(editingSubscription.name);
      setPrice(String(editingSubscription.price));
      setCurrency(editingSubscription.currency);
      setBillingInterval(editingSubscription.billingInterval);
      setCustomIntervalDays(String(editingSubscription.customIntervalDays || 30));
      setNextRenewalDate(editingSubscription.nextRenewalDate);
      setCategory(editingSubscription.category);
      setStatus(editingSubscription.status);
      setProviderUrl(editingSubscription.providerUrl || '');
      setStartDate(editingSubscription.startDate || '');
      setTrialEndDate(editingSubscription.trialEndDate || '');
      setPlannedCancellationDate(editingSubscription.plannedCancellationDate || '');
      setPaymentMethodLabel(editingSubscription.paymentMethodLabel || '');
      setReminderLeadDays(
        String(editingSubscription.reminderLeadDays ?? preferences.defaultReminderLeadDays)
      );
      setNotes(editingSubscription.notes || '');
      setAccentColor(editingSubscription.accentColor || ACCENT_PRESETS[0]);
    } else {
      setName('');
      setPrice('');
      setCurrency(preferences.defaultCurrency);
      setBillingInterval('monthly');
      setCustomIntervalDays('30');
      setNextRenewalDate(getTodayCalendarDate());
      setCategory('software');
      setStatus('active');
      setProviderUrl('');
      setStartDate('');
      setTrialEndDate('');
      setPlannedCancellationDate('');
      setPaymentMethodLabel('');
      setReminderLeadDays(String(preferences.defaultReminderLeadDays));
      setNotes('');
      setAccentColor(ACCENT_PRESETS[0]);
    }
  }, [isFormModalOpen, editingSubscription, preferences]);

  useEffect(() => {
    if (!isFormModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFormModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFormModalOpen, closeFormModal]);

  if (!isFormModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = t.form.validation.nameRequired;
    }

    const numericPrice = price.trim() === '' ? Number.NaN : Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      newErrors.price = t.form.validation.priceNegative;
    }

    if (!isValidCalendarDate(nextRenewalDate)) {
      newErrors.nextRenewalDate = t.form.validation.nextRenewalInvalid;
    }

    let parsedCustomDays: number | undefined = undefined;
    if (billingInterval === 'custom_days') {
      const n = Number(customIntervalDays);
      if (!Number.isInteger(n) || n <= 0) {
        newErrors.customIntervalDays = t.form.validation.customDaysInvalid;
      } else {
        parsedCustomDays = n;
      }
    }

    const urlValidation = normalizeAndValidateUrl(providerUrl);
    if (!urlValidation.isValid) {
      newErrors.providerUrl = t.form.validation.urlInvalid;
    }

    if (startDate.trim() && !isValidCalendarDate(startDate.trim())) {
      newErrors.startDate = t.form.validation.startDateInvalid;
    }

    if (trialEndDate.trim() && !isValidCalendarDate(trialEndDate.trim())) {
      newErrors.trialEndDate = t.form.validation.trialDateInvalid;
    }

    if (plannedCancellationDate.trim() && !isValidCalendarDate(plannedCancellationDate.trim())) {
      newErrors.plannedCancellationDate = t.form.validation.cancelDateInvalid;
    }

    let parsedReminderDays: number | undefined = undefined;
    if (reminderLeadDays.trim() !== '') {
      const r = Number(reminderLeadDays);
      if (!Number.isInteger(r) || r < 0 || r > 90) {
        newErrors.reminderLeadDays = t.form.validation.reminderInvalid;
      } else {
        parsedReminderDays = r;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: trimmedName,
      price: Math.round((numericPrice + Number.EPSILON) * 100) / 100,
      currency,
      billingInterval,
      customIntervalDays: parsedCustomDays,
      nextRenewalDate: nextRenewalDate.trim(),
      category,
      status,
      providerUrl: urlValidation.normalizedUrl,
      startDate: startDate.trim() || undefined,
      trialEndDate: trialEndDate.trim() || undefined,
      plannedCancellationDate: plannedCancellationDate.trim() || undefined,
      paymentMethodLabel: paymentMethodLabel.trim() || undefined,
      reminderLeadDays: parsedReminderDays,
      notes: notes.trim() || undefined,
      accentColor,
    };

    if (editingSubscription) {
      await updateSubscription({
        ...editingSubscription,
        ...payload,
        isDemo: editingSubscription.isDemo,
      });
    } else {
      await addSubscription(payload);
    }

    closeFormModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <h2
            id="subscription-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingSubscription ? t.form.editTitle : t.form.addTitle}
          </h2>
          <button
            type="button"
            onClick={closeFormModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label={t.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Primary Required Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="sub-name"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.nameLabel} <span className="text-emerald-500">*</span>
              </label>
              <input
                id="sub-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.form.namePlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sub-price"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.priceLabel} <span className="text-emerald-500">*</span>
              </label>
              <input
                id="sub-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sub-currency"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.currencyLabel} <span className="text-emerald-500">*</span>
              </label>
              <select
                id="sub-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sub-interval"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.billingIntervalLabel} <span className="text-emerald-500">*</span>
              </label>
              <select
                id="sub-interval"
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {BILLING_INTERVALS.map((interval) => (
                  <option key={interval} value={interval}>
                    {t.intervals[interval]}
                  </option>
                ))}
              </select>
            </div>

            {billingInterval === 'custom_days' ? (
              <div>
                <label
                  htmlFor="sub-custom-days"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  {t.form.customDaysLabel} <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="sub-custom-days"
                  type="number"
                  min="1"
                  step="1"
                  value={customIntervalDays}
                  onChange={(e) => setCustomIntervalDays(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.customIntervalDays && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.customIntervalDays}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="sub-next-renewal"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  {t.form.nextRenewalDateLabel} <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="sub-next-renewal"
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.nextRenewalDate && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.nextRenewalDate}</p>
                )}
              </div>
            )}

            {billingInterval === 'custom_days' && (
              <div>
                <label
                  htmlFor="sub-next-renewal-custom"
                  className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  {t.form.nextRenewalDateLabel} <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="sub-next-renewal-custom"
                  type="date"
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.nextRenewalDate && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.nextRenewalDate}</p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="sub-category"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.categoryLabel} <span className="text-emerald-500">*</span>
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {INITIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t.categories[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sub-status"
                className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
              >
                {t.form.statusLabel}
              </label>
              <select
                id="sub-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {SUBSCRIPTION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {t.statuses[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Dates & Details */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="sub-start-date"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  {t.form.startDateLabel} ({t.common.optional})
                </label>
                <input
                  id="sub-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sub-trial-date"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  {t.form.trialEndDateLabel} ({t.common.optional})
                </label>
                <input
                  id="sub-trial-date"
                  type="date"
                  value={trialEndDate}
                  onChange={(e) => setTrialEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.trialEndDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.trialEndDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sub-cancel-date"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  {t.form.plannedCancellationDateLabel} ({t.common.optional})
                </label>
                <input
                  id="sub-cancel-date"
                  type="date"
                  value={plannedCancellationDate}
                  onChange={(e) => setPlannedCancellationDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {errors.plannedCancellationDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.plannedCancellationDate}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sub-url"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                {t.form.providerUrlLabel} ({t.common.optional})
              </label>
              <input
                id="sub-url"
                type="url"
                value={providerUrl}
                onChange={(e) => setProviderUrl(e.target.value)}
                placeholder={t.form.providerUrlPlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              {errors.providerUrl && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.providerUrl}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sub-reminder"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                {t.form.reminderLeadDaysLabel}
              </label>
              <input
                id="sub-reminder"
                type="number"
                min="0"
                max="90"
                value={reminderLeadDays}
                onChange={(e) => setReminderLeadDays(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              {errors.reminderLeadDays && (
                <p className="mt-1 text-xs text-rose-500">{errors.reminderLeadDays}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="sub-payment-label"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              {t.form.paymentMethodLabel} ({t.common.optional})
            </label>
            <input
              id="sub-payment-label"
              type="text"
              maxLength={60}
              value={paymentMethodLabel}
              onChange={(e) => setPaymentMethodLabel(e.target.value)}
              placeholder={t.form.paymentMethodPlaceholder}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              {t.form.paymentMethodSecurityHint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-2">
              <label
                htmlFor="sub-notes"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                {t.form.notesLabel} ({t.common.optional})
              </label>
              <textarea
                id="sub-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.form.notesPlaceholder}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                {t.form.accentColorLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      accentColor === color
                        ? 'scale-110 border-slate-900 dark:border-white'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={closeFormModal}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
