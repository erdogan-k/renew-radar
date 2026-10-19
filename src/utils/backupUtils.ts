import {
  BackupPayloadV1,
  BILLING_INTERVALS,
  INITIAL_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  SubscriptionRecord,
  SUPPORTED_CURRENCIES,
} from '../types/subscription';
import { isValidCalendarDate } from './dateUtils';
import { normalizeAndValidateUrl } from './financeUtils';

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: BackupPayloadV1;
  recordCount: number;
  duplicateIdCount: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates an individual subscription object from an imported JSON file.
 */
export function validateSubscriptionRecord(
  raw: unknown,
  index: number
): { record?: SubscriptionRecord; error?: string } {
  if (!isObject(raw)) {
    return { error: `Record #${index + 1}: Not a valid JSON object.` };
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : '';
  if (!id) {
    return { error: `Record #${index + 1}: Missing valid string 'id'.` };
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    return { error: `Record #${index + 1} (${id}): 'name' cannot be empty.` };
  }

  const price = typeof raw.price === 'number' ? raw.price : Number.NaN;
  if (!Number.isFinite(price) || price < 0) {
    return { error: `Record #${index + 1} (${name}): 'price' must be a non-negative number.` };
  }

  const currency = raw.currency;
  if (typeof currency !== 'string' || !SUPPORTED_CURRENCIES.includes(currency as any)) {
    return {
      error: `Record #${index + 1} (${name}): Unsupported currency '${String(currency)}'.`,
    };
  }

  const billingInterval = raw.billingInterval;
  if (typeof billingInterval !== 'string' || !BILLING_INTERVALS.includes(billingInterval as any)) {
    return {
      error: `Record #${index + 1} (${name}): Invalid billingInterval '${String(billingInterval)}'.`,
    };
  }

  let customIntervalDays: number | undefined = undefined;
  if (billingInterval === 'custom_days') {
    const rawCustom = Number(raw.customIntervalDays);
    if (!Number.isInteger(rawCustom) || rawCustom <= 0) {
      return {
        error: `Record #${index + 1} (${name}): 'customIntervalDays' must be a positive integer for custom interval.`,
      };
    }
    customIntervalDays = rawCustom;
  }

  const category = raw.category;
  if (typeof category !== 'string' || !INITIAL_CATEGORIES.includes(category as any)) {
    return {
      error: `Record #${index + 1} (${name}): Invalid category '${String(category)}'.`,
    };
  }

  const status = raw.status;
  if (typeof status !== 'string' || !SUBSCRIPTION_STATUSES.includes(status as any)) {
    return {
      error: `Record #${index + 1} (${name}): Invalid status '${String(status)}'.`,
    };
  }

  const nextRenewalDate = typeof raw.nextRenewalDate === 'string' ? raw.nextRenewalDate.trim() : '';
  if (!isValidCalendarDate(nextRenewalDate)) {
    return {
      error: `Record #${index + 1} (${name}): Invalid nextRenewalDate '${nextRenewalDate}'. Expected YYYY-MM-DD.`,
    };
  }

  const optionalDateFields = ['startDate', 'trialEndDate', 'plannedCancellationDate'] as const;
  const validatedDates: Partial<Record<(typeof optionalDateFields)[number], string>> = {};

  for (const field of optionalDateFields) {
    const val = raw[field];
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val !== 'string' || !isValidCalendarDate(val.trim())) {
        return {
          error: `Record #${index + 1} (${name}): Invalid ${field} '${String(val)}'. Expected YYYY-MM-DD.`,
        };
      }
      validatedDates[field] = val.trim();
    }
  }

  let providerUrl: string | undefined = undefined;
  if (typeof raw.providerUrl === 'string' && raw.providerUrl.trim()) {
    const urlCheck = normalizeAndValidateUrl(raw.providerUrl);
    if (!urlCheck.isValid) {
      return {
        error: `Record #${index + 1} (${name}): Unsafe or invalid providerUrl.`,
      };
    }
    providerUrl = urlCheck.normalizedUrl;
  }

  const nowIso = new Date().toISOString();

  const record: SubscriptionRecord = {
    id,
    name: name.slice(0, 140),
    providerUrl,
    category: category as SubscriptionRecord['category'],
    price,
    currency: currency as SubscriptionRecord['currency'],
    billingInterval: billingInterval as SubscriptionRecord['billingInterval'],
    customIntervalDays,
    startDate: validatedDates.startDate,
    nextRenewalDate,
    trialEndDate: validatedDates.trialEndDate,
    paymentMethodLabel:
      typeof raw.paymentMethodLabel === 'string' && raw.paymentMethodLabel.trim()
        ? raw.paymentMethodLabel.trim().slice(0, 80)
        : undefined,
    notes:
      typeof raw.notes === 'string' && raw.notes.trim()
        ? raw.notes.trim().slice(0, 1000)
        : undefined,
    accentColor:
      typeof raw.accentColor === 'string' && raw.accentColor.trim()
        ? raw.accentColor.trim().slice(0, 32)
        : undefined,
    status: status as SubscriptionRecord['status'],
    plannedCancellationDate: validatedDates.plannedCancellationDate,
    reminderLeadDays:
      typeof raw.reminderLeadDays === 'number' &&
      Number.isInteger(raw.reminderLeadDays) &&
      raw.reminderLeadDays >= 0 &&
      raw.reminderLeadDays <= 90
        ? raw.reminderLeadDays
        : undefined,
    isDemo: Boolean(raw.isDemo),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso,
  };

  return { record };
}

