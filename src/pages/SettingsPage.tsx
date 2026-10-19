import React, { useRef, useState } from 'react';
import {
  Bell,
  Download,
  FileJson,
  Globe,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  BackupPayloadV1,
  CurrencyCode,
  DateFormatPreference,
  LanguageCode,
  SUPPORTED_CURRENCIES,
  ThemePreference,
  WeekStartDay,
} from '../types/subscription';
import { CURRENT_SCHEMA_VERSION } from '../services/storage';
import { BackupValidationResult, validateBackupJson } from '../utils/backupUtils';
import { getTodayCalendarDate } from '../utils/dateUtils';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const {
    subscriptions,
    preferences,
    t,
    updatePreferences,
    upsertManualExchangeRate,
    removeManualExchangeRate,
    importBackupRecords,
    resetApplication,
    showToast,
  } = useApp();

  // Manual exchange rate form state
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('TRY');
  const [rateValue, setRateValue] = useState<string>('');
  const [rateNote, setRateNote] = useState<string>('');

  // Backup Import state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importValidation, setImportValidation] = useState<BackupValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update_existing' | 'keep_both'>(
    'update_existing'
  );
  const [isConfirmingReplaceImport, setIsConfirmingReplaceImport] = useState(false);

  // Reset confirmation dialog state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleAddManualRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromCurrency === toCurrency) return;
    const numeric = Number(rateValue);
    if (!Number.isFinite(numeric) || numeric <= 0) return;

    await upsertManualExchangeRate({
      fromCurrency,
      toCurrency,
      rate: Math.round((numeric + Number.EPSILON) * 10000) / 10000,
      updatedAt: getTodayCalendarDate(),
      note: rateNote.trim() || undefined,
    });
    setRateValue('');
    setRateNote('');
  };

  const handleExportAll = () => {
    const payload: BackupPayloadV1 = {
      app: 'RenewRadar',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      subscriptions,
      preferences,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewradar-backup-${getTodayCalendarDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const existingIds = new Set(subscriptions.map((s) => s.id));
      const result = validateBackupJson(text, existingIds);
      setImportValidation(result);
    } catch {
      setImportValidation({
        isValid: false,
        errors: ['Could not read the selected file.'],
        recordCount: 0,
        duplicateIdCount: 0,
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const executeImport = async () => {
    if (!importValidation?.isValid || !importValidation.payload) return;
    await importBackupRecords(
      importValidation.payload.subscriptions,
      importMode,
      duplicateStrategy
    );
    setImportValidation(null);
    setIsConfirmingReplaceImport(false);
  };

  const handleRequestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(t.notifications.permissionDenied, 'warning');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await updatePreferences({ browserNotificationsEnabled: true });
      showToast(t.notifications.permissionGranted, 'success');
      try {
        new Notification('RenewRadar', {
          body: t.notifications.testAlertSent,
        });
      } catch {
        // Ignore notification constructor error in restricted contexts
      }
    } else {
      await updatePreferences({ browserNotificationsEnabled: false });
      showToast(t.notifications.permissionDenied, 'warning');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Interface & Regional Preferences */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Globe className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settingsPage.preferencesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="pref-language"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.languageLabel}
            </label>
            <select
              id="pref-language"
              value={preferences.language}
              onChange={(e) => updatePreferences({ language: e.target.value as LanguageCode })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="en">English (EN)</option>
              <option value="tr">Türkçe (TR)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="pref-theme"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.themeLabel}
            </label>
            <select
              id="pref-theme"
              value={preferences.theme}
              onChange={(e) => updatePreferences({ theme: e.target.value as ThemePreference })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="dark">{t.settingsPage.themeDark}</option>
              <option value="light">{t.settingsPage.themeLight}</option>
              <option value="system">{t.settingsPage.themeSystem}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="pref-default-currency"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.defaultCurrencyLabel}
            </label>
            <select
              id="pref-default-currency"
              value={preferences.defaultCurrency}
              onChange={(e) =>
                updatePreferences({ defaultCurrency: e.target.value as CurrencyCode })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
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
              htmlFor="pref-display-currency"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.preferredDisplayCurrencyLabel}
            </label>
            <select
              id="pref-display-currency"
              value={preferences.preferredDisplayCurrency || 'ORIGINAL'}
              onChange={(e) =>
                updatePreferences({
                  preferredDisplayCurrency: e.target.value as CurrencyCode | 'ORIGINAL',
                })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="ORIGINAL">{t.common.originalCurrency}</option>
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr} (Manual Rate Estimate)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="pref-date-format"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.dateFormatLabel}
            </label>
            <select
              id="pref-date-format"
              value={preferences.dateFormat}
              onChange={(e) =>
                updatePreferences({ dateFormat: e.target.value as DateFormatPreference })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-25)</option>
              <option value="DD.MM.YYYY">DD.MM.YYYY (25.10.2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (10/25/2026)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="pref-week-start"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.weekStartLabel}
            </label>
            <select
              id="pref-week-start"
              value={preferences.weekStart}
              onChange={(e) => updatePreferences({ weekStart: e.target.value as WeekStartDay })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="monday">{t.settingsPage.weekStartMonday}</option>
              <option value="sunday">{t.settingsPage.weekStartSunday}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="pref-reminder-days"
              className="block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              {t.settingsPage.defaultReminderLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pref-reminder-days"
                type="number"
                min="0"
                max="60"
                value={preferences.defaultReminderLeadDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (Number.isInteger(val) && val >= 0 && val <= 60) {
                    updatePreferences({ defaultReminderLeadDays: val });
                  }
                }}
                className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-500">{t.settingsPage.daysBefore}</span>
            </div>
          </div>
        </div>

        {/* Browser Notifications Explicit Action */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              <Bell className="h-4 w-4 text-amber-500" />
              <span>{t.notifications.bannerTitle}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.notifications.browserPermissionNote}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestBrowserNotifications}
            className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t.notifications.enableBrowserAlerts}
          </button>
        </div>
      </div>

      {/* 2. Optional User-Provided Manual Exchange Rates */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settingsPage.exchangeRatesTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.settingsPage.exchangeRatesSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleAddManualRate}
          className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t.settingsPage.fromCurrency}
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t.settingsPage.toCurrency}
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t.settingsPage.rateValueLabel}
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value)}
              placeholder="34.50"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t.settingsPage.rateNoteLabel}
            </label>
            <input
              type="text"
              value={rateNote}
              onChange={(e) => setRateNote(e.target.value)}
              placeholder="Oct 2026 personal ref"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={fromCurrency === toCurrency || !rateValue}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 disabled:opacity-40 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            {t.settingsPage.addRateButton}
          </button>
        </form>

        {preferences.manualExchangeRates.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
            {t.settingsPage.noManualRates}
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 pt-2">
            {preferences.manualExchangeRates.map((r) => (
              <div
                key={`${r.fromCurrency}-${r.toCurrency}`}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    1 {r.fromCurrency} = {r.rate} {r.toCurrency}
                  </span>
                  <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    User-provided ({r.updatedAt})
                  </span>
                  {r.note && <span className="text-slate-500">— {r.note}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => removeManualExchangeRate(r.fromCurrency, r.toCurrency)}
                  className="text-rose-500 hover:underline"
                >
                  {t.common.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. JSON Backup, Export & Restore */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <FileJson className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.settingsPage.backupTitle}
          </h2>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {t.settingsPage.backupRecommendation}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <Download className="h-4 w-4" />
            {t.settingsPage.exportAllButton} ({subscriptions.length})
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t.settingsPage.importBackupButton}
          </button>
        </div>

        {/* Validation & Import Preview Box */}
        {importValidation && (
          <div
            className={`mt-4 rounded-xl border p-4 space-y-3 ${
              importValidation.isValid
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-rose-500/30 bg-rose-500/10'
            }`}
          >
            {!importValidation.isValid ? (
              <div className="space-y-1 text-xs text-rose-600 dark:text-rose-400">
                <p className="font-semibold">Import Validation Failed:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {importValidation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {t.settingsPage.importPreviewTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {t.settingsPage.importRecordCount(importValidation.recordCount)} •{' '}
                    {t.settingsPage.importDuplicateCount(importValidation.duplicateIdCount)}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Import Mode:
                    </span>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      <option value="merge">{t.settingsPage.importModeMerge}</option>
                      <option value="replace">{t.settingsPage.importModeReplace}</option>
                    </select>
                  </div>

                  {importMode === 'merge' && importValidation.duplicateIdCount > 0 && (
                    <div>
                      <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Duplicate ID Handling:
                      </span>
                      <select
                        value={duplicateStrategy}
                        onChange={(e) =>
                          setDuplicateStrategy(
                            e.target.value as 'update_existing' | 'keep_both'
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                      >
                        <option value="update_existing">
                          {t.settingsPage.duplicateUpdateExisting}
                        </option>
                        <option value="keep_both">{t.settingsPage.duplicateKeepBoth}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (importMode === 'replace' && subscriptions.length > 0) {
                        setIsConfirmingReplaceImport(true);
                      } else {
                        executeImport();
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    {t.settingsPage.confirmImportButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportValidation(null)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Privacy Architecture & Local Storage Notice */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="text-sm font-semibold">{t.settingsPage.storageAndPrivacyTitle}</h2>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {t.settingsPage.storageAndPrivacyBody}
        </p>
        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
          <Lock className="h-3.5 w-3.5" />
          <span>IndexedDB Schema Version: v{CURRENT_SCHEMA_VERSION}</span>
        </div>
      </div>

      {/* 5. Danger Zone: Reset All Data */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          {t.settingsPage.dangerZoneTitle}
        </h2>
        <button
          type="button"
          onClick={() => setIsResetDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {t.settingsPage.resetAllDataButton}
        </button>
      </div>

      {/* Confirm Replace Mode on Import */}
      <ConfirmDialog
        isOpen={isConfirmingReplaceImport}
        title={t.settingsPage.importModeReplace}
        message={t.settingsPage.resetConfirmMessage}
        confirmLabel={t.settingsPage.confirmImportButton}
        cancelLabel={t.common.cancel}
        variant="danger"
        onConfirm={executeImport}
        onCancel={() => setIsConfirmingReplaceImport(false)}
      />

      {/* Confirm Full Application Reset */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title={t.settingsPage.resetConfirmTitle}
        message={t.settingsPage.resetConfirmMessage}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        variant="danger"
        onConfirm={async () => {
          await resetApplication();
          setIsResetDialogOpen(false);
        }}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
};
