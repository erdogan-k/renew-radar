import React from 'react';
import {
  Calendar,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Radar,
  Settings,
  Sparkles,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationSection } from './types/subscription';
import { DashboardPage } from './pages/DashboardPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SavingsPage } from './pages/SavingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscriptionFormModal } from './components/SubscriptionFormModal';
import { NotificationBanner } from './components/NotificationBanner';

const AppShell: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    t,
    preferences,
    updatePreferences,
    openEditModal,
    subscriptions,
    loadDemoDataset,
    isLoading,
    isSaving,
    storageWarning,
    toasts,
    dismissToast,
  } = useApp();

  const navItems: Array<{
    id: NavigationSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    {
      id: 'subscriptions',
      label: t.nav.subscriptions,
      icon: CreditCard,
      badge: subscriptions.filter(
        (s) => s.status === 'active' || s.status === 'planned_cancellation'
      ).length,
    },
    { id: 'calendar', label: t.nav.calendar, icon: Calendar },
    {
      id: 'savings',
      label: t.nav.savings,
      icon: PiggyBank,
      badge: subscriptions.filter((s) => s.status === 'planned_cancellation').length || undefined,
    },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const pageMeta: Record<NavigationSection, { title: string; subtitle: string }> = {
    dashboard: { title: t.dashboard.title, subtitle: t.dashboard.subtitle },
    subscriptions: {
      title: t.subscriptionsPage.title,
      subtitle: t.subscriptionsPage.subtitle,
    },
    calendar: { title: t.calendarPage.title, subtitle: t.calendarPage.subtitle },
    savings: { title: t.savingsPage.title, subtitle: t.savingsPage.subtitle },
    settings: { title: t.settingsPage.title, subtitle: t.settingsPage.subtitle },
  };

  const toggleQuickTheme = () => {
    const next = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: next });
  };

  const toggleQuickLanguage = () => {
    const next = preferences.language === 'en' ? 'tr' : 'en';
    updatePreferences({ language: next });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/70">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {t.appName}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Local-First Finance
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.2 text-[11px] font-mono font-semibold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{isSaving ? t.common.saving : t.common.saved}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleQuickLanguage}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 py-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {preferences.language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={toggleQuickTheme}
              aria-label={t.settingsPage.themeLabel}
              className="flex-1 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {preferences.theme === 'light' ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-400" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 sm:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                  <Radar className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {pageMeta[activeSection].title}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    {pageMeta[activeSection].subtitle}
                  </p>
                </div>
              </div>

              {/* Mobile quick controls */}
              <div className="flex lg:hidden items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleQuickLanguage}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-mono font-semibold"
                >
                  {preferences.language.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={toggleQuickTheme}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5"
                >
                  {preferences.theme === 'light' ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {subscriptions.length === 0 && (
                <button
                  type="button"
                  onClick={loadDemoDataset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {t.common.loadDemoData}
                </button>
              )}

              <button
                type="button"
                onClick={() => openEditModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                {t.common.addSubscription}
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          {storageWarning && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
              {storageWarning}
            </div>
          )}

          {isLoading ? (
            <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.common.loading}
            </div>
          ) : (
            <>
              <NotificationBanner />
              {activeSection === 'dashboard' && <DashboardPage />}
              {activeSection === 'subscriptions' && <SubscriptionsPage />}
              {activeSection === 'calendar' && <CalendarPage />}
              {activeSection === 'savings' && <SavingsPage />}
              {activeSection === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1.5"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center justify-center rounded-lg py-1.5 px-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Add/Edit Subscription Modal */}
      <SubscriptionFormModal />

      {/* Toast Notifications with Undo Support */}
      {toasts.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs text-slate-100 shadow-xl"
            >
              <span>{toast.text}</span>
              <div className="flex items-center gap-2 shrink-0">
                {toast.undoAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.undoAction?.();
                      dismissToast(toast.id);
                    }}
                    className="rounded bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    {toast.undoLabel || t.common.undoMarkPaid}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-white"
                  aria-label={t.common.close}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
