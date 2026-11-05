import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AlbumPage, Sticker } from '@/domain/learning/album';
import { albumAtom } from '@/state/selectors';

import { AppText, ProgressBar, Screen, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing, tint } from '../theme/tokens';

/** The sticker album: one page per open world; tap a sticker to hear it. */
export function AlbumScreen() {
  const { t } = useT();
  const { pages, totals } = useAtomValue(albumAtom);
  return (
    <Screen>
      <TopBar title={`📒 ${t('wordAlbum')}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.summary}>
          <AppText variant="heading" center>
            {t('albumProgress', { n: totals.collected, total: totals.total })} · 🥇 {totals.gold}
          </AppText>
          <ProgressBar value={totals.total ? totals.collected / totals.total : 0} color={colors.primary} />
          <AppText variant="small" center color={colors.inkSoft}>
            {t('albumInfo')}
          </AppText>
        </View>
        {pages.map((page, index) => (
          <AlbumPageView key={page.world.id} page={page} index={index} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function AlbumPageView({ page, index }: { page: AlbumPage; index: number }) {
  const { t, l } = useT();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60)} style={[styles.page, shadow, { backgroundColor: tint(page.world.color, 0.82) }]}>
      <View style={styles.pageHeader}>
        <AppText variant="heading" style={styles.pageTitle} numberOfLines={1}>
          {page.world.emoji} {l(page.world.title)}
        </AppText>
        <AppText variant="small" color={colors.inkSoft}>
          {page.collected}/{page.stickers.length}
        </AppText>
      </View>
      <View style={styles.grid}>
        {page.stickers.map((sticker) => (
          <StickerView key={sticker.word.id} sticker={sticker} lockedLabel={t('albumLocked')} />
        ))}
      </View>
    </Animated.View>
  );
}

function StickerView({ sticker, lockedLabel }: { sticker: Sticker; lockedLabel: string }) {
  const { t } = useT();
  const { english } = useSpeak();
  const locked = sticker.state === 'locked';
  return (
    <Pressable
      testID={`sticker-${sticker.word.id}`}
      accessibilityRole="button"
      accessibilityLabel={locked ? lockedLabel : t('stickerA11y', { word: sticker.word.en })}
      disabled={locked}
      onPress={() => english(sticker.word.en)}
      style={({ pressed }) => [
        styles.sticker,
        sticker.state === 'learned' && styles.learned,
        sticker.state === 'gold' && styles.gold,
        locked && styles.locked,
        { transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}
    >
      <Text style={[styles.stickerEmoji, locked && styles.lockedEmoji]}>{locked ? '❔' : sticker.word.emoji}</Text>
      <AppText variant="tiny" center numberOfLines={1} color={locked ? colors.inkSoft : colors.ink}>
        {locked ? '· · ·' : sticker.word.en}
      </AppText>
      {sticker.state === 'gold' ? <Text style={styles.badge}>⭐</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  summary: { gap: spacing.sm },
  page: { borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pageTitle: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sticker: {
    width: 76,
    height: 86,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  learned: { borderColor: colors.sky },
  gold: { borderColor: '#FFC107', backgroundColor: '#FFF8E1' },
  locked: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt, borderStyle: 'dashed' },
  stickerEmoji: { fontSize: 34 },
  lockedEmoji: { opacity: 0.4 },
  badge: { position: 'absolute', top: -8, right: -6, fontSize: 18 },
});
