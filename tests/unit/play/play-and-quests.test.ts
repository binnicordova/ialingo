import { albumPage, albumTotals, stickerState } from '@/domain/learning/album';
import { recordAnswer, type WordMastery } from '@/domain/learning/mastery';
import { createProgress, recordPracticeCompletion } from '@/domain/learning/progress';
import {
  berriesLeftToday,
  canPlayGames,
  closeOpenCards,
  createBubbleRounds,
  createMemoryBoard,
  createPlayState,
  flipCard,
  isBoardSolved,
  PLAY_TUNING,
  rollPlayDay,
  settleMiniGame,
} from '@/domain/play/mini-games';
import {
  advanceQuest,
  allQuestsDone,
  BASE_QUEST_KINDS,
  canClaimChest,
  claimChest,
  createQuestBoard,
  isQuestDone,
  QUEST_DEFINITIONS,
  QUEST_KINDS,
  rollQuestDay,
} from '@/domain/quests/quests';
import { createRng } from '@/domain/shared/rng';
import { makeWorld, TODAY, TOMORROW } from '../../helpers/fixtures';

const world = makeWorld();
const words = world.words;

function met(ids: readonly string[], box = 1): Record<string, WordMastery> {
  return Object.fromEntries(ids.map((id) => [id, { box, lastReviewDay: TODAY, seen: 2, correct: 1 }]));
}

describe('Play Park rules', () => {
  it('opens after a few words and caps game berries per day', () => {
    expect(canPlayGames(met(words.slice(0, PLAY_TUNING.minWords - 1).map((w) => w.id)))).toBe(false);
    expect(canPlayGames(met(words.slice(0, PLAY_TUNING.minWords).map((w) => w.id)))).toBe(true);

    let play = createPlayState(TODAY);
    const first = settleMiniGame(play, TODAY, 8);
    expect(first.berries).toBe(8);
    play = first.play;
    play = settleMiniGame(play, TODAY, 8).play;
    const third = settleMiniGame(play, TODAY, 8);
    expect(third.berries).toBe(PLAY_TUNING.dailyBerryCap - 16);
    expect(third.capped).toBe(true);
    expect(berriesLeftToday(third.play, TODAY)).toBe(0);
    expect(third.play.gamesToday).toBe(3);

    // A new day resets the cap but keeps the lifetime count.
    expect(berriesLeftToday(third.play, TOMORROW)).toBe(PLAY_TUNING.dailyBerryCap);
    expect(rollPlayDay(third.play, TOMORROW).totalGames).toBe(3);
    expect(settleMiniGame(third.play, TOMORROW, 5).berries).toBe(5);
  });

  it('builds bubble rounds with a target among distinct pictures', () => {
    const rounds = createBubbleRounds(createRng(3), words);
    expect(rounds).toHaveLength(PLAY_TUNING.bubbleRounds);
    for (const round of rounds) {
      expect(round.optionIds).toContain(round.targetId);
      expect(round.optionIds).toHaveLength(PLAY_TUNING.bubbleOptions);
      const emojis = round.optionIds.map((id) => words.find((w) => w.id === id)?.emoji);
      expect(new Set(emojis).size).toBe(emojis.length);
    }
    expect(createBubbleRounds(createRng(1), words.slice(0, 1))).toEqual([]);
  });

  it('plays a memory board to the end', () => {
    let board = createMemoryBoard(createRng(9), words, 4);
    expect(board.cards).toHaveLength(8);
    const pairIds = [...new Set(board.cards.map((c) => c.wordId))];
    // A miss: two cards of different words stay open until closed.
    const [a, b] = pairIds;
    const pictureA = board.cards.find((c) => c.wordId === a && c.face === 'picture')!;
    const wordB = board.cards.find((c) => c.wordId === b && c.face === 'word')!;
    board = flipCard(board, pictureA.id).board;
    const miss = flipCard(board, wordB.id);
    expect(miss.result).toBe('mismatch');
    expect(miss.board.open).toHaveLength(2);
    expect(flipCard(miss.board, wordB.id).result).toBe('ignored');
    board = closeOpenCards(miss.board);
    // Now match every pair.
    for (const id of pairIds) {
      const picture = board.cards.find((c) => c.wordId === id && c.face === 'picture')!;
      const word = board.cards.find((c) => c.wordId === id && c.face === 'word')!;
      board = flipCard(board, picture.id).board;
      const hit = flipCard(board, word.id);
      expect(hit.result).toBe('match');
      board = hit.board;
    }
    expect(isBoardSolved(board)).toBe(true);
    expect(board.moves).toBe(1 + pairIds.length);
    expect(flipCard(board, pictureA.id).result).toBe('ignored');
  });
});

