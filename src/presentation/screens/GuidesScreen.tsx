import { router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { contentAtom } from '@/state/core';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { AppText, Screen, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing, tint } from '../theme/tokens';

/** Meet the eight guides; tap one to hear them introduce themselves. */
export function GuidesScreen() {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const { native } = useSpeak();
  const [talkingId, setTalkingId] = useState<string | null>(null);

  return (
    <Screen>
      <TopBar title={t('meetFriends')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list}>
        {content.catalog.characters.map((character, i) => {
          const worlds = content.orderedWorlds.filter((w) => w.guideId === character.id);
          return (
            <Animated.View key={character.id} entering={FadeInDown.delay(i * 60).springify()}>
              <Pressable
                testID={`guide-${character.id}`}
                accessibilityRole="button"
                accessibilityLabel={character.name}
                onPress={() => {
                  setTalkingId(character.id);
                  native(l(character.greeting), character, () => setTalkingId(null));
                }}
                style={({ pressed }) => [
                  styles.card,
                  shadow,
                  { backgroundColor: tint(character.look.primary, 0.85), transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <CharacterAvatar look={character.look} size={100} talking={talkingId === character.id} />
                <View style={styles.text}>
                  <AppText variant="title">{character.name}</AppText>
                  <AppText variant="small" color={colors.inkSoft}>
                    {l(character.role)}
                  </AppText>
                  <AppText variant="tiny" color={colors.inkSoft}>
                    {t('hosts')} {worlds.map((w) => `${w.emoji} ${l(w.title)}`).join(' · ')}
                  </AppText>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.lg, padding: spacing.md },
  text: { flex: 1, gap: 2 },
});
