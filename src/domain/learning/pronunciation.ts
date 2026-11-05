/**
 * Pronunciation scoring for speaking practice.
 *
 * The recognizer runs on the device and returns a few transcript
 * alternatives. They are not biased toward the target word (the scoring is
 * error-preserving): a child who says "dok" should hear "almost", not be
 * silently corrected to "dog".
 *
 * Verdicts, lenient by design for 6–10 year olds learning English as a
 * second language:
 * - great: what we heard is the target, contains it, or sounds the same
 *   (be / bee, tree / three);
 * - good: clearly close (a similar sound or spelling) → a friendly tip;
 * - try-again: something else, or nothing heard.
 */
export type SpeakVerdict = 'great' | 'good' | 'try-again';

export const PRONUNCIATION_TUNING = {
  /** Text or sound similarity needed for "good". */
  goodSimilarity: 0.6,
  /** Spelling similarity that must accompany a sound match for "great". */
  greatTextFloor: 0.6,
  /** Share of a sentence's words that must be heard for "great" / "good". */
  sentenceGreat: 0.85,
  sentenceGood: 0.5,
  /** Attempts before moving on (no frustration loops). */
  maxAttempts: 3,
} as const;

const NUMBER_WORDS: Readonly<Record<string, string>> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '100': 'hundred',
};

/** Lowercase, no accents, digits spelled out, no punctuation, single spaces. */
export function normalizeUtterance(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => NUMBER_WORDS[token] ?? token)
    .join(' ');
}

/**
 * A rough "how it sounds" key that folds spellings and the sound swaps Spanish
 * and Portuguese speakers often make (th→t, v→b, sh/ch, silent letters).
 */
export function phoneticKey(text: string): string {
  return normalizeUtterance(text).split(' ').map(foldWord).join(' ');
}

/** No regex lookbehind here, so it behaves the same on every JS engine (Hermes, JSC, V8). */
function foldWord(word: string): string {
  let w = word
    .replace(/^kn/, 'n')
    .replace(/^wr/, 'r')
    .replace(/ph/g, 'f')
    .replace(/gh/g, '')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'kw')
    .replace(/q/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/v/g, 'b')
    .replace(/th/g, 't')
    .replace(/sh|ch/g, 'x')
    .replace(/h/g, '')
    .replace(/ee|ea|ie|ey/g, 'i')
    .replace(/oo|ou/g, 'u');
  // Silent final "e" (cake → kak); in short words like "be" or "we" it sounds like "ee".
  if (w.length > 2 && w.endsWith('e')) w = w.slice(0, -1);
  else if (w.length === 2 && /^[^aeiou]e$/.test(w)) w = `${w[0]}i`;
  return w.replace(/([aeiouy])[aeiouy]+/g, '$1').replace(/(.)\1+/g, '$1');
}

/** Levenshtein edit distance. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** 1 = identical, 0 = nothing in common. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest;
}

export interface SpeakScore {
  readonly verdict: SpeakVerdict;
  /** The alternative that scored best (shown as "I heard: …"). */
  readonly heard: string | null;
  readonly score: number;
}

function scoreWord(target: string, heard: string): { score: number; great: boolean } {
  const t = normalizeUtterance(target);
  const h = normalizeUtterance(heard);
  if (!h) return { score: 0, great: false };
  if (h === t || ` ${h} `.includes(` ${t} `)) return { score: 1, great: true };
  const text = Math.max(similarity(h, t), ...h.split(' ').map((w) => similarity(w, t)));
  const targetKey = phoneticKey(t);
  const sound = Math.max(
    similarity(phoneticKey(h), targetKey),
    ...h.split(' ').map((w) => similarity(phoneticKey(w), targetKey)),
  );
  const great = sound === 1 && text >= PRONUNCIATION_TUNING.greatTextFloor;
  return { score: great ? 0.95 : Math.max(text, sound), great };
}

function scoreSentence(target: string, heard: string): number {
  const targetWords = normalizeUtterance(target).split(' ').filter(Boolean);
  const heardWords = normalizeUtterance(heard).split(' ').filter(Boolean);
  if (targetWords.length === 0 || heardWords.length === 0) return 0;
  const heardKeys = new Set(heardWords.map(phoneticKey));
  const found = targetWords.filter((w) => heardWords.includes(w) || heardKeys.has(phoneticKey(w)));
  return found.length / targetWords.length;
}

/** Scores the recognizer's alternatives against the target word or sentence. */
export function scoreUtterance(target: string, alternatives: readonly string[]): SpeakScore {
  const isSentence = normalizeUtterance(target).includes(' ');
  let best: SpeakScore = { verdict: 'try-again', heard: null, score: 0 };
  for (const alternative of alternatives) {
    if (!normalizeUtterance(alternative)) continue;
    let verdict: SpeakVerdict;
    let score: number;
    if (isSentence) {
      score = scoreSentence(target, alternative);
      verdict =
        score >= PRONUNCIATION_TUNING.sentenceGreat
          ? 'great'
          : score >= PRONUNCIATION_TUNING.sentenceGood
            ? 'good'
            : 'try-again';
    } else {
      const word = scoreWord(target, alternative);
      score = word.score;
      verdict = word.great ? 'great' : score >= PRONUNCIATION_TUNING.goodSimilarity ? 'good' : 'try-again';
    }
    if (score > best.score) best = { verdict, heard: alternative, score };
  }
  return best;
}

/** A speaking attempt counts as correct unless the child needs to try again. */
export function isPassingVerdict(verdict: SpeakVerdict | 'self-check'): boolean {
  return verdict !== 'try-again';
}
