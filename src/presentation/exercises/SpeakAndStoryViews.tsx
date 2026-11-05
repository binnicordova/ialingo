import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Character } from '@/domain/characters/character';
import type { Exercise, ExerciseAnswer } from '@/domain/curriculum/exercises';
import { PRONUNCIATION_TUNING, scoreUtterance, type SpeakScore } from '@/domain/learning/pronunciation';
import { localize } from '@/domain/shared/locale';
import {
  listenAtom,
  requestMicPermissionAtom,
  stopListeningAtom,
  tapFeedbackAtom,
} from '@/state/actions';
import { contentAtom, recognitionAtom } from '@/state/core';
import { localeAtom, speakModeAtom } from '@/state/selectors';

import { SpeakerButton } from '../components/game';
import { ParentGateModal } from '../components/ParentGateModal';
import { AppText, BigButton, Card } from '../components/ui';
import { useExerciseIntro } from '../hooks/use-exercise-intro';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shade, spacing } from '../theme/tokens';

interface Props {
  readonly exercise: Exercise;
  readonly locked: boolean;
  readonly onAnswer: (answer: ExerciseAnswer) => void;
  readonly introduce: boolean;
  readonly guide?: Character;
}

/* ---------------------------------------------------------------- Speak */

type Phase = 'idle' | 'asking' | 'listening' | 'result';

export function SpeakView({ exercise, locked, onAnswer, introduce, guide }: Props) {
  const { t, l } = useT();
  const content = useAtomValue(contentAtom);
  const mode = useAtomValue(speakModeAtom);
  const recognition = useAtomValue(recognitionAtom);
  const listen = useSetAtom(listenAtom);
  const stopListening = useSetAtom(stopListeningAtom);
  const requestMic = useSetAtom(requestMicPermissionAtom);
  const { english } = useSpeak();
  const [phase, setPhase] = useState<Phase>('idle');
  const [partial, setPartial] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState<SpeakScore | null>(null);
  const [silent, setSilent] = useState(false);
  /** Kids Category rule: a grown-up passes the parental gate before the OS permission prompt. */
  const [gate, setGate] = useState(false);

  const target =
    exercise.kind === 'speak-word'
      ? content.word(exercise.wordId)
      : exercise.kind === 'speak-sentence'
        ? content.sentence(exercise.sentenceId)
        : undefined;
  const text = target?.en ?? '';
  const isSentence = exercise.kind === 'speak-sentence';

  useExerciseIntro(exercise.id, introduce, isSentence ? t('instrSpeakSentence') : t('instrSpeak'), guide, () => {
    if (text) english(text);
  });

  useEffect(() => () => stopListening(), [stopListening]);

  if (!target) return null;

  const startListening = async () => {
    if (recognition.permission === 'unknown') {
      setPhase('asking');
      return;
    }
    setPhase('listening');
    setPartial('');
    setSilent(false);
    const outcome = await listen({ onPartial: setPartial });
    if (outcome.status === 'denied' || outcome.status === 'error') {
      setPhase('idle');
      return;
    }
    const result: SpeakScore =
      outcome.status === 'heard'
        ? scoreUtterance(text, outcome.alternatives)
        : { verdict: 'try-again', heard: null, score: 0 };
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setScore(result);
    setSilent(outcome.status === 'no-speech');
    setPhase('result');
    if (result.verdict !== 'try-again') {
      onAnswer({ kind: 'speech', verdict: result.verdict });
    } else if (nextAttempts >= PRONUNCIATION_TUNING.maxAttempts) {
      onAnswer({ kind: 'speech', verdict: 'try-again' });
    } else {
      // Model the word again so the next try sounds closer.
      setTimeout(() => english(text), 350);
    }
  };

  const allowMicrophone = async () => {
    setGate(false);
    const granted = await requestMic();
    setPhase('idle');
    if (granted) void startListening();
  };

  return (
    <View style={styles.center}>
      <AppText variant="heading" center style={styles.instruction}>
        {isSentence ? t('instrSpeakSentence') : t('instrSpeak')}
      </AppText>
      <Animated.View entering={FadeInDown.springify()} style={styles.stretch}>
        <Card style={styles.targetCard}>
          <Text style={isSentence ? styles.sentenceEmoji : styles.wordEmoji}>{target.emoji}</Text>
          <AppText variant={isSentence ? 'title' : 'hero'} center color={colors.primary}>
            {text}
          </AppText>
          <AppText variant="body" center color={colors.inkSoft}>
            {l(target.meaning)}
          </AppText>
        </Card>
      </Animated.View>

      {phase === 'asking' ? (
        <Animated.View entering={FadeIn} style={styles.stretch}>
          <Card style={styles.permission}>
            <Text style={styles.permissionEmoji}>🧑‍🍼🎤</Text>
            <AppText variant="heading" center>
              {t('micPermissionTitle')}
            </AppText>
            <AppText variant="small" center color={colors.inkSoft}>
              {t('micPermissionBody')}
            </AppText>
            <BigButton label={t('allowMic')} tone="success" onPress={() => setGate(true)} testID="mic-allow" />
            <BigButton label={t('notNow')} tone="neutral" compact onPress={() => setPhase('idle')} />
          </Card>
        </Animated.View>
      ) : mode === 'recognition' ? (
        <View style={styles.micArea}>
          <View style={styles.row}>
            <SpeakerButton onPress={() => english(text)} size={72} label={t('tapToListen')} testID="speaker" />
            <MicButton
              listening={phase === 'listening'}
              disabled={locked || phase === 'listening'}
              onPress={() => void startListening()}
              label={t('tapToSpeak')}
            />
          </View>
          <AppText variant="small" center color={colors.inkSoft}>
            {phase === 'listening'
              ? partial
                ? t('iHeard', { text: partial })
                : t('listening')
              : score && score.verdict === 'try-again' && !locked
                ? silent
                  ? t('speakNoSpeech')
                  : `${score.heard ? t('iHeard', { text: score.heard }) : ''} ${t('speakTryAgain')}`
                : score && score.verdict === 'good'
                  ? `${t('iHeard', { text: score.heard ?? '' })} ${t('speakGood')}`
                  : score && score.verdict === 'great'
                    ? t('speakGreat')
                    : t('tapToSpeak')}
          </AppText>
          <View style={styles.attempts}>
            {Array.from({ length: PRONUNCIATION_TUNING.maxAttempts }, (_, i) => (
              <View key={i} style={[styles.attemptDot, i < attempts && styles.attemptUsed]} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.micArea}>
          <SpeakerButton onPress={() => english(text)} size={84} label={t('tapToListen')} testID="speaker" />
          <BigButton
            label={t('iSaidIt')}
            icon="🗣️"
            tone="success"
            disabled={locked}
            onPress={() => onAnswer({ kind: 'speech', verdict: 'self-check' })}
            style={styles.stretch}
            testID="speak-self-check"
          />
        </View>
      )}
      <ParentGateModal visible={gate} onPass={() => void allowMicrophone()} onCancel={() => setGate(false)} />
    </View>
  );
}

function MicButton({ listening, disabled, onPress, label }: { listening: boolean; disabled: boolean; onPress: () => void; label: string }) {
  const feedback = useSetAtom(tapFeedbackAtom);
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = listening
      ? withRepeat(withSequence(withTiming(1.18, { duration: 450 }), withTiming(1, { duration: 450 })), -1)
      : withTiming(1, { duration: 150 });
  }, [listening, pulse]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: listening ? 0.35 : 0 }));
  const tone = listening ? colors.danger : colors.primary;
  return (
    <View style={styles.micWrap}>
      <Animated.View style={[styles.micRing, { backgroundColor: tone }, ring]} />
      <Pressable
        testID="speak-mic"
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => {
          feedback();
          onPress();
        }}
        style={({ pressed }) => [
          styles.mic,
          {
            backgroundColor: tone,
            borderBottomColor: shade(tone, 0.25),
            borderBottomWidth: pressed ? 2 : 7,
            transform: [{ translateY: pressed ? 4 : 0 }],
            opacity: disabled && !listening ? 0.6 : 1,
          },
        ]}
      >
        <Text style={styles.micIcon}>🎤</Text>
      </Pressable>
    </View>
  );
}

