import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import type { VocabularyItem } from '@/domain/curriculum/types';
import {
  closeOpenCards,
  createBubbleRounds,
  createMemoryBoard,
  createOddOneOutRounds,
  createSpyScene,
  flipCard,
  isBoardSolved,
  type BubbleRound,
  type MemoryBoard,
  type MemoryCard,
  type MiniGameKind,
  type OddRound,
  type SpyItem,
  type SpyScene,
  type WorldCategories,
  PLAY_TUNING,
} from '@/domain/play/mini-games';
import { createRng, hashSeed } from '@/domain/shared/rng';
import { finishMiniGameAtom, hapticAtom, playSfxAtom } from '@/state/actions';
import { contentAtom, todayAtom } from '@/state/core';
import {
  activePetAtom,
  gamesTodayAtom,
  metWordsAtom,
  playWordsAtom,
  settingsAtom,
  worldCategoriesAtom,
} from '@/state/selectors';

import { PetPortrait } from '../art/PetPortrait';
import { SpeakerButton } from '../components/game';
import { AppText, BigButton, Card, ProgressBar, Screen, TopBar } from '../components/ui';
import { useSpeak } from '../hooks/use-speak';
import { useT } from '../i18n/use-t';
import { colors, radii, shadow, spacing } from '../theme/tokens';

interface GameResult {
  readonly correct: number;
  readonly total: number;
  readonly berries: number;
  readonly capped: boolean;
  readonly moves?: number;
}

/** Hosts one Play Park game by kind. */
export function MiniGameScreen({ kind }: { kind: string }) {
  if (kind === 'bubble-pop') return <BubblePop />;
  if (kind === 'memory-match') return <MemoryMatch />;
  if (kind === 'i-spy') return <ISpy />;
  if (kind === 'odd-one-out') return <OddOneOut />;
  return <Screen>{null}</Screen>;
}

/** Runs timers that are all cancelled when the screen goes away. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current = [];
    },
    [],
  );
  return (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

/** Pays the game through the domain command and returns what the child earned. */
function useFinishGame(kind: MiniGameKind) {
  const finish = useSetAtom(finishMiniGameAtom);
  return (correct: number, total: number, moves?: number): GameResult => {
    const result = finish({ kind, correct, total });
    const event = result.events.find((e) => e.type === 'mini-game-finished');
    return {
      correct,
      total,
      moves,
      berries: event?.type === 'mini-game-finished' ? event.berries : 0,
      capped: event?.type === 'mini-game-finished' ? event.capped : false,
    };
  };
}

function useCalm(): boolean {
  const systemReduced = useReducedMotion();
  return useAtomValue(settingsAtom).reducedMotion || systemReduced;
}

/* ------------------------------------------------------------- Bubble Pop */

interface BubbleGame {
  readonly id: number;
  readonly rounds: readonly BubbleRound[];
  readonly index: number;
  readonly correct: number;
  readonly missed: readonly string[];
  readonly popped: string | null;
  readonly result: GameResult | null;
}

function newBubbleGame(id: number, words: readonly VocabularyItem[], seed: string): BubbleGame {
  return {
    id,
    rounds: createBubbleRounds(createRng(hashSeed(seed)), words),
    index: 0,
    correct: 0,
    missed: [],
    popped: null,
    result: null,
  };
}