describe('daily quests', () => {
  it('always asks for lessons and picks the rest from what is available', () => {
    const board = createQuestBoard(TODAY, QUEST_KINDS);
    expect(board.kinds[0]).toBe('lessons');
    expect(board.kinds).toHaveLength(3);
    expect(new Set(board.kinds).size).toBe(3);
    expect(createQuestBoard(TODAY, QUEST_KINDS)).toEqual(board);
    const basic = createQuestBoard(TODAY, BASE_QUEST_KINDS);
    for (const kind of basic.kinds) expect(BASE_QUEST_KINDS).toContain(kind);
  });

  it('completes quests, opens the chest once, and expires without penalty', () => {
    let board = createQuestBoard(TODAY, BASE_QUEST_KINDS);
    expect(canClaimChest(board)).toBe(false);
    for (const kind of board.kinds) {
      for (let i = 0; i < QUEST_DEFINITIONS[kind].target + 2; i += 1) board = advanceQuest(board, kind);
      expect(isQuestDone(board, kind)).toBe(true);
      expect(board.progress[kind]).toBe(QUEST_DEFINITIONS[kind].target);
    }
    expect(advanceQuest(board, 'game')).toBe(board);
    expect(allQuestsDone(board)).toBe(true);
    const claimed = claimChest(board);
    expect(claimed.chestClaimed).toBe(true);
    expect(claimed.chestsOpened).toBe(1);
    expect(claimChest(claimed)).toBe(claimed);

    const tomorrow = rollQuestDay(claimed, TOMORROW, QUEST_KINDS);
    expect(tomorrow.day).toBe(TOMORROW);
    expect(tomorrow.chestClaimed).toBe(false);
    expect(tomorrow.progress).toEqual({});
    expect(tomorrow.chestsOpened).toBe(1);
    expect(rollQuestDay(tomorrow, TOMORROW, QUEST_KINDS)).toBe(tomorrow);
  });
});

describe('sticker album', () => {
  it('turns mastery into sticker states and totals', () => {
    expect(stickerState(undefined)).toBe('locked');
    expect(stickerState({ box: 0, lastReviewDay: TODAY, seen: 1, correct: 0 })).toBe('met');
    expect(stickerState({ box: 2, lastReviewDay: TODAY, seen: 3, correct: 3 })).toBe('learned');
    expect(stickerState({ box: 4, lastReviewDay: TODAY, seen: 6, correct: 6 })).toBe('gold');
    const mastery = { ...met([words[0]!.id, words[1]!.id]), ...met([words[2]!.id], 5) };
    const page = albumPage(world, mastery);
    expect(page.collected).toBe(3);
    expect(page.gold).toBe(1);
    expect(albumTotals([page, albumPage(world, {})])).toEqual({ collected: 3, gold: 1, total: words.length * 2 });
  });
});

describe('Word Gym progress', () => {
  it('updates mastery and counts sessions without storing a lesson', () => {
    const progress = createProgress();
    const wordId = words[0]!.id;
    const first = recordPracticeCompletion(progress, {
      accuracy: 1,
      wordResults: [{ wordId, correct: true }],
      today: TODAY,
    });
    expect(first.firstCompletion).toBe(true);
    expect(first.progress.practiceSessions).toBe(1);
    expect(first.progress.lessons).toEqual({});
    expect(first.progress.mastery[wordId]).toEqual(recordAnswer(undefined, true, TODAY));
    expect(first.progress.daysPlayed).toEqual([TODAY]);
    const second = recordPracticeCompletion(first.progress, { accuracy: 0.5, wordResults: [], today: TODAY });
    expect(second.firstCompletion).toBe(false);
    expect(second.stars).toBe(1);
  });
});
