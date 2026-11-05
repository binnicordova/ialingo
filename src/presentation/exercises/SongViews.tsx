import { useAtomValue, useSetAtom } from 'jotai';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import type { Character } from '@/domain/characters/character';
import { gapLine, type Exercise, type ExerciseAnswer } from '@/domain/curriculum/exercises';
import type { VocabularyItem } from '@/domain/curriculum/types';
import { localize } from '@/domain/shared/locale';
import { playSfxAtom, speakAtom, stopSpeechAtom } from '@/state/actions';
import { contentAtom } from '@/state/core';
import { localeAtom } from '@/state/selectors';

import { SpeakerButton, Tile, type TileState } from '../components/game';
import { AppText, BigButton, Card } from '../components/ui';
import { useExerciseIntro } from '../hooks/use-exercise-intro';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing } from '../theme/tokens';

interface Props {
  readonly exercise: Exercise;
  readonly locked: boolean;
  readonly onAnswer: (answer: ExerciseAnswer) => void;
  readonly introduce: boolean;
  readonly guide?: Character;
}

/**
 * Chant timing. Text-to-speech cannot sing, so a chant is the guide's voice
 * a little slower and brighter, with a clap on the beat and a pause sized to
 * the line for the child to echo it (call and response).
 */
export const SONG_TIMING = {
  pitchFactor: 1.08,
  rateFactor: 0.85,
  /** Echo pause: base plus time per word. */
  echoBaseMs: 900,
  echoPerWordMs: 380,
  /** Gap between the second clap and the next line. */
  beatMs: 260,
  /** Safety net if the speech engine never reports the end of a line. */
  fallbackBaseMs: 1600,
  fallbackPerWordMs: 520,
} as const;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** The guide's singing voice. */
export function singingVoice(guide: Character | undefined): { pitch: number; rate: number } {
  return {
    pitch: (guide?.voice.pitch ?? 1) * SONG_TIMING.pitchFactor,
    rate: (guide?.voice.rate ?? 1) * SONG_TIMING.rateFactor,
  };
}

type SongPhase = 'intro' | 'sing' | 'echo' | 'done';

/* ------------------------------------------------------------ Sing-along */

