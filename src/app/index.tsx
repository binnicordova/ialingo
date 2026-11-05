import { Redirect } from 'expo-router';
import { useAtomValue } from 'jotai';

import { profileChosenAtom } from '@/state/core';
import { onboardedAtom } from '@/state/selectors';

/** Entry: pick the player (when there are several), then onboarding or the map. */
export default function Index() {
  const chosen = useAtomValue(profileChosenAtom);
  const onboarded = useAtomValue(onboardedAtom);
  if (!chosen) return <Redirect href="/profiles" />;
  return <Redirect href={onboarded ? '/home' : '/welcome'} />;
}
