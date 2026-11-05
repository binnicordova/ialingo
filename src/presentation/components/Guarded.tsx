import { Redirect } from 'expo-router';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { onboardedAtom } from '@/state/selectors';

/** Sends players who have not hatched their first pet to onboarding. */
export function Guarded({ children }: { children: ReactNode }) {
  const onboarded = useAtomValue(onboardedAtom);
  if (!onboarded) return <Redirect href="/welcome" />;
  return <>{children}</>;
}
