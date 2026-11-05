/**
 * Languages the app UI and instructions can be shown in.
 * The *target* language being learned is always English.
 */
export const SUPPORTED_LOCALES = ['es', 'pt', 'fr', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** A piece of text available in every supported UI locale. */
export type LocalizedText = Readonly<Record<Locale, string>>;

/** Type guard for values coming from storage or the device. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Picks the text for a locale. Falls back to English if a translation is empty. */
export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}

/** BCP-47 tag used for text-to-speech in each UI locale. */
export const SPEECH_LANGUAGE_TAG: Readonly<Record<Locale, string>> = {
  es: 'es-MX',
  pt: 'pt-BR',
  fr: 'fr-FR',
  en: 'en-US',
};

/** BCP-47 tag for the target (learned) language. */
export const TARGET_LANGUAGE_TAG = 'en-US';
