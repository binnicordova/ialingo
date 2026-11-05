import { useSetAtom } from 'jotai';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type { PetSpecies } from '@/domain/pets/species';
import { createRng, hashSeed } from '@/domain/shared/rng';
import { PET_NAME_SUGGESTIONS } from '@/infrastructure/content/pets';
import { hapticAtom, playSfxAtom } from '@/state/actions';

import { Tile } from '../components/game';
import { AppText, BigButton } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { PetStage3D, type PetStageHandle } from '../three/PetStage3D';
import { colors, radii, spacing } from '../theme/tokens';

/** Taps needed to crack the egg: a tiny bit of anticipation without frustration. */
export const TAPS_TO_HATCH = 3;

/**
 * Hatching ritual: tap the egg (it wobbles), it cracks open with hearts, the
 * pet says hello in English, and the child picks a name from fun presets.
 * There is no keyboard, so no personal data can be typed.
 */
export function HatchFlow({
  species,
  background,
  onComplete,
  confirmLabel,
}: {
  species: PetSpecies;
  background: string;
  onComplete: (nickname: string) => void;
  confirmLabel: string;
}) {
  const { t, l } = useT();
  const { english } = useSpeak();
  const sfx = useSetAtom(playSfxAtom);
  const haptic = useSetAtom(hapticAtom);
  const stageRef = useRef<PetStageHandle>(null);
  const [taps, setTaps] = useState(0);
  const [hatched, setHatched] = useState(false);
  const [name, setName] = useState(species.name);

  const suggestions = useMemo(() => {
    const rng = createRng(hashSeed(species.id));
    return [species.name, ...rng.sample(PET_NAME_SUGGESTIONS.filter((n) => n !== species.name), 5)];
  }, [species]);

  const tapEgg = () => {
    if (hatched || taps > TAPS_TO_HATCH) return;
    const next = taps + 1;
    setTaps(next);
    haptic(next > TAPS_TO_HATCH ? 'success' : 'tap');
    if (next > TAPS_TO_HATCH) {
      sfx('hatch');
      stageRef.current?.play('hatch');
    } else {
      sfx('pop');
      stageRef.current?.play('wobble');
    }
  };

  return (
    <View style={styles.root}>
      <PetStage3D
        ref={stageRef}
        blueprint={species.blueprint}
        stage="baby"
        mode="egg"
        background={background}
        style={styles.stage}
        onTap={hatched ? () => stageRef.current?.play('jump') : tapEgg}
        onHatched={() => {
          setHatched(true);
          english(`Hello! ${species.catchphrase}`);
        }}
        accessibilityLabel={hatched ? species.name : t('tapToHatch')}
      />
      {!hatched ? (
        <Animated.View entering={FadeIn} style={styles.hint}>
          <AppText variant="title" center>
            {t('tapToHatch')}
          </AppText>
          <View style={styles.dots}>
            {Array.from({ length: TAPS_TO_HATCH + 1 }, (_, i) => (
              <View key={i} style={[styles.dot, i < taps && styles.dotOn]} />
            ))}
          </View>
          <BigButton label="👆 🥚" onPress={tapEgg} tone="orange" testID="hatch-tap" />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.springify()} style={styles.namePanel}>
          <AppText variant="title" center>
            {t('itHatched', { name: species.name })}
          </AppText>
          <AppText variant="body" center color={colors.inkSoft}>
            {l(species.title)}
          </AppText>
          <AppText variant="heading" center>
            {t('chooseName')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.names}>
            {suggestions.map((suggestion) => (
              <Tile
                key={suggestion}
                testID={`name-${suggestion}`}
                label={suggestion}
                size="sm"
                state={suggestion === name ? 'selected' : 'idle'}
                style={styles.nameTile}
                onPress={() => {
                  setName(suggestion);
                  english(suggestion);
                }}
              />
            ))}
          </ScrollView>
          <BigButton label={confirmLabel} tone="success" icon="✨" onPress={() => onComplete(name)} testID="hatch-confirm" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1, borderRadius: radii.xl, marginHorizontal: spacing.lg },
  hint: { padding: spacing.lg, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.orange },
  namePanel: { padding: spacing.lg, gap: spacing.sm },
  names: { gap: spacing.sm, paddingVertical: spacing.xs },
  nameTile: { flexGrow: 0, minWidth: 110, paddingHorizontal: spacing.lg },
});