/**
 * Parses and validates a raw JSON string backup file before import.
 * Supports both full `BackupPayloadV1` files and single-subscription exported JSON objects.
 */
export function validateBackupJson(
  jsonText: string,
  existingIds: Set<string> = new Set()
): BackupValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      isValid: false,
      errors: ['Malformed JSON file. Please select a valid RenewRadar JSON backup file.'],
      recordCount: 0,
      duplicateIdCount: 0,
    };
  }

  if (!isObject(parsed)) {
    return {
      isValid: false,
      errors: ['Root JSON value must be an object.'],
      recordCount: 0,
      duplicateIdCount: 0,
    };
  }

  // Support importing a single exported subscription object or a full backup payload
  let rawSubscriptions: unknown[] = [];
  let schemaVersion = 1;

  if (parsed.app === 'RenewRadar' && Array.isArray(parsed.subscriptions)) {
    if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion < 1 || parsed.schemaVersion > 1) {
      return {
        isValid: false,
        errors: [`Unsupported backup schemaVersion: ${String(parsed.schemaVersion)}. Expected version 1.`],
        recordCount: 0,
        duplicateIdCount: 0,
      };
    }
    schemaVersion = parsed.schemaVersion;
    rawSubscriptions = parsed.subscriptions;
  } else if (typeof parsed.id === 'string' && typeof parsed.name === 'string') {
    rawSubscriptions = [parsed];
  } else {
    return {
      isValid: false,
      errors: [
        'Invalid backup structure. Expected a RenewRadar backup object containing a "subscriptions" array.',
      ],
      recordCount: 0,
      duplicateIdCount: 0,
    };
  }

  const validatedRecords: SubscriptionRecord[] = [];
  const errors: string[] = [];
  const seenInFile = new Set<string>();
  let duplicateIdCount = 0;

  rawSubscriptions.forEach((item, index) => {
    const res = validateSubscriptionRecord(item, index);
    if (res.error || !res.record) {
      errors.push(res.error || `Record #${index + 1} invalid.`);
      return;
    }

    let finalRecord = res.record;
    // If duplicate ID exists within the same file, assign a deterministic unique suffix so no record is lost
    if (seenInFile.has(finalRecord.id)) {
      duplicateIdCount++;
      finalRecord = {
        ...finalRecord,
        id: `${finalRecord.id}-dup-${index + 1}`,
      };
    }
    seenInFile.add(finalRecord.id);

    if (existingIds.has(finalRecord.id)) {
      duplicateIdCount++;
    }

    validatedRecords.push(finalRecord);
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      recordCount: 0,
      duplicateIdCount: 0,
    };
  }

  const payload: BackupPayloadV1 = {
    app: 'RenewRadar',
    schemaVersion,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    subscriptions: validatedRecords,
    preferences: isObject(parsed.preferences) ? (parsed.preferences as any) : undefined,
  };

  return {
    isValid: true,
    errors: [],
    payload,
    recordCount: validatedRecords.length,
    duplicateIdCount,
  };
}

/**
 * Merges or replaces subscription records safely.
 *
 * In `merge` mode:
 * - Parameter `duplicateStrategy`:
 *   - `'update_existing'`: updates existing records with the same ID if the imported record is newer or equal, or overwrites by ID.
 *   - `'keep_both'`: assigns a fresh unique ID to colliding imported records so neither existing nor imported data is lost.
 */
export function mergeSubscriptionRecords(
  existing: SubscriptionRecord[],
  incoming: SubscriptionRecord[],
  mode: 'merge' | 'replace',
  duplicateStrategy: 'update_existing' | 'keep_both' = 'update_existing'
): SubscriptionRecord[] {
  if (mode === 'replace') {
    return [...incoming];
  }

  const map = new Map<string, SubscriptionRecord>();
  for (const item of existing) {
    map.set(item.id, item);
  }

  for (const item of incoming) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    } else if (duplicateStrategy === 'update_existing') {
      map.set(item.id, item);
    } else {
      let newId = `${item.id}-imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      while (map.has(newId)) {
        newId = `${item.id}-imported-${Math.random().toString(36).slice(2, 8)}`;
      }
      map.set(newId, { ...item, id: newId });
    }
  }

  return Array.from(map.values());
}