export function SongView({ exercise, onAnswer, introduce, guide, locked }: Props) {
  const { t } = useT();
  const locale = useAtomValue(localeAtom);
  const content = useAtomValue(contentAtom);
  const speak = useSetAtom(speakAtom);
  const stopSpeech = useSetAtom(stopSpeechAtom);
  const playSfx = useSetAtom(playSfxAtom);
  const song = exercise.kind === 'song' ? content.song(exercise.songId) : undefined;
  const [current, setCurrent] = useState(-1);
  const [phase, setPhase] = useState<SongPhase>('intro');
  /** Bumped to cancel whatever is playing (restart, line tap, unmount). */
  const generation = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const cancel = () => {
    generation.current += 1;
    clearTimers();
    stopSpeech();
  };

  /** Speaks one line; `then` runs once, when speech ends or the safety net fires. */
  const singLine = (text: string, gen: number, then: () => void) => {
    let finished = false;
    const done = () => {
      if (finished || gen !== generation.current) return;
      finished = true;
      then();
    };
    const voice = singingVoice(guide);
    speak({ text, language: 'target', voice, onDone: done });
    after(
      (SONG_TIMING.fallbackBaseMs + SONG_TIMING.fallbackPerWordMs * wordCount(text)) / voice.rate,
      done,
    );
  };

  const singFrom = (index: number, gen: number) => {
    if (!song || gen !== generation.current) return;
    const line = song.lines[index];
    if (!line) {
      setCurrent(-1);
      setPhase('done');
      playSfx('clap');
      return;
    }
    setCurrent(index);
    setPhase('sing');
    singLine(line.en, gen, () => {
      playSfx('clap');
      setPhase('echo');
      after(SONG_TIMING.echoBaseMs + SONG_TIMING.echoPerWordMs * wordCount(line.en), () => {
        if (gen !== generation.current) return;
        playSfx('clap');
        after(SONG_TIMING.beatMs, () => singFrom(index + 1, gen));
      });
    });
  };

  const startSong = () => {
    cancel();
    singFrom(0, generation.current);
  };

  const singOneLine = (index: number) => {
    const line = song?.lines[index];
    if (!line) return;
    cancel();
    const gen = generation.current;
    setCurrent(index);
    setPhase('sing');
    singLine(line.en, gen, () => {
      setCurrent(-1);
      setPhase('done');
    });
  };

  // The latest start function, for the one-time opening below.
  const start = useRef(startSong);
  useEffect(() => {
    start.current = startSong;
  });
  useExerciseIntro(exercise.id, introduce, t('instrSong'), guide, () => start.current(), 400);
  useEffect(
    () => () => {
      generation.current += 1;
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  if (!song) return null;
  const playing = phase === 'sing' || phase === 'echo';

  return (
    <View style={styles.center}>
      <AppText variant="title" center color={colors.primary}>
        🎵 {localize(song.title, locale)}
      </AppText>
      <View style={styles.lines}>
        {song.lines.map((line, i) => {
          const active = i === current;
          const sung = phase === 'done' || (current >= 0 && i < current);
          return (
            <Pressable
              key={`${exercise.id}-${i}`}
              testID={`song-line-${i}`}
              accessibilityRole="button"
              accessibilityLabel={line.en}
              onPress={() => singOneLine(i)}
              style={[styles.line, active && styles.lineActive, sung && !active && styles.lineSung]}
            >
              <Text style={styles.lineEmoji}>{line.emoji}</Text>
              <View style={styles.lineText}>
                <AppText variant={active ? 'heading' : 'body'} color={active ? colors.primary : colors.ink}>
                  {line.en}
                </AppText>
                {active ? (
                  <AppText variant="small" color={colors.inkSoft}>
                    {localize(line.meaning, locale)}
                  </AppText>
                ) : null}
              </View>
              {active && phase === 'echo' ? (
                <Animated.View entering={ZoomIn.springify()} style={styles.yourTurn}>
                  <AppText variant="small" color="#FFFFFF">
                    🎤 {t('yourTurn')}
                  </AppText>
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <BigButton
          label={phase === 'done' ? t('singAgain') : t('singWithMe')}
          icon={playing ? '🎶' : '🎵'}
          tone="sky"
          compact
          onPress={startSong}
          testID="song-again"
        />
        <BigButton
          label={t('next')}
          icon="➡️"
          tone={phase === 'done' ? 'success' : 'primary'}
          disabled={locked}
          onPress={() => {
            cancel();
            onAnswer({ kind: 'seen' });
          }}
          testID="song-next"
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------- Missing word */

function gapState(optionId: string, answerId: string, chosen: string | null, locked: boolean): TileState {
  if (!locked) return chosen === optionId ? 'selected' : 'idle';
  if (optionId === answerId) return 'correct';
  if (optionId === chosen) return 'wrong';
  return 'disabled';
}

export function LyricGapView({ exercise, onAnswer, locked, introduce, guide }: Props) {
  const { t } = useT();
  const content = useAtomValue(contentAtom);
  const speak = useSetAtom(speakAtom);
  const [chosen, setChosen] = useState<string | null>(null);
  const ex = exercise.kind === 'lyric-gap' ? exercise : null;
  const line = ex ? content.song(ex.songId)?.lines[ex.lineIndex] : undefined;
  const answer = ex ? content.word(ex.answerId) : undefined;
  const options = (ex?.optionIds ?? [])
    .map((id) => content.word(id))
    .filter((w): w is VocabularyItem => w !== undefined);
  const gapped = line && answer ? gapLine(line.en, answer.en) : null;

  const singIt = () => {
    if (line) speak({ text: line.en, language: 'target', voice: singingVoice(guide) });
  };
  useExerciseIntro(exercise.id, introduce, t('instrLyricGap'), guide, singIt);

  if (!ex || !line || !gapped) return null;
  return (
    <View style={styles.center}>
      <AppText variant="heading" center style={styles.instruction}>
        {t('instrLyricGap')}
      </AppText>
      <Animated.View entering={FadeInDown.springify()} style={styles.stretch}>
        <Card style={styles.gapCard}>
          {/* The line's picture would give the answer away, so it shows once answered. */}
          <Text style={styles.gapEmoji}>{locked ? line.emoji : '🎶'}</Text>
          <AppText variant="title" center>
            {gapped.segments.map((segment, i) => (
              <Fragment key={i}>
                {segment}
                {i < gapped.segments.length - 1 ? (
                  <Text style={[styles.blank, locked && styles.blankFilled]}>
                    {locked ? gapped.missing : ' ____ '}
                  </Text>
                ) : null}
              </Fragment>
            ))}
          </AppText>
        </Card>
      </Animated.View>
      <SpeakerButton onPress={singIt} size={72} label={t('tapToListen')} testID="speaker" />
      <Animated.View entering={FadeIn.delay(150)} style={styles.grid}>
        {options.map((option) => (
          <Tile
            key={option.id}
            testID={`option-${option.id}`}
            emoji={option.emoji}
            label={option.en}
            size="md"
            accessibilityLabel={option.en}
            state={gapState(option.id, ex.answerId, chosen, locked)}
            style={options.length === 4 ? styles.gridCell2 : styles.gridCell3}
            onPress={
              locked
                ? undefined
                : () => {
                    setChosen(option.id);
                    onAnswer({ kind: 'pick', optionId: option.id });
                  }
            }
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg },
  instruction: { marginTop: spacing.sm },
  stretch: { alignSelf: 'stretch' },
  lines: { alignSelf: 'stretch', gap: spacing.sm },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 64,
  },
  lineActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  lineSung: { opacity: 0.75 },
  lineEmoji: { fontSize: 34 },
  lineText: { flex: 1, gap: 2 },
  yourTurn: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  gapCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  gapEmoji: { fontSize: 84 },
  blank: { color: colors.primary, textDecorationLine: 'underline' },
  blankFilled: { color: colors.successDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignSelf: 'stretch', justifyContent: 'center' },
  gridCell2: { flexBasis: '46%', flexGrow: 0 },
  gridCell3: { flexBasis: '30%', flexGrow: 0 },
});
