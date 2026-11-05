import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { localize, type LocalizedText } from '@/domain/shared/locale';
import { localeAtom } from '@/state/selectors';

import { translate, type StringKey, type TranslateParams } from './strings';

/** Returns a translator bound to the current UI language. */
export function useT() {
  const locale = useAtomValue(localeAtom);
  const t = useCallback(
    (key: StringKey, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );
  const l = useCallback((text: LocalizedText) => localize(text, locale), [locale]);
  return { t, l, locale };
}
