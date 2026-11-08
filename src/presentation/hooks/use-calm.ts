import { useAtomValue } from 'jotai';
import { useReducedMotion } from 'react-native-reanimated';

import { settingsAtom } from '@/state/selectors';

/** True when motion should be gentle: the system's reduce-motion setting or the parent's. */
export function useCalm(): boolean {
  const systemReduced = useReducedMotion();
  return useAtomValue(settingsAtom).reducedMotion || systemReduced;
}
