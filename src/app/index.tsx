import { Redirect } from 'expo-router';
import { useAtomValue } from 'jotai';

import { onboardedAtom } from '@/state/selectors';

/** Entry: first-time players go to onboarding, everyone else to the map. */
export default function Index() {
  const onboarded = useAtomValue(onboardedAtom);
  return <Redirect href={onboarded ? '/home' : '/welcome'} />;
}
