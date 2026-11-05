import { getLocales } from 'expo-localization';

import type { Clock } from '@/application/ports';
import { toDayKey } from '@/domain/shared/day';
import { isLocale, type Locale } from '@/domain/shared/locale';

/** First supported language among the device's preferred languages (read locally). */
export function detectDeviceLocale(): Locale {
  try {
    for (const locale of getLocales()) {
      if (isLocale(locale.languageCode)) return locale.languageCode;
    }
  } catch {
    // Fall through to the default.
  }
  return 'es';
}

export const systemClock: Clock = {
  today: () => toDayKey(new Date()),
  now: () => Date.now(),
};
