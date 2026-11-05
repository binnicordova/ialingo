import {
  createAudioPlayer,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { VOICE_DIARY_TUNING } from '@/domain/voice/voice-diary';
import { savePostcardAtom } from '@/state/actions';
import { contentAtom, servicesAtom } from '@/state/core';
import { activePetAtom, settingsAtom, voiceDiaryAtom, worldViewsAtom } from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { ParentGateModal } from '../components/ParentGateModal';
import { AppText, BigButton, Card, Screen, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, spacing } from '../theme/tokens';

type Phase = 'ready' | 'recording' | 'recorded' | 'saved' | 'error';

/**
 * Weekly voice postcard (parent opt-in): the child says one sentence they
 * learned. The file stays in the app's private storage so a parent can hear
 * week 1 next to today.
 */
export function PostcardScreen() {
  const { t, l } = useT();
  const settings = useAtomValue(settingsAtom);
  const entries = useAtomValue(voiceDiaryAtom);
  const worlds = useAtomValue(worldViewsAtom);
  const content = useAtomValue(contentAtom);
  const pet = useAtomValue(activePetAtom);
  const services = useAtomValue(servicesAtom);
  const savePostcard = useSetAtom(savePostcardAtom);
  const { english } = useSpeak();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<Phase>('ready');
  const [take, setTake] = useState<{ uri: string; durationMs: number } | null>(null);
  const [gate, setGate] = useState(false);
  const startedAt = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const player = useRef<AudioPlayer | null>(null);

  const world = [...worlds].reverse().find((w) => w.unlocked)?.world ?? content.orderedWorlds[0];
  const sentence = world?.sentences[entries.length % Math.max(1, world.sentences.length)];

  useEffect(
    () => () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      player.current?.remove();
    },
    [],
  );

  if (!settings.voiceDiary || !sentence) {
    return (
      <Screen>
        <TopBar title={t('postcardTitle')} onBack={() => router.back()} />
        {null}
      </Screen>
    );
  }

  const stop = async () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (recorder.uri) {
        setTake({ uri: recorder.uri, durationMs: services.clock.now() - startedAt.current });
        setPhase('recorded');
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  };

  /** Asks a grown-up (parental gate) before the OS prompt, the first time only. */
  const startRecording = async () => {
    try {
      const current = await getRecordingPermissionsAsync();
      if (current.granted) void record();
      else setGate(true);
    } catch {
      setGate(true);
    }
  };

  const record = async () => {
    setGate(false);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPhase('error');
        return;
      }
      services.speech.stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = services.clock.now();
      setPhase('recording');
      stopTimer.current = setTimeout(() => void stop(), VOICE_DIARY_TUNING.maxSeconds * 1000);
    } catch {
      setPhase('error');
    }
  };

  const listen = () => {
    if (!take) return;
    player.current?.remove();
    player.current = createAudioPlayer(take.uri);
    player.current.play();
  };

  const save = async () => {
    if (!take) return;
    const ok = await savePostcard({ recordingUri: take.uri, durationMs: take.durationMs, prompt: sentence.en });
    setPhase(ok ? 'saved' : 'error');
  };

  return (
    <Screen background={colors.backgroundWarm}>
      <TopBar title={`💌 ${t('postcardTitle')}`} onBack={() => router.back()} />
      <View style={styles.body}>
        {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={120} mood={phase === 'saved' ? 'wow' : 'happy'} /> : null}
        <Card style={styles.prompt}>
          <Text style={styles.emoji}>{sentence.emoji}</Text>
          <AppText variant="title" center color={colors.primary}>
            {t('postcardPrompt', { text: sentence.en })}
          </AppText>
          <AppText variant="small" center color={colors.inkSoft}>
            {l(sentence.meaning)}
          </AppText>
          <BigButton label={t('tapToListen')} icon="🔊" tone="sky" compact onPress={() => english(sentence.en)} />
        </Card>

        {phase === 'ready' || phase === 'error' ? (
          <>
            {phase === 'error' ? (
              <AppText variant="small" center color={colors.danger}>
                {t('micPermissionBody')}
              </AppText>
            ) : null}
            <BigButton label={t('record')} icon="🎙️" tone="danger" onPress={() => void startRecording()} testID="postcard-record" />
          </>
        ) : null}
        {phase === 'recording' ? (
          <Animated.View entering={ZoomIn} style={styles.stretch}>
            <AppText variant="heading" center color={colors.danger}>
              🔴 {t('recording')}
            </AppText>
            <BigButton label={t('stop')} icon="⏹️" tone="primary" onPress={() => void stop()} />
          </Animated.View>
        ) : null}
        {phase === 'recorded' ? (
          <View style={styles.stretch}>
            <BigButton label={t('playBack')} icon="▶️" tone="sky" onPress={listen} />
            <BigButton label={t('savePostcard')} icon="💾" tone="success" onPress={() => void save()} testID="postcard-save" />
            <BigButton label={t('recordAgain')} tone="neutral" compact onPress={() => setPhase('ready')} />
          </View>
        ) : null}
        {phase === 'saved' ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.stretch}>
            <AppText variant="heading" center color={colors.successDark}>
              {t('postcardSaved')}
            </AppText>
            <BigButton label={t('yay')} tone="success" onPress={() => router.back()} />
          </Animated.View>
        ) : null}
      </View>
      <ParentGateModal visible={gate} onPass={() => void record()} onCancel={() => setGate(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  prompt: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 64 },
  stretch: { alignSelf: 'stretch', gap: spacing.sm },
});