function BubblePop() {
  const { t } = useT();
  const words = useAtomValue(playWordsAtom);
  const content = useAtomValue(contentAtom);
  const today = useAtomValue(todayAtom);
  const gamesToday = useAtomValue(gamesTodayAtom);
  const sfx = useSetAtom(playSfxAtom);
  const haptic = useSetAtom(hapticAtom);
  const { english } = useSpeak();
  const after = useTimers();
  const finish = useFinishGame('bubble-pop');
  // The board is fixed when the game starts, so re-renders never reshuffle it.
  const [game, setGame] = useState(() => newBubbleGame(0, words, `bubble|${today}|${gamesToday}|0`));
  const round = game.rounds[game.index];
  const target = round ? content.word(round.targetId) : undefined;

  useEffect(() => {
    if (!target || game.result) return;
    const timer = setTimeout(() => english(target.en), 450);
    return () => clearTimeout(timer);
  }, [game.id, game.index, game.result, target, english]);

  if (game.result) {
    return (
      <GameResults
        emoji="🫧"
        result={game.result}
        onReplay={() => setGame(newBubbleGame(game.id + 1, words, `bubble|${today}|${gamesToday}|${game.id + 1}`))}
      />
    );
  }
  if (!round || !target) return <NotEnoughWords />;

  const tap = (wordId: string) => {
    if (game.popped || game.missed.includes(wordId)) return;
    if (wordId === round.targetId) {
      sfx('pop');
      haptic('success');
      const correct = game.correct + (game.missed.length === 0 ? 1 : 0);
      setGame({ ...game, popped: wordId, correct });
      after(700, () => {
        const nextIndex = game.index + 1;
        if (nextIndex >= game.rounds.length) {
          // Pay outside the state updater: it updates other atoms (celebrations).
          const result = finish(correct, game.rounds.length);
          setGame((g) => ({ ...g, result }));
        } else {
          setGame((g) => ({ ...g, index: nextIndex, missed: [], popped: null }));
        }
      });
    } else {
      sfx('wrong');
      haptic('warning');
      setGame({ ...game, missed: [...game.missed, wordId] });
      after(350, () => english(target.en));
    }
  };

  return (
    <Screen background="#E6F6FF">
      <TopBar title={t('gameRound', { n: game.index + 1, total: game.rounds.length })} onBack={() => router.back()} />
      <View style={styles.playArea}>
        <ProgressBar value={game.index / game.rounds.length} color={colors.sky} style={styles.progress} />
        <AppText variant="heading" center>
          {t('bubblePopInfo')}
        </AppText>
        <SpeakerButton onPress={() => english(target.en)} size={88} label={t('tapToListen')} testID="speaker" />
        <View style={styles.bubbles}>
          {round.optionIds.map((id, i) => {
            const word = content.word(id);
            if (!word) return null;
            return (
              <Bubble
                key={`${game.id}-${game.index}-${id}`}
                word={word}
                phase={i}
                popped={game.popped === id}
                missed={game.missed.includes(id)}
                onPress={() => tap(id)}
              />
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function Bubble({
  word,
  phase,
  popped,
  missed,
  onPress,
}: {
  word: VocabularyItem;
  phase: number;
  popped: boolean;
  missed: boolean;
  onPress: () => void;
}) {
  const calm = useCalm();
  const float = useSharedValue(0);
  useEffect(() => {
    if (calm) return;
    const duration = 1300 + phase * 230;
    float.value = withRepeat(withSequence(withTiming(-10, { duration }), withTiming(10, { duration })), -1, true);
  }, [calm, float, phase]);
  const floating = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  if (popped) {
    return (
      <View style={styles.bubbleSlot}>
        <Animated.Text entering={ZoomIn.duration(200)} exiting={ZoomOut} style={styles.popText}>
          💥
        </Animated.Text>
      </View>
    );
  }
  return (
    <View style={styles.bubbleSlot}>
      <Animated.View style={floating}>
        <Pressable
          testID={`bubble-${word.id}`}
          accessibilityRole="button"
          accessibilityLabel={word.en}
          disabled={missed}
          onPress={onPress}
          style={({ pressed }) => [styles.bubble, missed && styles.bubbleMissed, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
        >
          <View style={styles.shine} />
          <Text style={styles.bubbleEmoji}>{word.emoji}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/* ----------------------------------------------------------- Memory Match */

interface MemoryGame {
  readonly id: number;
  readonly board: MemoryBoard;
  readonly result: GameResult | null;
}

function newMemoryGame(id: number, words: readonly VocabularyItem[], seed: string): MemoryGame {
  return { id, board: createMemoryBoard(createRng(hashSeed(seed)), words), result: null };
}

function MemoryMatch() {
  const { t } = useT();
  const words = useAtomValue(playWordsAtom);
  const content = useAtomValue(contentAtom);
  const today = useAtomValue(todayAtom);
  const gamesToday = useAtomValue(gamesTodayAtom);
  const sfx = useSetAtom(playSfxAtom);
  const haptic = useSetAtom(hapticAtom);
  const { english } = useSpeak();
  const after = useTimers();
  const finish = useFinishGame('memory-match');
  const [game, setGame] = useState(() => newMemoryGame(0, words, `memory|${today}|${gamesToday}|0`));
  const { board } = game;
  const pairs = board.cards.length / 2;

  if (game.result) {
    return (
      <GameResults
        emoji="🃏"
        result={game.result}
        onReplay={() => setGame(newMemoryGame(game.id + 1, words, `memory|${today}|${gamesToday}|${game.id + 1}`))}
      />
    );
  }
  if (pairs < 2) return <NotEnoughWords />;

  const tap = (card: MemoryCard) => {
    const flipped = flipCard(board, card.id);
    if (flipped.result === 'ignored') return;
    const word = content.word(card.wordId);
    setGame({ ...game, board: flipped.board });
    if (flipped.result === 'match') {
      sfx('correct');
      haptic('success');
      if (word) english(word.en);
      if (isBoardSolved(flipped.board)) {
        const solved = flipped.board;
        after(700, () => {
          const result = finish(solved.matched.length, solved.matched.length, solved.moves);
          setGame((g) => ({ ...g, result }));
        });
      }
      return;
    }
    sfx('tap');
    if (card.face === 'word' && word) english(word.en);
    if (flipped.result === 'mismatch') {
      const open = flipped.board.open.join('|');
      // Turn a missed pair back over, unless the child already flipped another card.
      after(1000, () =>
        setGame((g) => (g.board.open.join('|') === open ? { ...g, board: closeOpenCards(g.board) } : g)),
      );
    }
  };

  return (
    <Screen background="#F1EDFF">
      <TopBar title={`🃏 ${t('memoryMatch')}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.memoryArea}>
        <View style={styles.memoryHeader}>
          <AppText variant="body" color={colors.inkSoft} style={styles.flex}>
            {t('memoryMatchInfo')}
          </AppText>
          <AppText variant="heading" numberOfLines={1}>
            {t('gameMoves', { n: board.moves })}
          </AppText>
        </View>
        <ProgressBar value={board.matched.length / pairs} color={colors.primary} />
        <View style={styles.cards}>
          {board.cards.map((card) => {
            const word = content.word(card.wordId);
            const matched = board.matched.includes(card.wordId);
            const open = matched || board.open.includes(card.id);
            return (
              <Pressable
                key={card.id}
                testID={`card-${card.id}`}
                accessibilityRole="button"
                accessibilityLabel={open && word ? (card.face === 'word' ? word.en : `${word.en} ${word.emoji}`) : t('cardFaceDown')}
                onPress={() => tap(card)}
                style={[styles.card, shadow, open ? styles.cardOpen : styles.cardClosed, matched && styles.cardMatched]}
              >
                {open && word ? (
                  <Animated.View key="face" entering={ZoomIn.duration(180)} style={styles.cardFace}>
                    {card.face === 'picture' ? (
                      <Text style={styles.cardEmoji}>{word.emoji}</Text>
                    ) : (
                      <AppText variant="heading" center numberOfLines={2}>
                        {word.en}
                      </AppText>
                    )}
                  </Animated.View>
                ) : (
                  <Text style={styles.cardBack}>🐾</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ------------------------------------------------------------------ I Spy */

interface SpyGame {
  readonly id: number;
  readonly scene: SpyScene;
  readonly index: number;
  readonly correct: number;
  readonly found: readonly string[];
  readonly missed: readonly string[];
  readonly result: GameResult | null;
}

function newSpyGame(id: number, words: readonly VocabularyItem[], seed: string): SpyGame {
  return { id, scene: createSpyScene(createRng(hashSeed(seed)), words), index: 0, correct: 0, found: [], missed: [], result: null };
}

const SPY_ITEM = 76;

function ISpy() {
  const { t } = useT();
  const words = useAtomValue(playWordsAtom);
  const content = useAtomValue(contentAtom);
  const today = useAtomValue(todayAtom);
  const gamesToday = useAtomValue(gamesTodayAtom);
  const sfx = useSetAtom(playSfxAtom);
  const haptic = useSetAtom(hapticAtom);
  const { english } = useSpeak();
  const after = useTimers();
  const finish = useFinishGame('i-spy');
  const [game, setGame] = useState(() => newSpyGame(0, words, `spy|${today}|${gamesToday}|0`));
  const targetId = game.scene.targets[game.index];
  const target = targetId ? content.word(targetId) : undefined;

  useEffect(() => {
    if (!target || game.result) return;
    const timer = setTimeout(() => english(target.en), 450);
    return () => clearTimeout(timer);
  }, [game.id, game.index, game.result, target, english]);

  if (game.result) {
    return (
      <GameResults
        emoji="🔍"
        result={game.result}
        onReplay={() => setGame(newSpyGame(game.id + 1, words, `spy|${today}|${gamesToday}|${game.id + 1}`))}
      />
    );
  }
  if (!target) return <NotEnoughWords />;

  const tap = (item: SpyItem) => {
    if (game.found.includes(item.wordId) || game.missed.includes(item.wordId)) return;
    if (item.wordId === target.id) {
      sfx('correct');
      haptic('success');
      const correct = game.correct + (game.missed.length === 0 ? 1 : 0);
      setGame({ ...game, found: [...game.found, item.wordId], correct });
      after(700, () => {
        const nextIndex = game.index + 1;
        if (nextIndex >= game.scene.targets.length) {
          const result = finish(correct, game.scene.targets.length);
          setGame((g) => ({ ...g, result }));
        } else {
          setGame((g) => ({ ...g, index: nextIndex, missed: [] }));
        }
      });
    } else {
      sfx('wrong');
      haptic('warning');
      setGame({ ...game, missed: [...game.missed, item.wordId] });
      after(350, () => english(target.en));
    }
  };

  return (
    <Screen background="#E8F7EA">
      <TopBar title={t('gameRound', { n: game.index + 1, total: game.scene.targets.length })} onBack={() => router.back()} />
      <View style={styles.playArea}>
        <ProgressBar value={game.index / game.scene.targets.length} color={colors.success} style={styles.progress} />
        <View style={styles.spyPrompt}>
          <SpeakerButton onPress={() => english(target.en)} size={72} label={t('tapToListen')} testID="speaker" />
          <AppText variant="heading" style={styles.flex}>
            {t('iSpyInfo')}
          </AppText>
        </View>
        <View style={styles.scene} accessibilityLabel={t('sceneFound', { n: game.found.length, total: game.scene.targets.length })}>
          <View style={styles.sky} />
          <View style={styles.grass} />
          {game.scene.items.map((item) => {
            const word = content.word(item.wordId);
            if (!word) return null;
            const found = game.found.includes(item.wordId);
            const missed = game.missed.includes(item.wordId);
            return (
              <Pressable
                key={`${game.id}-${item.wordId}`}
                testID={`spy-${item.wordId}`}
                accessibilityRole="button"
                accessibilityLabel={word.en}
                disabled={found || missed}
                aria-selected={found}
                onPress={() => tap(item)}
                style={[
                  styles.spyItem,
                  { left: `${item.x * 100}%`, top: `${item.y * 100}%`, transform: [{ rotate: `${item.tilt}deg` }, { scale: item.scale }] },
                  found && styles.spyFound,
                  missed && styles.spyMissed,
                ]}
              >
                <Text style={styles.spyEmoji}>{word.emoji}</Text>
                {found ? (
                  <Animated.Text entering={ZoomIn.duration(200)} style={styles.spyCheck}>
                    ✅
                  </Animated.Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

/* ------------------------------------------------------------ Odd One Out */

interface OddGame {
  readonly id: number;
  readonly rounds: readonly OddRound[];
  readonly index: number;
  readonly correct: number;
  readonly missed: readonly string[];
  readonly solved: boolean;
  readonly result: GameResult | null;
}

function newOddGame(id: number, words: readonly VocabularyItem[], categories: WorldCategories, seed: string): OddGame {
  return {
    id,
    rounds: createOddOneOutRounds(createRng(hashSeed(seed)), words, categories),
    index: 0,
    correct: 0,
    missed: [],
    solved: false,
    result: null,
  };
}

function OddOneOut() {
  const { t, l } = useT();
  const words = useAtomValue(metWordsAtom);
  const categories = useAtomValue(worldCategoriesAtom);
  const content = useAtomValue(contentAtom);
  const today = useAtomValue(todayAtom);
  const gamesToday = useAtomValue(gamesTodayAtom);
  const sfx = useSetAtom(playSfxAtom);
  const haptic = useSetAtom(hapticAtom);
  const { english } = useSpeak();
  const after = useTimers();
  const finish = useFinishGame('odd-one-out');
  const [game, setGame] = useState(() => newOddGame(0, words, categories, `odd|${today}|${gamesToday}|0`));
  const round = game.rounds[game.index];

  if (game.result) {
    return (
      <GameResults
        emoji="🤔"
        result={game.result}
        onReplay={() => setGame(newOddGame(game.id + 1, words, categories, `odd|${today}|${gamesToday}|${game.id + 1}`))}
      />
    );
  }
  if (!round) return <NotEnoughWords message={t('oddOneOutLocked')} />;
  const odd = content.word(round.oddId);
  const oddWorld = content.world(round.oddWorldId);

  const tap = (wordId: string) => {
    const word = content.word(wordId);
    if (game.solved || game.missed.includes(wordId) || !word) return;
    english(word.en);
    if (wordId === round.oddId) {
      sfx('correct');
      haptic('success');
      const correct = game.correct + (game.missed.length === 0 ? 1 : 0);
      setGame({ ...game, solved: true, correct });
      after(1800, () => {
        const nextIndex = game.index + 1;
        if (nextIndex >= game.rounds.length) {
          const result = finish(correct, game.rounds.length);
          setGame((g) => ({ ...g, result }));
        } else {
          setGame((g) => ({ ...g, index: nextIndex, missed: [], solved: false }));
        }
      });
    } else {
      sfx('wrong');
      haptic('warning');
      setGame({ ...game, missed: [...game.missed, wordId] });
    }
  };

  return (
    <Screen background="#FFF3E0">
      <TopBar title={t('gameRound', { n: game.index + 1, total: game.rounds.length })} onBack={() => router.back()} />
      <View style={styles.playArea}>
        <ProgressBar value={game.index / game.rounds.length} color={colors.orange} style={styles.progress} />
        <AppText variant="heading" center>
          {t('oddOneOutInfo')}
        </AppText>
        <View style={styles.oddGrid}>
          {round.optionIds.map((id) => {
            const word = content.word(id);
            if (!word) return null;
            const isOdd = id === round.oddId;
            return (
              <Pressable
                key={`${game.id}-${game.index}-${id}`}
                testID={`odd-${id}`}
                accessibilityRole="button"
                accessibilityLabel={word.en}
                disabled={game.solved || game.missed.includes(id)}
                onPress={() => tap(id)}
                style={({ pressed }) => [
                  styles.oddTile,
                  shadow,
                  game.missed.includes(id) && styles.oddMissed,
                  game.solved && isOdd && styles.oddRight,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.oddEmoji}>{word.emoji}</Text>
                <AppText variant="heading" center numberOfLines={2}>
                  {word.en}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        {game.solved && odd && oddWorld ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.oddWhy} testID="odd-why">
            <AppText variant="heading" center color={colors.successDark}>
              {odd.emoji} {t('oddOneOutWhy', { word: odd.en, world: l(oddWorld.title) })}
            </AppText>
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

/* ---------------------------------------------------------------- Shared */

function NotEnoughWords({ message }: { message?: string }) {
  const { t } = useT();
  return (
    <Screen>
      <TopBar onBack={() => router.back()} />
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🔒</Text>
        <AppText variant="heading" center>
          {message ?? t('gameLocked', { n: PLAY_TUNING.minWords })}
        </AppText>
      </View>
    </Screen>
  );
}

function GameResults({ emoji, result, onReplay }: { emoji: string; result: GameResult; onReplay: () => void }) {
  const { t } = useT();
  const pet = useAtomValue(activePetAtom);
  const { english } = useSpeak();
  useEffect(() => {
    english('Well played!');
  }, [english]);
  return (
    <Screen background={colors.backgroundWarm}>
      <ScrollView contentContainerStyle={styles.results}>
        <Animated.View entering={ZoomIn.springify()} style={styles.stretch}>
          <Card style={styles.resultCard}>
            <Text style={styles.bigEmoji}>{emoji}</Text>
            <AppText variant="hero" center color={colors.primary}>
              {t('gameOver')}
            </AppText>
            <AppText variant="title" center>
              {t('gameScore', { n: result.correct, total: result.total })}
            </AppText>
            {result.moves !== undefined ? (
              <AppText variant="body" center color={colors.inkSoft}>
                {t('gameMoves', { n: result.moves })}
              </AppText>
            ) : null}
            {pet ? <PetPortrait blueprint={pet.species.blueprint} stage={pet.stage} size={120} mood="wow" /> : null}
            <Animated.View entering={FadeIn.delay(300)}>
              <AppText variant="heading" center color={colors.berry}>
                {result.berries > 0 ? `🍓 ${t('earnedBerries', { n: result.berries })}` : ''}
              </AppText>
              {result.capped ? (
                <AppText variant="small" center color={colors.inkSoft}>
                  {t('gameBerriesCapped')}
                </AppText>
              ) : null}
            </Animated.View>
          </Card>
        </Animated.View>
        <BigButton label={t('playAgain')} icon="🔁" tone="success" onPress={onReplay} style={styles.stretch} testID="game-replay" />
        <BigButton label={t('continue')} tone="neutral" compact onPress={() => router.back()} style={styles.stretch} testID="game-done" />
      </ScrollView>
    </Screen>
  );
}

const BUBBLE = 132;

const styles = StyleSheet.create({
  playArea: { flex: 1, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  progress: { alignSelf: 'stretch' },
  bubbles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  bubbleSlot: { width: BUBBLE, height: BUBBLE + 20, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: 'rgba(89, 195, 255, 0.28)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleMissed: { opacity: 0.35 },
  shine: {
    position: 'absolute',
    top: 18,
    left: 24,
    width: 26,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    transform: [{ rotate: '-30deg' }],
  },
  bubbleEmoji: { fontSize: 60 },
  popText: { fontSize: 72 },
  memoryArea: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  card: {
    flexBasis: '30%',
    flexGrow: 0,
    aspectRatio: 0.82,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  cardClosed: { backgroundColor: colors.primary },
  cardOpen: { backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.primary },
  cardMatched: { backgroundColor: colors.successSoft, borderColor: colors.success },
  cardFace: { alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 48 },
  cardBack: { fontSize: 34, opacity: 0.85 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  flex: { flex: 1 },
  spyPrompt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
  scene: {
    alignSelf: 'stretch',
    aspectRatio: 0.95,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#BDE7FF',
  },
  sky: { position: 'absolute', left: 0, right: 0, top: 0, height: '45%', backgroundColor: '#BDE7FF' },
  grass: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: '#A5D6A7' },
  spyItem: {
    position: 'absolute',
    width: SPY_ITEM,
    height: SPY_ITEM,
    marginLeft: -SPY_ITEM / 2,
    marginTop: -SPY_ITEM / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spyEmoji: { fontSize: 50 },
  spyFound: { opacity: 0.55 },
  spyMissed: { opacity: 0.3 },
  spyCheck: { position: 'absolute', right: 0, bottom: 0, fontSize: 24 },
  oddGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, alignSelf: 'stretch' },
  oddTile: {
    flexBasis: '46%',
    flexGrow: 0,
    minHeight: 150,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: 4,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  oddEmoji: { fontSize: 58 },
  oddMissed: { opacity: 0.35 },
  oddRight: { borderColor: colors.success, backgroundColor: colors.successSoft },
  oddWhy: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, alignSelf: 'stretch' },
  bigEmoji: { fontSize: 72 },
  results: { padding: spacing.xl, gap: spacing.md, alignItems: 'center' },
  stretch: { alignSelf: 'stretch' },
  resultCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
});
