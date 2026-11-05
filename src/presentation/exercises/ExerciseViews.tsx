import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type { Character } from '@/domain/characters/character';
import { tokenizeSentence, type Exercise, type ExerciseAnswer } from '@/domain/curriculum/exercises';
import type { VocabularyItem } from '@/domain/curriculum/types';
import { contentAtom } from '@/state/core';

import { SpeakerButton, Tile, type TileState } from '../components/game';
import { AppText, BigButton, Card } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing } from '../theme/tokens';

export interface ExerciseViewProps {
  readonly exercise: Exercise;
  /** True once answered (the feedback bar is showing). */
  readonly locked: boolean;
  readonly onAnswer: (answer: ExerciseAnswer) => void;
  /** Speak the spoken instruction first (first time this kind appears). */
  readonly introduce: boolean;
  readonly guide?: Character;
}

/** Picks the right view for an exercise. */
export function ExerciseView(props: ExerciseViewProps) {
  switch (props.exercise.kind) {
    case 'learn-card':
      return <LearnCardView {...props} />;
    case 'listen-pick-picture':
      return <ListenPickView {...props} />;
    case 'picture-pick-word':
      return <PicturePickView {...props} />;
    case 'true-false':
      return <TrueFalseView {...props} />;
    case 'match-pairs':
      return <MatchPairsView {...props} />;
    case 'spell-word':
      return <SpellWordView {...props} />;
    case 'build-sentence':
      return <BuildSentenceView {...props} />;
  }
}

/** Speaks the instruction (native language) and then the prompt (English), once per exercise. */
function useIntro(id: string, introduce: boolean, instruction: string, guide: Character | undefined, prompt?: () => void) {
  const { native } = useSpeak();
  const latest = useRef({ introduce, instruction, guide, prompt });
  useEffect(() => {
    latest.current = { introduce, instruction, guide, prompt };
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      const l = latest.current;
      if (l.introduce) native(l.instruction, l.guide, l.prompt);
      else l.prompt?.();
    }, 280);
    return () => clearTimeout(timer);
  }, [id, native]);
}

function useWords(ids: readonly string[]): VocabularyItem[] {
  const content = useAtomValue(contentAtom);
  return useMemo(
    () => ids.map((id) => content.word(id)).filter((w): w is VocabularyItem => w !== undefined),
    [ids, content],
  );
}

function Instruction({ text }: { text: string }) {
  return (
    <AppText variant="heading" center style={styles.instruction}>
      {text}
    </AppText>
  );
}

function pickState(optionId: string, answerId: string, chosen: string | null, locked: boolean): TileState {
  if (!locked) return chosen === optionId ? 'selected' : 'idle';
  if (optionId === answerId) return 'correct';
  if (optionId === chosen) return 'wrong';
  return 'disabled';
}

/* ------------------------------------------------------------ Learn card */

function LearnCardView({ exercise, onAnswer, introduce, guide, locked }: ExerciseViewProps) {
  const { t, l } = useT();
  const { english } = useSpeak();
  const [word] = useWords(exercise.kind === 'learn-card' ? [exercise.wordId] : []);
  useIntro(exercise.id, introduce, t('instrLearn'), guide, () => word && english(word.en));
  if (!word) return null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrLearn')} />
      <Animated.View entering={FadeInDown.springify()} style={styles.learnCardWrap}>
        <Card style={styles.learnCard}>
          <Text style={styles.learnEmoji}>{word.emoji}</Text>
          <AppText variant="hero" center color={colors.primary}>
            {word.en}
          </AppText>
          <AppText variant="heading" center color={colors.inkSoft}>
            {l(word.meaning)}
          </AppText>
        </Card>
      </Animated.View>
      <SpeakerButton onPress={() => english(word.en)} label={t('tapToListen')} testID="speaker" />
      <BigButton label={t('next')} onPress={() => onAnswer({ kind: 'seen' })} disabled={locked} tone="primary" style={styles.fullWidth} testID="learn-next" />
    </View>
  );
}

/* ---------------------------------------------------------- Listen pick */

