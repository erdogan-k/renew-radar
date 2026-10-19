import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PREFERENCES,
  ManualExchangeRate,
  NavigationSection,
  SubscriptionRecord,
  UserPreferences,
} from '../types/subscription';
import {
  clearAllApplicationData,
  deleteSubscriptionRecord,
  loadAllSubscriptions,
  loadUserPreferences,
  saveMultipleSubscriptions,
  saveSubscriptionRecord,
  saveUserPreferences,
} from '../services/storage';
import { TRANSLATIONS, TranslationDictionary } from '../i18n/translations';
import { calculateNextBillingDate, getTodayCalendarDate, parseCalendarDate } from '../utils/dateUtils';
import { createDemoSubscriptions } from '../utils/demoData';
import { mergeSubscriptionRecords } from '../utils/backupUtils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
  undoAction?: () => void;
  undoLabel?: string;
}

interface AppContextValue {
  subscriptions: SubscriptionRecord[];
  preferences: UserPreferences;
  t: TranslationDictionary;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  isLoading: boolean;
  isSaving: boolean;
  storageWarning: string | null;
  toasts: ToastMessage[];
  showToast: (
    text: string,
    type?: ToastMessage['type'],
    undoAction?: () => void,
    undoLabel?: string
  ) => void;
  dismissToast: (id: string) => void;
  // Subscription CRUD
  addSubscription: (
    data: Omit<SubscriptionRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<SubscriptionRecord>;
  updateSubscription: (record: SubscriptionRecord) => Promise<void>;
  duplicateSubscription: (id: string) => Promise<void>;
  setSubscriptionStatus: (
    id: string,
    status: SubscriptionRecord['status'],
    plannedCancellationDate?: string
  ) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  markSubscriptionAsPaid: (id: string) => Promise<void>;
  undoMarkSubscriptionAsPaid: (id: string) => Promise<void>;
  // Demo Mode
  hasDemoRecords: boolean;
  hasRealRecords: boolean;
  loadDemoDataset: () => Promise<void>;
  removeDemoDataset: () => Promise<void>;
  // Preferences & Exchange Rates
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  upsertManualExchangeRate: (rate: ManualExchangeRate) => Promise<void>;
  removeManualExchangeRate: (fromCurrency: string, toCurrency: string) => Promise<void>;
  // Import & Reset
  importBackupRecords: (
    incoming: SubscriptionRecord[],
    mode: 'merge' | 'replace',
    duplicateStrategy: 'update_existing' | 'keep_both'
  ) => Promise<void>;
  resetApplication: () => Promise<void>;
  // Modal trigger helper
  openEditModal: (sub?: SubscriptionRecord) => void;
  editingSubscription: SubscriptionRecord | null;
  isFormModalOpen: boolean;
  closeFormModal: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeSection, setActiveSection] = useState<NavigationSection>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Global Add/Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionRecord | null>(null);

