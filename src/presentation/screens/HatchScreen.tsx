import { Redirect, router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';

import { hatchEggAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { eggsAtom } from '@/state/selectors';

import { Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors } from '../theme/tokens';
import { HatchFlow } from './HatchFlow';

/** Hatches an egg the child has earned, then opens the new pet's room. */
export function HatchScreen({ speciesId }: { speciesId: string }) {
  const { t } = useT();
  const content = useAtomValue(contentAtom);
  const eggs = useAtomValue(eggsAtom);
  const hatch = useSetAtom(hatchEggAtom);
  const [done, setDone] = useState(false);
  const species = content.species(speciesId);

  // After hatching the egg is gone, so skip the "no egg" redirect while we navigate away.
  if (done) return <Screen background={colors.backgroundWarm}>{null}</Screen>;
  if (!species || !eggs.includes(speciesId)) return <Redirect href="/pets" />;

  return (
    <Screen background={colors.backgroundWarm}>
      <TopBar title={t('newEgg')} onBack={() => router.back()} />
      <HatchFlow
        species={species}
        background={colors.backgroundWarm}
        confirmLabel={t('letsGo')}
        onComplete={(nickname) => {
          setDone(true);
          hatch({ speciesId, nickname });
          router.replace({ pathname: '/pet/[speciesId]', params: { speciesId } });
        }}
      />
    </Screen>
  );
}