/* ----------------------------------------------------------- Story page */

export function StoryPageView({ exercise, onAnswer, introduce, guide, locked }: Props) {
  const { t } = useT();
  const locale = useAtomValue(localeAtom);
  const content = useAtomValue(contentAtom);
  const { characterEnglish } = useSpeak();
  const story = exercise.kind === 'story-page' ? content.story(exercise.storyId) : undefined;
  const index = exercise.kind === 'story-page' ? exercise.lineIndex : 0;
  const line = story?.lines[index];

  useExerciseIntro(exercise.id, introduce, t('instrStory'), guide, () => {
    if (line) characterEnglish(line.en, guide);
  });

  if (!story || !line) return null;
  return (
    <View style={styles.center}>
      {index === 0 ? (
        <AppText variant="title" center color={colors.primary}>
          📖 {localize(story.title, locale)}
        </AppText>
      ) : null}
      <AppText variant="small" color={colors.inkSoft}>
        {t('storyPage', { n: index + 1, total: story.lines.length })}
      </AppText>
      <Animated.View key={exercise.id} entering={FadeInDown.springify()} style={styles.stretch}>
        <Card style={styles.page}>
          <Text style={styles.sceneEmoji}>{line.emoji}</Text>
          <AppText variant="title" center>
            {line.en}
          </AppText>
          <AppText variant="body" center color={colors.inkSoft}>
            {localize(line.meaning, locale)}
          </AppText>
        </Card>
      </Animated.View>
      <View style={styles.row}>
        <BigButton label={t('readAgain')} icon="🔊" tone="sky" compact onPress={() => characterEnglish(line.en, guide)} />
        <BigButton label={t('next')} icon="➡️" tone="primary" disabled={locked} onPress={() => onAnswer({ kind: 'seen' })} testID="story-next" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg },
  instruction: { marginTop: spacing.sm },
  stretch: { alignSelf: 'stretch' },
  targetCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  wordEmoji: { fontSize: 96 },
  sentenceEmoji: { fontSize: 72 },
  micArea: { alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  micWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  micRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  mic: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 48 },
  attempts: { flexDirection: 'row', gap: spacing.sm },
  attemptDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  attemptUsed: { backgroundColor: colors.orange },
  permission: { alignItems: 'stretch', gap: spacing.sm, borderRadius: radii.xl },
  permissionEmoji: { fontSize: 40, textAlign: 'center' },
  page: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, minHeight: 260, justifyContent: 'center' },
  sceneEmoji: { fontSize: 110 },
});
