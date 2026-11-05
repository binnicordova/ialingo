import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { YLE_LEVELS, type LevelInfo } from '@/domain/curriculum/levels';
import { isWorldCompleted } from '@/domain/curriculum/unlock-policy';
import { contentAtom, todayAtom } from '@/state/core';
import { activePetAtom, progressAtom } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { PetPortrait } from '../art/PetPortrait';
import { ParentGateModal } from '../components/ParentGateModal';
import { AppText, BigButton, Card, ProgressBar, Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing, tint } from '../theme/tokens';

/**
 * Cambridge-style level certificates (Starters, Movers, Flyers). Earned by
 * beating every world boss of a level. Parents can share the image; the
 * child's name is written by hand on the printout and never stored.
 */
export function CertificatesScreen() {
  const { t } = useT();
  const content = useAtomValue(contentAtom);
  const progress = useAtomValue(progressAtom);

  return (
    <Screen>
      <TopBar title={`🎓 ${t('certificates')}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list}>
        {YLE_LEVELS.map((level) => {
          const worlds = content.orderedWorlds.filter((w) => w.level === level.id);
          const done = worlds.filter((w) => isWorldCompleted(w, progress)).length;
          return <LevelCard key={level.id} level={level} done={done} total={worlds.length} />;
        })}
      </ScrollView>
    </Screen>
  );
}

function LevelCard({ level, done, total }: { level: LevelInfo; done: number; total: number }) {
  const { t, l } = useT();
  const pet = useAtomValue(activePetAtom);
  const content = useAtomValue(contentAtom);
  const today = useAtomValue(todayAtom);
  const certificateRef = useRef<ComponentRef<typeof View>>(null);
  const [gate, setGate] = useState(false);
  const earned = total > 0 && done >= total;
  const guides = content.catalog.characters.slice(0, 4);

  const share = async () => {
    setGate(false);
    try {
      // RN 0.88 host refs are ReactNativeElement; view-shot's typings predate that.
      const uri = await captureRef(certificateRef as unknown as Parameters<typeof captureRef>[0], {
        format: 'png',
        quality: 1,
      });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      // Sharing is optional; nothing to tell the child.
    }
  };

  if (!earned) {
    return (
      <Card style={styles.lockedCard}>
        <Text style={styles.levelEmoji}>{level.emoji}</Text>
        <View style={styles.flex}>
          <AppText variant="heading">
            {l(level.title)} · {level.cefr}
          </AppText>
          <AppText variant="small" color={colors.inkSoft}>
            {t('levelWorlds', { done, total })} · {t('certificateLocked', { level: l(level.title) })}
          </AppText>
          <ProgressBar value={total ? done / total : 0} color={level.color} height={12} />
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.earnedWrap}>
      <View ref={certificateRef} collapsable={false} style={[styles.certificate, { borderColor: level.color, backgroundColor: tint(level.color, 0.88) }]}>
        <Text style={styles.certEmoji}>{level.emoji}🏆</Text>
        <AppText variant="title" center color={colors.ink}>
          {t('certificateTitle')}
        </AppText>
        <AppText variant="heading" center color={level.color}>
          {l(level.title)} · {level.cefr}
        </AppText>
        <AppText variant="small" color={colors.inkSoft}>
          {t('awardedTo')}
        </AppText>
        <View style={styles.nameLine} />
        <AppText variant="body" center>
          {t('certificateBody', { level: l(level.title), cefr: level.cefr, pet: pet?.pet.nickname ?? '' })}
        </AppText>
        <View style={styles.certArt}>
          {guides.slice(0, 2).map((g) => (
            <CharacterAvatar key={g.id} look={g.look} size={54} bob={false} />
          ))}
          {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={72} /> : null}
          {guides.slice(2, 4).map((g) => (
            <CharacterAvatar key={g.id} look={g.look} size={54} bob={false} />
          ))}
        </View>
        <AppText variant="tiny" color={colors.inkSoft}>
          iaLingo · {today}
        </AppText>
      </View>
      <BigButton label={t('shareCertificate')} icon="📤" tone="neutral" compact onPress={() => setGate(true)} testID={`share-${level.id}`} />
      <ParentGateModal visible={gate} onPass={() => void share()} onCancel={() => setGate(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  lockedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelEmoji: { fontSize: 44 },
  flex: { flex: 1, gap: spacing.xs },
  earnedWrap: { gap: spacing.sm },
  certificate: {
    borderWidth: 6,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow,
  },
  certEmoji: { fontSize: 44 },
  nameLine: { alignSelf: 'stretch', height: 2, backgroundColor: colors.inkSoft, marginVertical: spacing.md, marginHorizontal: spacing.xl },
  certArt: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.sm },
});