function ListenPickView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t } = useT();
  const { english } = useSpeak();
  const ex = exercise.kind === 'listen-pick-picture' ? exercise : null;
  const options = useWords(ex?.optionIds ?? []);
  const answer = options.find((o) => o.id === ex?.answerId);
  const [chosen, setChosen] = useState<string | null>(null);
  useIntro(exercise.id, introduce, t('instrListen'), guide, () => answer && english(answer.en));
  if (!ex || !answer) return null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrListen')} />
      <SpeakerButton onPress={() => english(answer.en)} size={110} label={t('tapToListen')} testID="speaker" />
      <View style={[styles.grid, options.length === 4 && styles.grid2]}>
        {options.map((option) => (
          <Tile
            key={option.id}
            testID={`option-${option.id}`}
            emoji={option.emoji}
            size="lg"
            accessibilityLabel={option.en}
            state={pickState(option.id, ex.answerId, chosen, locked)}
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
      </View>
    </View>
  );
}

/* --------------------------------------------------------- Picture pick */

function PicturePickView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t } = useT();
  const ex = exercise.kind === 'picture-pick-word' ? exercise : null;
  const options = useWords(ex?.optionIds ?? []);
  const answer = options.find((o) => o.id === ex?.answerId);
  const [chosen, setChosen] = useState<string | null>(null);
  useIntro(exercise.id, introduce, t('instrPicture'), guide);
  if (!ex || !answer) return null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrPicture')} />
      <Animated.View entering={FadeIn} style={styles.bigPicture}>
        <Text style={styles.bigEmoji}>{answer.emoji}</Text>
      </Animated.View>
      <View style={styles.list}>
        {options.map((option) => (
          <Tile
            key={option.id}
            testID={`option-${option.id}`}
            label={option.en}
            size="sm"
            state={pickState(option.id, ex.answerId, chosen, locked)}
            style={styles.listItem}
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
      </View>
    </View>
  );
}

/* ----------------------------------------------------------- True/false */

function TrueFalseView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t } = useT();
  const { english } = useSpeak();
  const ex = exercise.kind === 'true-false' ? exercise : null;
  const [spoken, shown] = useWords(ex ? [ex.spokenWordId, ex.shownWordId] : []);
  const shownWord = ex && ex.spokenWordId === ex.shownWordId ? spoken : shown;
  const [chosen, setChosen] = useState<boolean | null>(null);
  useIntro(exercise.id, introduce, t('instrTrueFalse'), guide, () => spoken && english(spoken.en));
  if (!ex || !spoken || !shownWord) return null;
  const truth = ex.spokenWordId === ex.shownWordId;
  const stateFor = (value: boolean): TileState => {
    if (!locked) return chosen === value ? 'selected' : 'idle';
    if (value === truth) return 'correct';
    return chosen === value ? 'wrong' : 'disabled';
  };
  return (
    <View style={styles.center}>
      <Instruction text={t('instrTrueFalse')} />
      <View style={styles.row}>
        <SpeakerButton onPress={() => english(spoken.en)} size={90} label={t('tapToListen')} testID="speaker" />
        <View style={styles.bigPicture}>
          <Text style={styles.bigEmoji}>{shownWord.emoji}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {[true, false].map((value) => (
          <Tile
            key={String(value)}
            testID={`answer-${value ? 'yes' : 'no'}`}
            emoji={value ? '✅' : '❌'}
            size="lg"
            state={stateFor(value)}
            style={styles.gridCell2}
            accessibilityLabel={value ? 'Yes' : 'No'}
            onPress={
              locked
                ? undefined
                : () => {
                    setChosen(value);
                    onAnswer({ kind: 'bool', value });
                  }
            }
          />
        ))}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------- Match pairs */

function MatchPairsView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t } = useT();
  const { english } = useSpeak();
  const ex = exercise.kind === 'match-pairs' ? exercise : null;
  const words = useWords(ex?.wordIds ?? []);
  const right = useMemo(() => {
    const sorted = [...words].sort((a, b) => a.en.localeCompare(b.en));
    const same = sorted.every((w, i) => w.id === words[i]?.id);
    return same && sorted.length > 1 ? [...sorted.slice(1), sorted[0] as VocabularyItem] : sorted;
  }, [words]);
  const [left, setLeft] = useState<string | null>(null);
  const [rightSel, setRightSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<readonly string[]>([]);
  const [wrongPair, setWrongPair] = useState<readonly string[] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useIntro(exercise.id, introduce, t('instrMatch'), guide);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Matching happens in the tap handler: a pair is checked as soon as both sides are chosen. */
  const select = (side: 0 | 1, id: string) => {
    const nextLeft = side === 0 ? id : left;
    const nextRight = side === 1 ? id : rightSel;
    if (!nextLeft || !nextRight) {
      if (side === 0) setLeft(id);
      else setRightSel(id);
      return;
    }
    if (nextLeft === nextRight) {
      const word = words.find((w) => w.id === nextLeft);
      if (word) english(word.en);
      const next = [...matched, nextLeft];
      setMatched(next);
      setLeft(null);
      setRightSel(null);
      if (next.length === words.length) {
        timers.current.push(setTimeout(() => onAnswer({ kind: 'match', mistakes }), 450));
      }
      return;
    }
    setLeft(nextLeft);
    setRightSel(nextRight);
    setWrongPair([nextLeft, nextRight]);
    setMistakes((m) => m + 1);
    timers.current.push(
      setTimeout(() => {
        setWrongPair(null);
        setLeft(null);
        setRightSel(null);
      }, 650),
    );
  };

  const stateFor = (id: string, selected: string | null, side: 0 | 1): TileState => {
    if (matched.includes(id)) return 'done';
    if (wrongPair && wrongPair[side] === id) return 'wrong';
    return selected === id ? 'selected' : 'idle';
  };
  if (!ex) return null;
  const disabled = locked || wrongPair !== null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrMatch')} />
      <View style={styles.matchColumns}>
        <View style={styles.matchColumn}>
          {words.map((w) => (
            <Tile
              key={w.id}
              testID={`match-left-${w.id}`}
              emoji={w.emoji}
              size="md"
              accessibilityLabel={w.en}
              state={stateFor(w.id, left, 0)}
              onPress={disabled ? undefined : () => select(0, w.id)}
            />
          ))}
        </View>
        <View style={styles.matchColumn}>
          {right.map((w) => (
            <Tile
              key={w.id}
              testID={`match-right-${w.id}`}
              label={w.en}
              size="md"
              state={stateFor(w.id, rightSel, 1)}
              onPress={disabled ? undefined : () => select(1, w.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------ Spell word */

function SpellWordView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t } = useT();
  const { english } = useSpeak();
  const ex = exercise.kind === 'spell-word' ? exercise : null;
  const [word] = useWords(ex ? [ex.wordId] : []);
  const [placed, setPlaced] = useState<readonly number[]>([]);
  useIntro(exercise.id, introduce, t('instrSpell'), guide, () => word && english(word.en));
  const length = word?.en.length ?? 0;

  useEffect(() => {
    if (!ex || placed.length !== length || length === 0 || locked) return;
    const timer = setTimeout(
      () => onAnswer({ kind: 'spell', letters: placed.map((i) => ex.letters[i] ?? '') }),
      300,
    );
    return () => clearTimeout(timer);
  }, [placed, length, ex, locked, onAnswer]);

  if (!ex || !word) return null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrSpell')} />
      <View style={styles.row}>
        <View style={styles.bigPictureSmall}>
          <Text style={styles.midEmoji}>{word.emoji}</Text>
        </View>
        <SpeakerButton onPress={() => english(word.en)} size={76} label={t('tapToListen')} testID="speaker" />
      </View>
      <View style={styles.slots}>
        {Array.from({ length }, (_, i) => {
          const tileIndex = placed[i];
          return (
            <View key={i} style={[styles.slot, tileIndex !== undefined && styles.slotFilled]}>
              <AppText variant="title" color={colors.primary}>
                {tileIndex !== undefined ? (ex.letters[tileIndex] ?? '') : ''}
              </AppText>
            </View>
          );
        })}
      </View>
      <View style={styles.letterBank}>
        {ex.letters.map((letter, i) => (
          <Tile
            key={`${letter}-${i}`}
            testID={`letter-${i}`}
            label={letter}
            size="sm"
            state={placed.includes(i) ? 'disabled' : 'idle'}
            style={styles.letterTile}
            onPress={locked || placed.includes(i) || placed.length >= length ? undefined : () => setPlaced([...placed, i])}
          />
        ))}
      </View>
      <BigButton label={t('clear')} icon="↩️" compact tone="neutral" onPress={() => setPlaced([])} disabled={locked || placed.length === 0} />
    </View>
  );
}

/* -------------------------------------------------------- Build sentence */

function BuildSentenceView({ exercise, onAnswer, locked, introduce, guide }: ExerciseViewProps) {
  const { t, l } = useT();
  const { english } = useSpeak();
  const content = useAtomValue(contentAtom);
  const ex = exercise.kind === 'build-sentence' ? exercise : null;
  const sentence = ex ? content.sentence(ex.sentenceId) : undefined;
  const expected = useMemo(() => (sentence ? tokenizeSentence(sentence.en).length : 0), [sentence]);
  const [placed, setPlaced] = useState<readonly number[]>([]);
  useIntro(exercise.id, introduce, t('instrSentence'), guide, () => sentence && english(sentence.en));

  useEffect(() => {
    if (!ex || expected === 0 || placed.length !== expected || locked) return;
    const timer = setTimeout(
      () => onAnswer({ kind: 'sentence', tokens: placed.map((i) => ex.tiles[i] ?? '') }),
      350,
    );
    return () => clearTimeout(timer);
  }, [placed, expected, ex, locked, onAnswer]);

  if (!ex || !sentence) return null;
  return (
    <View style={styles.center}>
      <Instruction text={t('instrSentence')} />
      <View style={styles.row}>
        <SpeakerButton onPress={() => english(sentence.en)} size={80} label={t('tapToListen')} testID="speaker" />
        <View style={styles.sentenceHint}>
          <Text style={styles.midEmoji}>{sentence.emoji}</Text>
          <AppText variant="small" color={colors.inkSoft} center>
            {l(sentence.meaning)}
          </AppText>
        </View>
      </View>
      <View style={styles.answerLine}>
        {placed.map((tileIndex, i) => (
          <Tile
            key={`${tileIndex}-${i}`}
            testID={`placed-${i}`}
            label={ex.tiles[tileIndex]}
            size="sm"
            state="selected"
            style={styles.chip}
            onPress={locked ? undefined : () => setPlaced(placed.filter((_, j) => j !== i))}
          />
        ))}
      </View>
      <View style={styles.letterBank}>
        {ex.tiles.map((tile, i) => (
          <Tile
            key={`${tile}-${i}`}
            testID={`tile-${i}`}
            label={tile}
            size="sm"
            state={placed.includes(i) ? 'disabled' : 'idle'}
            style={styles.chip}
            onPress={locked || placed.includes(i) || placed.length >= expected ? undefined : () => setPlaced([...placed, i])}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg },
  instruction: { marginTop: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  learnCardWrap: { alignSelf: 'stretch' },
  learnCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  learnEmoji: { fontSize: 110 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignSelf: 'stretch', justifyContent: 'center' },
  grid2: {},
  gridCell2: { flexBasis: '46%', flexGrow: 0 },
  gridCell3: { flexBasis: '30%', flexGrow: 0 },
  bigPicture: {
    width: 150,
    height: 150,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPictureSmall: {
    width: 110,
    height: 110,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigEmoji: { fontSize: 96 },
  midEmoji: { fontSize: 64 },
  list: { alignSelf: 'stretch', gap: spacing.sm },
  listItem: { flex: 0, minHeight: 64 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  matchColumns: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  matchColumn: { flex: 1, gap: spacing.sm },
  slots: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', justifyContent: 'center' },
  slot: {
    width: 44,
    height: 54,
    borderRadius: radii.sm,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  letterBank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  letterTile: { flexGrow: 0, flexBasis: 58, minWidth: 58 },
  sentenceHint: { flex: 1, alignItems: 'center', gap: spacing.xs },
  answerLine: {
    minHeight: 72,
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm,
    borderBottomWidth: 3,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chip: { flexGrow: 0, flexBasis: 'auto', paddingHorizontal: spacing.lg },
});
