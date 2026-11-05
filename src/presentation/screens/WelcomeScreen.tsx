import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SUPPORTED_LOCALES, type Locale } from '@/domain/shared/locale';
import { completeOnboardingAtom, speakAtom, tapFeedbackAtom, updateSettingsAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { localeAtom } from '@/state/selectors';

import { CharacterAvatar } from '../art/CharacterAvatar';
import { EggPortrait } from '../art/PetPortrait';
import { SpeechBubble } from '../components/game';
import { AppText, BigButton, Screen } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';
import { HatchFlow } from './HatchFlow';

const HELLO: Readonly<Record<Locale, string>> = { es: '¡Hola!', pt: 'Olá!', en: 'Hello!' };

type Step = 'language' | 'egg' | 'hatch';

/**
 * First run, under a minute and with no account, email or typing:
 * pick a language → pick an egg → hatch it → pick a name → play.
 */
export function WelcomeScreen() {
  const { t } = useT();
  const locale = useAtomValue(localeAtom);
  const content = useAtomValue(contentAtom);
  const updateSettings = useSetAtom(updateSettingsAtom);
  const completeOnboarding = useSetAtom(completeOnboardingAtom);
  const speak = useSetAtom(speakAtom);
  const feedback = useSetAtom(tapFeedbackAtom);
  const [step, setStep] = useState<Step>('language');
  const [speciesId, setSpeciesId] = useState<string | null>(null);

  const starters = content.catalog.species.filter((s) => s.unlock.type === 'starter');
  const luna = content.character('luna');
  const chosen = speciesId ? content.species(speciesId) : undefined;

  if (step === 'hatch' && chosen) {
    return (
      <Screen background={colors.backgroundWarm}>
        <HatchFlow
          species={chosen}
          background={colors.backgroundWarm}
          confirmLabel={t('letsGo')}
          onComplete={(nickname) => {
            completeOnboarding({ speciesId: chosen.id, nickname, locale });
            router.replace('/home');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen background={colors.primarySoft}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInUp.springify()} style={styles.brand}>
          <AppText variant="hero" color={colors.primary} center>
            iaLingo
          </AppText>
          <AppText variant="body" color={colors.inkSoft} center>
            {t('welcomeSubtitle')}
          </AppText>
        </Animated.View>

        {luna ? (
          <View style={styles.guideRow}>
            <CharacterAvatar look={luna.look} size={110} />
            <SpeechBubble style={styles.bubble}>
              <AppText variant="heading">{step === 'language' ? t('chooseLanguage') : t('chooseEgg')}</AppText>
            </SpeechBubble>
          </View>
        ) : null}

        {step === 'language' ? (
          <View style={styles.options}>
            {SUPPORTED_LOCALES.map((option, i) => (
              <Animated.View key={option} entering={FadeInDown.delay(100 * i).springify()}>
                <BigButton
                  testID={`lang-${option}`}
                  label={`${HELLO[option]}  ${t(`languageName_${option}`)}`}
                  tone={option === locale ? 'primary' : 'neutral'}
                  onPress={() => {
                    updateSettings({ uiLocale: option });
                    speak({ text: HELLO[option], language: 'native' });
                  }}
                />
              </Animated.View>
            ))}
            <BigButton label={t('next')} icon="➡️" tone="success" onPress={() => setStep('egg')} testID="welcome-next" />
          </View>
        ) : (
          <View style={styles.options}>
            <View style={styles.eggs}>
              {starters.map((species, i) => (
                <Animated.View key={species.id} entering={FadeInDown.delay(120 * i).springify()} style={styles.eggCell}>
                  <Pressable
                    testID={`egg-${species.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={species.name}
                    accessibilityState={{ selected: speciesId === species.id }}
                    onPress={() => {
                      feedback();
                      setSpeciesId(species.id);
                    }}
                    style={({ pressed }) => [
                      styles.egg,
                      shadow,
                      speciesId === species.id && styles.eggSelected,
                      { transform: [{ scale: pressed ? 0.95 : speciesId === species.id ? 1.05 : 1 }] },
                    ]}
                  >
                    <EggPortrait blueprint={species.blueprint} size={96} wobble={speciesId === species.id ? -6 : 0} />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            <BigButton
              label={t('start')}
              icon="🥚"
              tone="success"
              disabled={!speciesId}
              onPress={() => setStep('hatch')}
              testID="egg-start"
            />
            <BigButton label={t('back')} tone="neutral" compact onPress={() => setStep('language')} />
          </View>
        )}

        <View style={styles.privacy}>
          <Text style={styles.lock}>🔒</Text>
          <AppText variant="small" color={colors.inkSoft} style={styles.privacyText}>
            {t('noAccountNeeded')}
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.xl, flexGrow: 1 },
  brand: { gap: spacing.xs, marginTop: spacing.lg },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: { flex: 1 },
  options: { gap: spacing.md },
  eggs: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  eggCell: { flex: 1 },
  egg: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  eggSelected: { borderColor: colors.orange },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto' },
  lock: { fontSize: 22 },
  privacyText: { flex: 1 },
});
