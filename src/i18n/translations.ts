import {
  BillingInterval,
  LanguageCode,
  SubscriptionCategory,
  SubscriptionStatus,
} from '../types/subscription';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  nav: {
    dashboard: string;
    subscriptions: string;
    calendar: string;
    savings: string;
    settings: string;
  };
  common: {
    addSubscription: string;
    loadDemoData: string;
    clearDemoData: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    duplicate: string;
    archive: string;
    restore: string;
    confirm: string;
    close: string;
    clearAllFilters: string;
    searchPlaceholder: string;
    loading: string;
    saving: string;
    saved: string;
    allCurrencies: string;
    allCategories: string;
    allStatuses: string;
    allIntervals: string;
    originalCurrency: string;
    demoBadge: string;
    today: string;
    daysLeft: (days: number) => string;
    overdueBy: (days: number) => string;
    dueToday: string;
    dueTomorrow: string;
    exportJson: string;
    exportSingleRecord: string;
    markAsPaid: string;
    undoMarkPaid: string;
    openProvider: string;
    noNotes: string;
    optional: string;
    required: string;
    actions: string;
  };
  categories: Record<SubscriptionCategory, string>;
  intervals: Record<BillingInterval, string>;
  statuses: Record<SubscriptionStatus, string>;
  demoBanner: {
    title: string;
    description: string;
    removeDemoButton: string;
  };
  notifications: {
    bannerTitle: string;
    overdueCount: (count: number) => string;
    dueSoonCount: (count: number) => string;
    trialsEndingCount: (count: number) => string;
    browserPermissionNote: string;
    enableBrowserAlerts: string;
    permissionDenied: string;
    permissionGranted: string;
    testAlertSent: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    assumptionsNote: string;
    metrics: {
      monthlyRecurring: string;
      annualRecurring: string;
      activeCount: string;
      dueNext7Days: string;
      trialsEndingSoon: string;
      potentialAnnualSavings: string;
      noActiveSpend: string;
      acrossCurrencies: (count: number) => string;
      plannedCancelCount: (count: number) => string;
      within14Days: string;
      hypotheticalEstimate: string;
    };
    upcoming: {
      title: string;
      subtitle: string;
      filter7d: string;
      filter30d: string;
      filter90d: string;
      filterAll: string;
      emptyFiltered: string;
      trialEndsLabel: string;
    };
    categoryChart: {
      title: string;
      subtitle: string;
      currencySelectorLabel: string;
      emptyChart: string;
      monthlyNormalized: string;
      annualNormalized: string;
    };
    projectionChart: {
      title: string;
      subtitle: string;
      assumptionsDisclaimer: string;
      includePlannedCancelToggle: string;
      emptyProjection: string;
    };
    emptyState: {
      title: string;
      description: string;
      privacyPoint: string;
    };
    manualRateEstimate: {
      title: string;
      badge: string;
      disclaimer: string;
    };
  };
  subscriptionsPage: {
    title: string;
    subtitle: string;
    sortByLabel: string;
    sortName: string;
    sortAmount: string;
    sortNextRenewal: string;
    sortUpdated: string;
    upcomingFilterLabel: string;
    upcomingAll: string;
    upcoming7d: string;
    upcoming30d: string;
    upcomingOverdue: string;
    showingCount: (shown: number, total: number) => string;
    emptyMatching: string;
    tableHeaders: {
      service: string;
      category: string;
      billing: string;
      normalizedMonthly: string;
      nextRenewal: string;
      status: string;
      actions: string;
    };
    paidUpdatedToast: (name: string, nextDate: string) => string;
    undoSuccessToast: (name: string, restoredDate: string) => string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: (name: string) => string;
  };
  form: {
    addTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    priceLabel: string;
    currencyLabel: string;
    billingIntervalLabel: string;
    customDaysLabel: string;
    nextRenewalDateLabel: string;
    categoryLabel: string;
    statusLabel: string;
    providerUrlLabel: string;
    providerUrlPlaceholder: string;
    startDateLabel: string;
    trialEndDateLabel: string;
    plannedCancellationDateLabel: string;
    paymentMethodLabel: string;
    paymentMethodPlaceholder: string;
    paymentMethodSecurityHint: string;
    reminderLeadDaysLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    accentColorLabel: string;
    validation: {
      nameRequired: string;
      priceNegative: string;
      nextRenewalInvalid: string;
      customDaysInvalid: string;
      urlInvalid: string;
      startDateInvalid: string;
      trialDateInvalid: string;
      cancelDateInvalid: string;
      reminderInvalid: string;
    };
  };
  calendarPage: {
    title: string;
    subtitle: string;
    prevMonth: string;
    nextMonth: string;
    returnToCurrentMonth: string;
    selectedDateTitle: (dateStr: string) => string;
    dailyTotalsLabel: string;
    noEventsOnDate: string;
    renewalEventBadge: string;
    trialEndingBadge: string;
    plannedCancelBadge: string;
    mobileAgendaTitle: string;
    weekdaysMonStart: string[];
    weekdaysSunStart: string[];
    months: string[];
  };
  savingsPage: {
    title: string;
    subtitle: string;
    hypotheticalNoticeTitle: string;
    hypotheticalNoticeBody: string;
    cards: {
      currentActiveSpend: string;
      plannedMonthlySavings: string;
      plannedAnnualSavings: string;
      postCancelSpend: string;
    };
    plannedListTitle: string;
    plannedListEmpty: string;
    candidatesTitle: string;
    candidatesSubtitle: string;
    markForCancellation: string;
    keepActive: string;
    markCancelledCompleted: string;
    localRecordOnlyHint: string;
    targetCancelDateLabel: string;
    historyTitle: string;
    historyEmpty: string;
  };
  settingsPage: {
    title: string;
    subtitle: string;
    preferencesTitle: string;
    languageLabel: string;
    themeLabel: string;
    themeDark: string;
    themeLight: string;
    themeSystem: string;
    defaultCurrencyLabel: string;
    preferredDisplayCurrencyLabel: string;
    dateFormatLabel: string;
    weekStartLabel: string;
    weekStartMonday: string;
    weekStartSunday: string;
    defaultReminderLabel: string;
    daysBefore: string;
    exchangeRatesTitle: string;
    exchangeRatesSubtitle: string;
    addRateButton: string;
    fromCurrency: string;
    toCurrency: string;
    rateValueLabel: string;
    rateNoteLabel: string;
    noManualRates: string;
    backupTitle: string;
    backupRecommendation: string;
    exportAllButton: string;
    importBackupButton: string;
    importPreviewTitle: string;
    importRecordCount: (count: number) => string;
    importDuplicateCount: (count: number) => string;
    importModeMerge: string;
    importModeReplace: string;
    duplicateKeepBoth: string;
    duplicateUpdateExisting: string;
    confirmImportButton: string;
    importSuccessToast: (count: number) => string;
    storageAndPrivacyTitle: string;
    storageAndPrivacyBody: string;
    dangerZoneTitle: string;
    resetAllDataButton: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'RenewRadar',
    appTagline: 'Local-First Subscription & Renewal Tracker',
    nav: {
      dashboard: 'Dashboard',
      subscriptions: 'Subscriptions',
      calendar: 'Calendar',
      savings: 'Savings Planner',
      settings: 'Settings',
    },
    common: {
      addSubscription: 'Add Subscription',
      loadDemoData: 'Load Demo Dataset',
      clearDemoData: 'Remove Demo Data',
      save: 'Save Changes',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      duplicate: 'Duplicate',
      archive: 'Archive',
      restore: 'Restore',
      confirm: 'Confirm',
      close: 'Close',
      clearAllFilters: 'Clear All Filters',
      searchPlaceholder: 'Search by service name or notes...',
      loading: 'Loading local database...',
      saving: 'Saving to IndexedDB...',
      saved: 'All changes saved locally',
      allCurrencies: 'All Currencies',
      allCategories: 'All Categories',
      allStatuses: 'All Statuses',
      allIntervals: 'All Intervals',
      originalCurrency: 'Original Currency (No Conversion)',
      demoBadge: 'DEMO',
      today: 'Today',
      daysLeft: (days: number) => (days === 1 ? 'In 1 day' : `In ${days} days`),
      overdueBy: (days: number) =>
        Math.abs(days) === 1 ? 'Overdue by 1 day' : `Overdue by ${Math.abs(days)} days`,
      dueToday: 'Due today',
      dueTomorrow: 'Due tomorrow',
      exportJson: 'Export JSON',
      exportSingleRecord: 'Export Record JSON',
      markAsPaid: 'Advance Cycle (Paid)',
      undoMarkPaid: 'Undo Advance',
      openProvider: 'Open provider website',
      noNotes: 'No notes added',
      optional: 'Optional',
      required: 'Required',
      actions: 'Actions',
    },
    categories: {
      streaming: 'Streaming',
      software: 'Software',
      gaming: 'Gaming',
      cloud_storage: 'Cloud Storage',
      internet_phone: 'Internet & Phone',
      fitness: 'Fitness',
      education: 'Education',
      hosting_domains: 'Hosting & Domains',
      utilities: 'Utilities',
      other: 'Other',
    },
    intervals: {
      weekly: 'Weekly',
      monthly: 'Monthly',
      every_3_months: 'Every 3 Months',
      every_6_months: 'Every 6 Months',
      yearly: 'Yearly',
      custom_days: 'Custom (Days)',
    },
    statuses: {
      active: 'Active',
      planned_cancellation: 'Planned for Cancellation',
      cancelled: 'Cancelled',
      archived: 'Archived',
    },
    demoBanner: {
      title: 'Viewing Sample Demo Subscriptions',
      description:
        'Demo records are marked with a DEMO badge so you can explore charts, calendars, and multi-currency calculations safely. Remove them anytime with one click.',
      removeDemoButton: 'Remove All Demo Records',
    },
    notifications: {
      bannerTitle: 'Renewal & Trial Radar Alerts',
      overdueCount: (count: number) =>
        count === 1 ? '1 overdue renewal date needs review' : `${count} overdue renewal dates need review`,
      dueSoonCount: (count: number) =>
        count === 1 ? '1 payment due within reminder window' : `${count} payments due within reminder window`,
      trialsEndingCount: (count: number) =>
        count === 1 ? '1 free trial ending soon' : `${count} free trials ending soon`,
      browserPermissionNote:
        'In-app reminders work automatically whenever RenewRadar is open. Browser notifications only trigger while the browser is running and cannot fire when your device or browser is closed.',
      enableBrowserAlerts: 'Request Browser Notification Permission',
      permissionDenied: 'Browser notification permission was denied by your browser settings.',
      permissionGranted: 'Browser notifications enabled while application tab is open.',
      testAlertSent: 'Test notification sent.',
    },
    dashboard: {
      title: 'Financial Overview',
      subtitle: 'Real-time recurring commitment analysis from your local device storage.',
      assumptionsNote:
        'Calculation Basis: Weekly (×52/12), Every 3 Months (÷3), Every 6 Months (÷6), Yearly (÷12), Custom d Days (×365.2425/d/12). Currencies are strictly separated and never summed without explicit user-entered manual rates.',
      metrics: {
        monthlyRecurring: 'Est. Monthly Recurring',
        annualRecurring: 'Est. Annual Commitment',
        activeCount: 'Active Subscriptions',
        dueNext7Days: 'Due in Next 7 Days',
        trialsEndingSoon: 'Trials Ending Soon',
        potentialAnnualSavings: 'Potential Annual Savings',
        noActiveSpend: 'No active subscriptions',
        acrossCurrencies: (count: number) =>
          count === 1 ? '1 active currency' : `Isolated across ${count} currencies`,
        plannedCancelCount: (count: number) =>
          count === 0 ? 'None planned to cancel' : `Includes ${count} planned to cancel`,
        within14Days: 'Expiring within 14 days',
        hypotheticalEstimate: 'Hypothetical if planned cancellations complete',
      },
      upcoming: {
        title: 'Upcoming Renewals',
        subtitle: 'Nearest scheduled billing events for active subscriptions.',
        filter7d: 'Next 7 Days',
        filter30d: 'Next 30 Days',
        filter90d: 'Next 90 Days',
        filterAll: 'All Upcoming',
        emptyFiltered: 'No renewals scheduled within this timeframe.',
        trialEndsLabel: 'Trial ends',
      },
      categoryChart: {
        title: 'Spending by Category',
        subtitle: 'Normalized monthly cost breakdown per currency.',
        currencySelectorLabel: 'Currency filter',
        emptyChart: 'No active subscriptions for the selected currency.',
        monthlyNormalized: 'Monthly Normalized',
        annualNormalized: 'Annual Normalized',
      },
      projectionChart: {
        title: '12-Month Cash-Flow Projection',
        subtitle: 'Deterministic monthly billing schedule based on renewal dates and intervals.',
        assumptionsDisclaimer:
          'Projections assume current subscription prices and renewal intervals remain unchanged over the next 12 months.',
        includePlannedCancelToggle: 'Stop after planned cancellation dates',
        emptyProjection: 'Add active subscriptions to view your 12-month billing projection.',
      },
      emptyState: {
        title: 'Your subscription radar is empty',
        description:
          'Track recurring bills, free trial expiration dates, and multi-currency commitments without creating an account or connecting bank credentials.',
        privacyPoint: '100% Local IndexedDB Storage • Zero Tracking • Offline-Ready',
      },
      manualRateEstimate: {
        title: 'User-Provided Manual Conversion Estimate',
        badge: 'USER MANUAL RATE ESTIMATE',
        disclaimer:
          'Calculated using your manually entered exchange rates in Settings. Not a live market rate.',
      },
    },
    subscriptionsPage: {
      title: 'Subscriptions Directory',
      subtitle: 'Manage, filter, advance billing cycles, or export individual subscription records.',
      sortByLabel: 'Sort by',
      sortName: 'Name (A–Z)',
      sortAmount: 'Monthly Cost (High–Low)',
      sortNextRenewal: 'Nearest Renewal Date',
      sortUpdated: 'Recently Updated',
      upcomingFilterLabel: 'Renewal window',
      upcomingAll: 'Any Renewal Date',
      upcoming7d: 'Due in ≤ 7 Days',
      upcoming30d: 'Due in ≤ 30 Days',
      upcomingOverdue: 'Overdue Only',
      showingCount: (shown: number, total: number) => `Showing ${shown} of ${total} records`,
      emptyMatching: 'No subscriptions match your current search and filter criteria.',
      tableHeaders: {
        service: 'Subscription',
        category: 'Category',
        billing: 'Billing Cycle',
        normalizedMonthly: 'Est. Monthly',
        nextRenewal: 'Next Renewal',
        status: 'Status',
        actions: 'Actions',
      },
      paidUpdatedToast: (name: string, nextDate: string) =>
        `Advanced "${name}" to next renewal date: ${nextDate}`,
      undoSuccessToast: (name: string, restoredDate: string) =>
        `Reverted "${name}" renewal date back to ${restoredDate}`,
      deleteConfirmTitle: 'Delete Subscription Permanently?',
      deleteConfirmMessage: (name: string) =>
        `Are you sure you want to permanently delete "${name}"? If you want to keep it for historical reference without counting it in active spending, consider archiving it instead.`,
    },
    form: {
      addTitle: 'Add Subscription',
      editTitle: 'Edit Subscription',
      nameLabel: 'Service Name',
      namePlaceholder: 'e.g., Netflix, GitHub Copilot, iCloud+',
      priceLabel: 'Billing Amount',
      currencyLabel: 'Currency',
      billingIntervalLabel: 'Billing Interval',
      customDaysLabel: 'Custom Cycle Length (Days)',
      nextRenewalDateLabel: 'Next Renewal Date',
      categoryLabel: 'Category',
      statusLabel: 'Current Status',
      providerUrlLabel: 'Provider Website / Billing URL',
      providerUrlPlaceholder: 'https://example.com/account',
      startDateLabel: 'Start Date',
      trialEndDateLabel: 'Free Trial End Date',
      plannedCancellationDateLabel: 'Target Cancellation Date',
      paymentMethodLabel: 'Payment Method Label',
      paymentMethodPlaceholder: 'e.g., Virtual Card ••42 (Label only)',
      paymentMethodSecurityHint:
        'Never enter full credit card numbers, CVV codes, or passwords. Use a nickname only.',
      reminderLeadDaysLabel: 'Reminder Lead Time (Days Before)',
      notesLabel: 'Notes',
      notesPlaceholder: 'Plan tier, shared family members, cancellation steps...',
      accentColorLabel: 'Accent Tag Color',
      validation: {
        nameRequired: 'Service name cannot be empty.',
        priceNegative: 'Price must be a valid non-negative number (0 or greater).',
        nextRenewalInvalid: 'Please enter a valid next renewal date (YYYY-MM-DD).',
        customDaysInvalid: 'Custom billing interval must be a positive integer (e.g., 14 or 45).',
        urlInvalid: 'Please enter a valid http:// or https:// website URL.',
        startDateInvalid: 'Start date must be a valid calendar date.',
        trialDateInvalid: 'Free trial end date must be a valid calendar date.',
        cancelDateInvalid: 'Planned cancellation date must be a valid calendar date.',
        reminderInvalid: 'Reminder lead time must be an integer between 0 and 90 days.',
      },
    },
    calendarPage: {
      title: 'Renewal Calendar',
      subtitle: 'Inspect scheduled billing occurrences and trial expirations day by day.',
      prevMonth: 'Previous Month',
      nextMonth: 'Next Month',
      returnToCurrentMonth: 'Current Month',
      selectedDateTitle: (dateStr: string) => `Events on ${dateStr}`,
      dailyTotalsLabel: 'Scheduled Daily Totals (by Currency)',
      noEventsOnDate: 'No renewals or trial expirations scheduled on this date.',
      renewalEventBadge: 'Renewal',
      trialEndingBadge: 'Trial Ends',
      plannedCancelBadge: 'Planned Cancel',
      mobileAgendaTitle: 'Monthly Renewal Agenda',
      weekdaysMonStart: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      weekdaysSunStart: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    },
    savingsPage: {
      title: 'Savings Planner',
      subtitle: 'Evaluate hypothetical recurring savings by flagging underused subscriptions for cancellation.',
      hypotheticalNoticeTitle: 'Important: Hypothetical Savings & Local Tracking Only',
      hypotheticalNoticeBody:
        'Marking a subscription as "Planned for Cancellation" or "Cancelled" in RenewRadar only updates your local tracker. It does NOT contact the provider or cancel your actual billing agreement. Subscriptions planned for cancellation remain counted in current active spending until you confirm cancellation is complete.',
      cards: {
        currentActiveSpend: 'Current Active Monthly Spend',
        plannedMonthlySavings: 'Hypothetical Monthly Savings',
        plannedAnnualSavings: 'Hypothetical Annual Savings',
        postCancelSpend: 'Est. Post-Cancellation Spend',
      },
      plannedListTitle: 'Subscriptions Planned for Cancellation',
      plannedListEmpty:
        'No subscriptions are currently marked as Planned for Cancellation. Select candidates below to model your savings.',
      candidatesTitle: 'Active Subscriptions (Cancellation Candidates)',
      candidatesSubtitle: 'Flag any active service below to immediately see its impact on your annual savings.',
      markForCancellation: 'Plan to Cancel',
      keepActive: 'Keep Active',
      markCancelledCompleted: 'Mark Cancellation Completed (Local Only)',
      localRecordOnlyHint: 'Updates local status to Cancelled and excludes from active spend.',
      targetCancelDateLabel: 'Target cancel date',
      historyTitle: 'Cancelled & Archived History',
      historyEmpty: 'No cancelled or archived subscriptions yet.',
    },
    settingsPage: {
      title: 'Settings & Data Management',
      subtitle: 'Configure localization, display preferences, manual exchange rates, and JSON backups.',
      preferencesTitle: 'Interface & Regional Preferences',
      languageLabel: 'Interface Language',
      themeLabel: 'Color Theme',
      themeDark: 'Dark (Slate)',
      themeLight: 'Light',
      themeSystem: 'System Default',
      defaultCurrencyLabel: 'Default Currency for New Records',
      preferredDisplayCurrencyLabel: 'Preferred Estimate Display Currency',
      dateFormatLabel: 'Date Display Format',
      weekStartLabel: 'Calendar Week Starts On',
      weekStartMonday: 'Monday',
      weekStartSunday: 'Sunday',
      defaultReminderLabel: 'Default Renewal Reminder Lead Time',
      daysBefore: 'days before renewal',
      exchangeRatesTitle: 'Optional Manual Exchange Rates (User-Provided)',
      exchangeRatesSubtitle:
        'RenewRadar never uses fabricated exchange rates or hidden APIs. If you want optional converted estimates on individual cards or the dashboard, enter your own reference rates below.',
      addRateButton: 'Save Manual Rate',
      fromCurrency: 'From',
      toCurrency: 'To',
      rateValueLabel: 'Exchange Rate (1 From = X To)',
      rateNoteLabel: 'Context / Date Note',
      noManualRates: 'No manual exchange rates configured. Currencies are displayed strictly in their original amounts.',
      backupTitle: 'JSON Backup, Export & Restore',
      backupRecommendation:
        'Backup Recommendation: Because all data lives exclusively in your browser’s local IndexedDB storage, clearing browser site data or switching devices will not automatically transfer your subscriptions. Export a JSON backup regularly.',
      exportAllButton: 'Export Full JSON Backup',
      importBackupButton: 'Select Backup JSON File...',
      importPreviewTitle: 'Backup File Validated — Ready to Import',
      importRecordCount: (count: number) => `${count} valid subscription record(s) found in file.`,
      importDuplicateCount: (count: number) =>
        count === 0
          ? 'No duplicate IDs detected against your current library.'
          : `${count} record(s) share an ID with existing subscriptions in your library.`,
      importModeMerge: 'Merge with existing library (Safe)',
      importModeReplace: 'Replace entire library (Destructive)',
      duplicateKeepBoth: 'Keep both records (Assign new ID to imported duplicates)',
      duplicateUpdateExisting: 'Update existing records with matching ID',
      confirmImportButton: 'Execute Import',
      importSuccessToast: (count: number) => `Successfully imported ${count} subscription record(s).`,
      storageAndPrivacyTitle: 'Privacy Architecture & Local Storage Notice',
      storageAndPrivacyBody:
        'RenewRadar runs 100% client-side in your browser using IndexedDB (Schema v1). Zero analytics, zero telemetry, zero remote servers, and no external API requests are ever made with your financial records.',
      dangerZoneTitle: 'Reset Application Data',
      resetAllDataButton: 'Erase All Local Data & Reset',
      resetConfirmTitle: 'Erase All Local Subscriptions & Settings?',
      resetConfirmMessage:
        'This action will permanently remove all subscriptions and reset preferences in this browser. Make sure you have exported a JSON backup first.',
    },
  },
  tr: {
    appName: 'RenewRadar',
    appTagline: 'Yerel Öncelikli Abonelik ve Yenileme Takipçisi',
    nav: {
      dashboard: 'Gösterge Paneli',
      subscriptions: 'Abonelikler',
      calendar: 'Takvim',
      savings: 'Tasarruf Planlayıcı',
      settings: 'Ayarlar',
    },
    common: {
      addSubscription: 'Abonelik Ekle',
      loadDemoData: 'Örnek Veri Yükle',
      clearDemoData: 'Örnek Verileri Kaldır',
      save: 'Değişiklikleri Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
      edit: 'Düzenle',
      duplicate: 'Çoğalt',
      archive: 'Arşivle',
      restore: 'Geri Yükle',
      confirm: 'Onayla',
      close: 'Kapat',
      clearAllFilters: 'Tüm Filtreleri Temizle',
      searchPlaceholder: 'Servis adına veya notlara göre ara...',
      loading: 'Yerel veritabanı yükleniyor...',
      saving: 'IndexedDB’ye kaydediliyor...',
      saved: 'Tüm değişiklikler yerel olarak kaydedildi',
      allCurrencies: 'Tüm Para Birimleri',
      allCategories: 'Tüm Kategoriler',
      allStatuses: 'Tüm Durumlar',
      allIntervals: 'Tüm Periyotlar',
      originalCurrency: 'Orijinal Para Birimi (Dönüşümsüz)',
      demoBadge: 'DEMO',
      today: 'Bugün',
      daysLeft: (days: number) => `${days} gün kaldı`,
      overdueBy: (days: number) => `${Math.abs(days)} gün gecikti`,
      dueToday: 'Bugün yenileniyor',
      dueTomorrow: 'Yarın yenileniyor',
      exportJson: 'JSON Dışa Aktar',
      exportSingleRecord: 'Kaydı JSON Aktar',
      markAsPaid: 'Dönemi İlerlet (Ödendi)',
      undoMarkPaid: 'İlerletmeyi Geri Al',
      openProvider: 'Sağlayıcı web sitesini aç',
      noNotes: 'Not eklenmemiş',
      optional: 'İsteğe bağlı',
      required: 'Zorunlu',
      actions: 'İşlemler',
    },
    categories: {
      streaming: 'Yayın & Dizi/Film',
      software: 'Yazılım & Araçlar',
      gaming: 'Oyun',
      cloud_storage: 'Bulut Depolama',
      internet_phone: 'İnternet & Telefon',
      fitness: 'Spor & Sağlık',
      education: 'Eğitim',
      hosting_domains: 'Hosting & Alan Adı',
      utilities: 'Faturalar & Hizmetler',
      other: 'Diğer',
    },
    intervals: {
      weekly: 'Haftalık',
      monthly: 'Aylık',
      every_3_months: '3 Ayda Bir',
      every_6_months: '6 Ayda Bir',
      yearly: 'Yıllık',
      custom_days: 'Özel (Gün)',
    },
    statuses: {
      active: 'Aktif',
      planned_cancellation: 'İptal Edilmesi Planlanan',
      cancelled: 'İptal Edildi',
      archived: 'Arşivlendi',
    },
    demoBanner: {
      title: 'Örnek Demo Aboneliklerini Görüntülüyorsunuz',
      description:
        'Demo kayıtları grafikleri, takvimi ve çoklu para birimi hesaplamalarını güvenle inceleyebilmeniz için DEMO rozeti ile işaretlenmiştir. İstediğiniz an tek tıkla kaldırabilirsiniz.',
      removeDemoButton: 'Tüm Demo Kayıtlarını Kaldır',
    },
    notifications: {
      bannerTitle: 'Yenileme ve Deneme Süresi Uyarıları',
      overdueCount: (count: number) => `${count} aboneliğin yenileme tarihi geçmiş durumda`,
      dueSoonCount: (count: number) => `Hatırlatma süresi içinde ${count} yaklaşan ödeme var`,
      trialsEndingCount: (count: number) => `${count} ücretsiz deneme süresi yakında sona eriyor`,
      browserPermissionNote:
        'Uygulama içi uyarılar RenewRadar açıkken otomatik çalışır. Tarayıcı bildirimleri yalnızca tarayıcı açıkken tetiklenebilir; uygulama veya cihaz kapalıyken bildirim gönderilmez.',
      enableBrowserAlerts: 'Tarayıcı Bildirim İzni İste',
      permissionDenied: 'Tarayıcı bildirim izni tarayıcı ayarlarınız tarafından reddedildi.',
      permissionGranted: 'Uygulama sekmesi açıkken tarayıcı bildirimleri etkinleştirildi.',
      testAlertSent: 'Test bildirimi gönderildi.',
    },
    dashboard: {
      title: 'Finansal Genel Bakış',
      subtitle: 'Cihazınızdaki yerel verilerden gerçek zamanlı düzenli gider analizi.',
      assumptionsNote:
        'Hesaplama Esası: Haftalık (×52/12), 3 Ayda Bir (÷3), 6 Ayda Bir (÷6), Yıllık (÷12), Özel d Gün (×365.2425/d/12). Farklı para birimleri asla birbirine karıştırılarak toplanmaz.',
      metrics: {
        monthlyRecurring: 'Tahmini Aylık Gider',
        annualRecurring: 'Tahmini Yıllık Taahhüt',
        activeCount: 'Aktif Abonelikler',
        dueNext7Days: 'İlk 7 Günde Ödenecek',
        trialsEndingSoon: 'Yakında Biten Denemeler',
        potentialAnnualSavings: 'Potansiyel Yıllık Tasarruf',
        noActiveSpend: 'Aktif abonelik yok',
        acrossCurrencies: (count: number) => `${count} ayrı para biriminde izleniyor`,
        plannedCancelCount: (count: number) =>
          count === 0 ? 'İptali planlanan yok' : `${count} iptali planlanan dahil`,
        within14Days: '14 gün içinde sona eren',
        hypotheticalEstimate: 'Planlanan iptaller tamamlanırsa tahmini tasarruf',
      },
      upcoming: {
        title: 'Yaklaşan Yenilemeler',
        subtitle: 'Aktif abonelikler için en yakın planlı ödeme tarihleri.',
        filter7d: 'İlk 7 Gün',
        filter30d: 'İlk 30 Gün',
        filter90d: 'İlk 90 Gün',
        filterAll: 'Tüm Yaklaşanlar',
        emptyFiltered: 'Bu zaman aralığında planlanmış yenileme bulunmuyor.',
        trialEndsLabel: 'Deneme bitişi',
      },
      categoryChart: {
        title: 'Kategoriye Göre Harcamalar',
        subtitle: 'Para birimi bazında aylık normalize edilmiş maliyet dağılımı.',
        currencySelectorLabel: 'Para birimi filtresi',
        emptyChart: 'Seçilen para biriminde aktif abonelik bulunmuyor.',
        monthlyNormalized: 'Aylık Normalize',
        annualNormalized: 'Yıllık Normalize',
      },
      projectionChart: {
        title: '12 Aylık Nakit Akışı Projeksiyonu',
        subtitle: 'Yenileme tarihleri ve ödeme sıklıklarına göre deterministik 12 aylık ödeme takvimi.',
        assumptionsDisclaimer:
          'Projeksiyonlar, mevcut abonelik ücretlerinin ve ödeme periyotlarının önümüzdeki 12 ay boyunca değişmeden kalacağını varsayar.',
        includePlannedCancelToggle: 'Planlanan iptal tarihlerinden sonrasını hariç tut',
        emptyProjection: '12 aylık ödeme projeksiyonunu görmek için aktif abonelik ekleyin.',
      },
      emptyState: {
        title: 'Abonelik radarınız henüz boş',
        description:
          'Hesap açmadan veya banka bilgilerinizi paylaşmadan düzenli ödemelerinizi, ücretsiz deneme bitiş tarihlerini ve çoklu para birimi giderlerinizi takip edin.',
        privacyPoint: '%100 Yerel IndexedDB Depolama • Sıfır İzleme • Çevrimdışı Çalışır',
      },
      manualRateEstimate: {
        title: 'Kullanıcı Tanımlı Manuel Kur Tahmini',
        badge: 'MANUEL KUR TAHMİNİ',
        disclaimer:
          'Ayarlar bölümünde kendi girdiğiniz manuel döviz kurlarıyla hesaplanmıştır. Canlı piyasa kuru değildir.',
      },
    },
    subscriptionsPage: {
      title: 'Abonelik Dizini',
      subtitle: 'Aboneliklerinizi yönetin, filtreleyin, ödeme dönemini ilerletin veya tekil JSON olarak dışa aktarın.',
      sortByLabel: 'Sırala',
      sortName: 'İsim (A–Z)',
      sortAmount: 'Aylık Maliyet (Yüksek–Düşük)',
      sortNextRenewal: 'En Yakın Yenileme Tarihi',
      sortUpdated: 'Son Güncellenen',
      upcomingFilterLabel: 'Yenileme aralığı',
      upcomingAll: 'Tüm Tarihler',
      upcoming7d: '≤ 7 Gün İçinde',
      upcoming30d: '≤ 30 Gün İçinde',
      upcomingOverdue: 'Yalnızca Gecikenler',
      showingCount: (shown: number, total: number) => `Toplam ${total} kayıttan ${shown} tanesi gösteriliyor`,
      emptyMatching: 'Arama ve filtre kriterlerinize uyan abonelik bulunamadı.',
      tableHeaders: {
        service: 'Abonelik',
        category: 'Kategori',
        billing: 'Ödeme Periyodu',
        normalizedMonthly: 'Tah. Aylık',
        nextRenewal: 'Sonraki Yenileme',
        status: 'Durum',
        actions: 'İşlemler',
      },
      paidUpdatedToast: (name: string, nextDate: string) =>
        `"${name}" aboneliğinin yeni yenileme tarihi ${nextDate} olarak güncellendi`,
      undoSuccessToast: (name: string, restoredDate: string) =>
        `"${name}" yenileme tarihi ${restoredDate} olarak geri alındı`,
      deleteConfirmTitle: 'Abonelik Kalıcı Olarak Silinsin mi?',
      deleteConfirmMessage: (name: string) =>
        `"${name}" kaydını kalıcı olarak silmek istediğinizden emin misiniz? Aktif harcamalara dahil etmeden geçmişte saklamak isterseniz silmek yerine Arşivle seçeneğini kullanabilirsiniz.`,
    },
    form: {
      addTitle: 'Yeni Abonelik Ekle',
      editTitle: 'Aboneliği Düzenle',
      nameLabel: 'Servis Adı',
      namePlaceholder: 'örn. Netflix, GitHub Copilot, iCloud+',
      priceLabel: 'Ödeme Tutarı',
      currencyLabel: 'Para Birimi',
      billingIntervalLabel: 'Faturalandırma Periyodu',
      customDaysLabel: 'Özel Döngü Süresi (Gün)',
      nextRenewalDateLabel: 'Sonraki Yenileme Tarihi',
      categoryLabel: 'Kategori',
      statusLabel: 'Mevcut Durum',
      providerUrlLabel: 'Sağlayıcı Web Sitesi / Yönetim URL',
      providerUrlPlaceholder: 'https://ornek.com/hesap',
      startDateLabel: 'Başlangıç Tarihi',
      trialEndDateLabel: 'Ücretsiz Deneme Bitiş Tarihi',
      plannedCancellationDateLabel: 'Hedeflenen İptal Tarihi',
      paymentMethodLabel: 'Ödeme Yöntemi Etiketi',
      paymentMethodPlaceholder: 'örn. Sanal Kart ••42 (Yalnızca etiket)',
      paymentMethodSecurityHint:
        'Asla tam kredi kartı numarası, CVV veya şifre girmeyin. Yalnızca hatırlatıcı bir etiket yazın.',
      reminderLeadDaysLabel: 'Hatırlatma Süresi (Kaç Gün Önce)',
      notesLabel: 'Notlar',
      notesPlaceholder: 'Paket bilgisi, aile paylaşımı, iptal adımları...',
      accentColorLabel: 'Vurgu Rengi',
      validation: {
        nameRequired: 'Servis adı boş bırakılamaz.',
        priceNegative: 'Tutar sıfır veya pozitif bir sayı olmalıdır.',
        nextRenewalInvalid: 'Lütfen geçerli bir sonraki yenileme tarihi girin (YYYY-AA-GG).',
        customDaysInvalid: 'Özel gün aralığı pozitif bir tam sayı olmalıdır (örn. 14 veya 45).',
        urlInvalid: 'Lütfen geçerli bir http:// veya https:// web adresi girin.',
        startDateInvalid: 'Başlangıç tarihi geçerli bir takvim tarihi olmalıdır.',
        trialDateInvalid: 'Ücretsiz deneme bitiş tarihi geçerli bir takvim tarihi olmalıdır.',
        cancelDateInvalid: 'Planlanan iptal tarihi geçerli bir takvim tarihi olmalıdır.',
        reminderInvalid: 'Hatırlatma süresi 0 ile 90 gün arasında bir tam sayı olmalıdır.',
      },
    },
    calendarPage: {
      title: 'Yenileme Takvimi',
      subtitle: 'Planlanan ödeme günlerini ve ücretsiz deneme bitişlerini gün bazında inceleyin.',
      prevMonth: 'Önceki Ay',
      nextMonth: 'Sonraki Ay',
      returnToCurrentMonth: 'Bu Aya Dön',
      selectedDateTitle: (dateStr: string) => `${dateStr} Tarihindeki Kayıtlar`,
      dailyTotalsLabel: 'Seçili Gün Toplamları (Para Birimine Göre)',
      noEventsOnDate: 'Bu tarihte planlanmış bir yenileme veya deneme bitişi yok.',
      renewalEventBadge: 'Yenileme',
      trialEndingBadge: 'Deneme Bitişi',
      plannedCancelBadge: 'Planlı İptal',
      mobileAgendaTitle: 'Aylık Yenileme Ajandası',
      weekdaysMonStart: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      weekdaysSunStart: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
      months: [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık',
      ],
    },
    savingsPage: {
      title: 'Tasarruf Planlayıcı',
      subtitle: 'Az kullandığınız abonelikleri iptal için işaretleyerek potansiyel yıllık tasarrufunuzu hesaplayın.',
      hypotheticalNoticeTitle: 'Önemli: Varsayımsal Tasarruf ve Yalnızca Yerel Takip',
      hypotheticalNoticeBody:
        'Bir aboneliği RenewRadar içinde "İptal Edilmesi Planlanan" veya "İptal Edildi" olarak işaretlemek yalnızca yerel takip kaydınızı günceller; sağlayıcı nezdinde gerçek aboneliğinizi iptal ETMEZ. İptali planlanan abonelikler, siz iptali tamamladığınızı onaylayana kadar mevcut aktif harcamalarınıza dahil edilmeye devam eder.',
      cards: {
        currentActiveSpend: 'Mevcut Aktif Aylık Harcama',
        plannedMonthlySavings: 'Potansiyel Aylık Tasarruf',
        plannedAnnualSavings: 'Potansiyel Yıllık Tasarruf',
        postCancelSpend: 'İptal Sonrası Tahmini Harcama',
      },
      plannedListTitle: 'İptal Edilmesi Planlanan Abonelikler',
      plannedListEmpty:
        'Şu anda iptal edilmesi planlanan abonelik bulunmuyor. Tasarruf simülasyonu için aşağıdaki aktif aboneliklerden seçim yapabilirsiniz.',
      candidatesTitle: 'Aktif Abonelikler (İptal Adayları)',
      candidatesSubtitle: 'Yıllık tasarruf etkisini anında görmek için herhangi bir aktif servisi işaretleyin.',
      markForCancellation: 'İptal Planla',
      keepActive: 'Aktif Tut',
      markCancelledCompleted: 'İptali Tamamlandı İşaretle (Yerel Kayıt)',
      localRecordOnlyHint: 'Yerel durumu İptal Edildi yapar ve aktif harcamadan çıkarır.',
      targetCancelDateLabel: 'Hedef iptal tarihi',
      historyTitle: 'İptal Edilen ve Arşivlenen Geçmiş',
      historyEmpty: 'Henüz iptal edilmiş veya arşivlenmiş abonelik yok.',
    },
    settingsPage: {
      title: 'Ayarlar ve Veri Yönetimi',
      subtitle: 'Dil, görünüm, manuel döviz kurları ve JSON yedekleme seçeneklerini yapılandırın.',
      preferencesTitle: 'Arayüz ve Bölgesel Tercihler',
      languageLabel: 'Arayüz Dili',
      themeLabel: 'Renk Teması',
      themeDark: 'Koyu (Slate)',
      themeLight: 'Açık',
      themeSystem: 'Sistem Varsayılanı',
      defaultCurrencyLabel: 'Yeni Kayıtlar İçin Varsayılan Para Birimi',
      preferredDisplayCurrencyLabel: 'Tercih Edilen Tahmini Gösterim Para Birimi',
      dateFormatLabel: 'Tarih Gösterim Biçimi',
      weekStartLabel: 'Takvim Hafta Başlangıcı',
      weekStartMonday: 'Pazartesi',
      weekStartSunday: 'Pazar',
      defaultReminderLabel: 'Varsayılan Yenileme Hatırlatma Süresi',
      daysBefore: 'gün önce uyar',
      exchangeRatesTitle: 'İsteğe Bağlı Manuel Döviz Kurları (Kullanıcı Tanımlı)',
      exchangeRatesSubtitle:
        'RenewRadar asla uydurma kur veya gizli API kullanmaz. Kartlarda veya panelde kendi belirlediğiniz kurlarla tahmini karşılık görmek isterseniz referans kurlarınızı aşağıya girebilirsiniz.',
      addRateButton: 'Manuel Kuru Kaydet',
      fromCurrency: 'Kaynak',
      toCurrency: 'Hedef',
      rateValueLabel: 'Döviz Kuru (1 Kaynak = X Hedef)',
      rateNoteLabel: 'Bağlam / Tarih Notu',
      noManualRates: 'Tanımlanmış manuel döviz kuru yok. Tüm tutarlar yalnızca kendi orijinal para biriminde gösterilir.',
      backupTitle: 'JSON Yedekleme, Dışa ve İçe Aktarma',
      backupRecommendation:
        'Yedekleme Önerisi: Tüm verileriniz yalnızca tarayıcınızın yerel IndexedDB alanında saklandığından, tarayıcı verilerini temizlemek veya cihaz değiştirmek verilerinizi otomatik taşımaz. Düzenli olarak JSON yedeği alın.',
      exportAllButton: 'Tam JSON Yedeğini İndir',
      importBackupButton: 'Yedek JSON Dosyası Seç...',
      importPreviewTitle: 'Yedek Dosyası Doğrulandı — İçe Aktarmaya Hazır',
      importRecordCount: (count: number) => `Dosyada ${count} geçerli abonelik kaydı bulundu.`,
      importDuplicateCount: (count: number) =>
        count === 0
          ? 'Mevcut kitaplığınızdaki kayıtlarla çakışan kimlik (ID) bulunmadı.'
          : `${count} kayıt mevcut kitaplığınızdaki aboneliklerle aynı kimliği (ID) paylaşıyor.`,
      importModeMerge: 'Mevcut kayıtlarla birleştir (Güvenli)',
      importModeReplace: 'Tüm kitaplığı yedekle değiştir (Mevcutları siler)',
      duplicateKeepBoth: 'Her iki kaydı da koru (İçe aktarılan kopyalara yeni ID ata)',
      duplicateUpdateExisting: 'Aynı ID’ye sahip mevcut kayıtları güncelle',
      confirmImportButton: 'İçe Aktarmayı Başlat',
      importSuccessToast: (count: number) => `${count} abonelik kaydı başarıyla içe aktarıldı.`,
      storageAndPrivacyTitle: 'Gizlilik Mimarisi ve Yerel Depolama Bildirimi',
      storageAndPrivacyBody:
        'RenewRadar, IndexedDB (Şema v1) kullanarak %100 tarayıcınızda çalışır. Finansal kayıtlarınız için hiçbir analitik, telemetri, uzak sunucu veya dış API isteği kullanılmaz.',
      dangerZoneTitle: 'Uygulama Verilerini Sıfırla',
      resetAllDataButton: 'Tüm Yerel Verileri Sil ve Sıfırla',
      resetConfirmTitle: 'Tüm Yerel Abonelikler ve Ayarlar Silinsin mi?',
      resetConfirmMessage:
        'Bu işlem bu tarayıcıdaki tüm abonelikleri kalıcı olarak silecek ve tercihleri sıfırlayacaktır. İşlemden önce JSON yedeği aldığınızdan emin olun.',
    },
  },
};
