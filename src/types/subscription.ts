export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';

export type BillingInterval =
  | 'weekly'
  | 'monthly'
  | 'every_3_months'
  | 'every_6_months'
  | 'yearly'
  | 'custom_days';

export type SubscriptionStatus =
  | 'active'
  | 'planned_cancellation'
  | 'cancelled'
  | 'archived';

export type SubscriptionCategory =
  | 'streaming'
  | 'software'
  | 'gaming'
  | 'cloud_storage'
  | 'internet_phone'
  | 'fitness'
  | 'education'
  | 'hosting_domains'
  | 'utilities'
  | 'other';

export type NavigationSection =
  | 'dashboard'
  | 'subscriptions'
  | 'calendar'
  | 'savings'
  | 'settings';

export type ThemePreference = 'dark' | 'light' | 'system';
export type LanguageCode = 'en' | 'tr';
export type DateFormatPreference = 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'MM/DD/YYYY';
export type WeekStartDay = 'monday' | 'sunday';

export interface ManualExchangeRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number; // 1 fromCurrency = rate * toCurrency
  updatedAt: string; // ISO string or YYYY-MM-DD context
  note?: string;
}

export interface SubscriptionRecord {
  id: string;
  name: string;
  providerUrl?: string;
  category: SubscriptionCategory;
  price: number;
  currency: CurrencyCode;
  billingInterval: BillingInterval;
  customIntervalDays?: number;
  startDate?: string; // YYYY-MM-DD
  nextRenewalDate: string; // YYYY-MM-DD
  trialEndDate?: string; // YYYY-MM-DD
  paymentMethodLabel?: string; // e.g. "Personal Visa (4821)" — no secret credentials
  notes?: string;
  accentColor?: string;
  status: SubscriptionStatus;
  plannedCancellationDate?: string; // YYYY-MM-DD
  reminderLeadDays?: number;
  isDemo?: boolean;
  previousRenewalDateBeforeMarkPaid?: string; // Enables undo after Mark as Paid
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface UserPreferences {
  language: LanguageCode;
  theme: ThemePreference;
  defaultCurrency: CurrencyCode;
  preferredDisplayCurrency?: CurrencyCode | 'ORIGINAL';
  dateFormat: DateFormatPreference;
  weekStart: WeekStartDay;
  defaultReminderLeadDays: number;
  browserNotificationsEnabled: boolean;
  manualExchangeRates: ManualExchangeRate[];
  schemaVersion: number;
}

export interface BackupPayloadV1 {
  app: 'RenewRadar';
  schemaVersion: number;
  exportedAt: string;
  subscriptions: SubscriptionRecord[];
  preferences?: Partial<UserPreferences>;
}

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['TRY', 'USD', 'EUR', 'GBP'];

export const INITIAL_CATEGORIES: SubscriptionCategory[] = [
  'streaming',
  'software',
  'gaming',
  'cloud_storage',
  'internet_phone',
  'fitness',
  'education',
  'hosting_domains',
  'utilities',
  'other',
];

export const BILLING_INTERVALS: BillingInterval[] = [
  'weekly',
  'monthly',
  'every_3_months',
  'every_6_months',
  'yearly',
  'custom_days',
];

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'active',
  'planned_cancellation',
  'cancelled',
  'archived',
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'dark',
  defaultCurrency: 'USD',
  preferredDisplayCurrency: 'ORIGINAL',
  dateFormat: 'YYYY-MM-DD',
  weekStart: 'monday',
  defaultReminderLeadDays: 3,
  browserNotificationsEnabled: false,
  manualExchangeRates: [],
  schemaVersion: 1,
};