  const t = useMemo(() => TRANSLATIONS[preferences.language] || TRANSLATIONS.en, [preferences.language]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (
      text: string,
      type: ToastMessage['type'] = 'info',
      undoAction?: () => void,
      undoLabel?: string
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, text, undoAction, undoLabel }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 6000);
    },
    []
  );

  // Initial Load from IndexedDB
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const [{ records, usingFallback }, loadedPrefs] = await Promise.all([
          loadAllSubscriptions(),
          loadUserPreferences(),
        ]);
        if (!mounted) return;
        setSubscriptions(records);
        setPreferences(loadedPrefs);
        if (usingFallback) {
          setStorageWarning(
            'IndexedDB is restricted in this browser context; using local fallback storage.'
          );
        }
      } catch {
        if (mounted) {
          setStorageWarning('Could not initialize local storage cleanly.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Apply Dark / Light / System theme to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (preferences.theme === 'dark') {
      applyTheme(true);
      return;
    }
    if (preferences.theme === 'light') {
      applyTheme(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [preferences.theme]);

  const addSubscription = useCallback(
    async (data: Omit<SubscriptionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      setIsSaving(true);
      const nowIso = new Date().toISOString();
      const newRecord: SubscriptionRecord = {
        ...data,
        id: generateId(),
        isDemo: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      try {
        await saveSubscriptionRecord(newRecord);
        setSubscriptions((prev) => [newRecord, ...prev]);
        showToast(`${newRecord.name} — ${t.common.saved}`, 'success');
        return newRecord;
      } finally {
        setIsSaving(false);
      }
    },
    [showToast, t.common.saved]
  );

  const updateSubscription = useCallback(
    async (record: SubscriptionRecord) => {
      setIsSaving(true);
      const updated: SubscriptionRecord = {
        ...record,
        updatedAt: new Date().toISOString(),
      };
      try {
        await saveSubscriptionRecord(updated);
        setSubscriptions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showToast(`${updated.name} — ${t.common.saved}`, 'success');
      } finally {
        setIsSaving(false);
      }
    },
    [showToast, t.common.saved]
  );

  const duplicateSubscription = useCallback(
    async (id: string) => {
      const target = subscriptions.find((s) => s.id === id);
      if (!target) return;
      setIsSaving(true);
      const nowIso = new Date().toISOString();
      const copy: SubscriptionRecord = {
        ...target,
        id: generateId(),
        name: `${target.name} (Copy)`,
        isDemo: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      try {
        await saveSubscriptionRecord(copy);
        setSubscriptions((prev) => [copy, ...prev]);
        showToast(`${copy.name} — ${t.common.saved}`, 'success');
      } finally {
        setIsSaving(false);
      }
    },
    [subscriptions, showToast, t.common.saved]
  );

  const setSubscriptionStatus = useCallback(
    async (
      id: string,
      status: SubscriptionRecord['status'],
      plannedCancellationDate?: string
    ) => {
      const target = subscriptions.find((s) => s.id === id);
      if (!target) return;
      setIsSaving(true);
      const updated: SubscriptionRecord = {
        ...target,
        status,
        plannedCancellationDate:
          status === 'planned_cancellation'
            ? plannedCancellationDate ?? target.plannedCancellationDate
            : target.plannedCancellationDate,
        updatedAt: new Date().toISOString(),
      };
      try {
        await saveSubscriptionRecord(updated);
        setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
        showToast(`${updated.name} → ${t.statuses[status]}`, 'info');
      } finally {
        setIsSaving(false);
      }
    },
    [subscriptions, showToast, t.statuses]
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
      const target = subscriptions.find((s) => s.id === id);
      setIsSaving(true);
      try {
        await deleteSubscriptionRecord(id);
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        if (target) {
          showToast(`${target.name} deleted`, 'info');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [subscriptions, showToast]
  );

  const undoMarkSubscriptionAsPaid = useCallback(
    async (id: string) => {
      setSubscriptions((prev) => {
        const target = prev.find((s) => s.id === id);
        if (!target || !target.previousRenewalDateBeforeMarkPaid) return prev;
        const restoredDate = target.previousRenewalDateBeforeMarkPaid;
        const updated: SubscriptionRecord = {
          ...target,
          nextRenewalDate: restoredDate,
          previousRenewalDateBeforeMarkPaid: undefined,
          updatedAt: new Date().toISOString(),
        };
        saveSubscriptionRecord(updated);
        showToast(t.subscriptionsPage.undoSuccessToast(updated.name, restoredDate), 'info');
        return prev.map((s) => (s.id === id ? updated : s));
      });
    },
    [showToast, t.subscriptionsPage]
  );

  const markSubscriptionAsPaid = useCallback(
    async (id: string) => {
      const target = subscriptions.find((s) => s.id === id);
      if (!target) return;
      setIsSaving(true);

      const startParts = target.startDate ? parseCalendarDate(target.startDate) : null;
      const anchorDay = startParts?.day;
      const nextDate = calculateNextBillingDate(
        target.nextRenewalDate,
        target.billingInterval,
        target.customIntervalDays,
        anchorDay
      );

      const updated: SubscriptionRecord = {
        ...target,
        previousRenewalDateBeforeMarkPaid: target.nextRenewalDate,
        nextRenewalDate: nextDate,
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveSubscriptionRecord(updated);
        setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
        showToast(
          t.subscriptionsPage.paidUpdatedToast(updated.name, nextDate),
          'success',
          () => undoMarkSubscriptionAsPaid(id),
          t.common.undoMarkPaid
        );
      } finally {
        setIsSaving(false);
      }
    },
    [subscriptions, showToast, t.subscriptionsPage, t.common.undoMarkPaid, undoMarkSubscriptionAsPaid]
  );

  const hasDemoRecords = useMemo(() => subscriptions.some((s) => s.isDemo), [subscriptions]);
  const hasRealRecords = useMemo(() => subscriptions.some((s) => !s.isDemo), [subscriptions]);

  const loadDemoDataset = useCallback(async () => {
    setIsSaving(true);
    try {
      const demoItems = createDemoSubscriptions(getTodayCalendarDate());
      const merged = mergeSubscriptionRecords(subscriptions, demoItems, 'merge', 'update_existing');
      await saveMultipleSubscriptions(merged, false);
      setSubscriptions(merged);
      showToast(t.demoBanner.title, 'info');
    } finally {
      setIsSaving(false);
    }
  }, [subscriptions, showToast, t.demoBanner.title]);

  const removeDemoDataset = useCallback(async () => {
    setIsSaving(true);
    try {
      const demoIds = subscriptions.filter((s) => s.isDemo).map((s) => s.id);
      for (const id of demoIds) {
        await deleteSubscriptionRecord(id);
      }
      setSubscriptions((prev) => prev.filter((s) => !s.isDemo));
      showToast(t.common.clearDemoData, 'info');
    } finally {
      setIsSaving(false);
    }
  }, [subscriptions, showToast, t.common.clearDemoData]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      setIsSaving(true);
      const nextPrefs: UserPreferences = {
        ...preferences,
        ...patch,
      };
      try {
        await saveUserPreferences(nextPrefs);
        setPreferences(nextPrefs);
      } finally {
        setIsSaving(false);
      }
    },
    [preferences]
  );

  const upsertManualExchangeRate = useCallback(
    async (rate: ManualExchangeRate) => {
      const existing = preferences.manualExchangeRates.filter(
        (r) => !(r.fromCurrency === rate.fromCurrency && r.toCurrency === rate.toCurrency)
      );
      const updatedRates = [...existing, rate];
      await updatePreferences({ manualExchangeRates: updatedRates });
      showToast(`${rate.fromCurrency} → ${rate.toCurrency}: ${rate.rate}`, 'success');
    },
    [preferences.manualExchangeRates, updatePreferences, showToast]
  );

  const removeManualExchangeRate = useCallback(
    async (fromCurrency: string, toCurrency: string) => {
      const updatedRates = preferences.manualExchangeRates.filter(
        (r) => !(r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
      );
      await updatePreferences({ manualExchangeRates: updatedRates });
    },
    [preferences.manualExchangeRates, updatePreferences]
  );

  const importBackupRecords = useCallback(
    async (
      incoming: SubscriptionRecord[],
      mode: 'merge' | 'replace',
      duplicateStrategy: 'update_existing' | 'keep_both'
    ) => {
      setIsSaving(true);
      try {
        const finalRecords = mergeSubscriptionRecords(
          subscriptions,
          incoming,
          mode,
          duplicateStrategy
        );
        await saveMultipleSubscriptions(finalRecords, mode === 'replace');
        setSubscriptions(finalRecords);
        showToast(t.settingsPage.importSuccessToast(incoming.length), 'success');
      } finally {
        setIsSaving(false);
      }
    },
    [subscriptions, showToast, t.settingsPage]
  );

  const resetApplication = useCallback(async () => {
    setIsSaving(true);
    try {
      await clearAllApplicationData();
      setSubscriptions([]);
      setPreferences(DEFAULT_PREFERENCES);
      showToast('All local application data has been reset.', 'info');
    } finally {
      setIsSaving(false);
    }
  }, [showToast]);

  const openEditModal = useCallback((sub?: SubscriptionRecord) => {
    setEditingSubscription(sub || null);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingSubscription(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      subscriptions,
      preferences,
      t,
      activeSection,
      setActiveSection,
      isLoading,
      isSaving,
      storageWarning,
      toasts,
      showToast,
      dismissToast,
      addSubscription,
      updateSubscription,
      duplicateSubscription,
      setSubscriptionStatus,
      deleteSubscription,
      markSubscriptionAsPaid,
      undoMarkSubscriptionAsPaid,
      hasDemoRecords,
      hasRealRecords,
      loadDemoDataset,
      removeDemoDataset,
      updatePreferences,
      upsertManualExchangeRate,
      removeManualExchangeRate,
      importBackupRecords,
      resetApplication,
      openEditModal,
      editingSubscription,
      isFormModalOpen,
      closeFormModal,
    }),
    [
      subscriptions,
      preferences,
      t,
      activeSection,
      isLoading,
      isSaving,
      storageWarning,
      toasts,
      showToast,
      dismissToast,
      addSubscription,
      updateSubscription,
      duplicateSubscription,
      setSubscriptionStatus,
      deleteSubscription,
      markSubscriptionAsPaid,
      undoMarkSubscriptionAsPaid,
      hasDemoRecords,
      hasRealRecords,
      loadDemoDataset,
      removeDemoDataset,
      updatePreferences,
      upsertManualExchangeRate,
      removeManualExchangeRate,
      importBackupRecords,
      resetApplication,
      openEditModal,
      editingSubscription,
      isFormModalOpen,
      closeFormModal,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return ctx;
}
