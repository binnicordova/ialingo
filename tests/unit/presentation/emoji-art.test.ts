import { emojiKey, emojiSvg } from '@/presentation/art/EmojiArt';
import { EMOJI_SVG } from '@/presentation/art/emoji-svg.generated';
import { getContentIndex } from '@/infrastructure/content/catalog';

describe('emoji art (SVG pictures for every exercise)', () => {
  const content = getContentIndex();
  const used = new Set<string>();
  for (const world of content.orderedWorlds) {
    used.add(world.emoji);
    for (const word of world.words) used.add(word.emoji);
    for (const sentence of world.sentences) used.add(sentence.emoji);
    for (const line of world.story?.lines ?? []) used.add(line.emoji);
    for (const line of world.song?.lines ?? []) used.add(line.emoji);
  }

  it('has vector art for every emoji in the content (run `npm run emoji-art` after adding content)', () => {
    const missing = [...used].filter((emoji) => emojiSvg(emoji) === undefined);
    expect(missing).toEqual([]);
  });

  it('ignores the emoji variation selector when looking art up', () => {
    expect(emojiKey('❤️')).toBe(emojiKey('❤'));
    expect(emojiKey('1️⃣')).toBe('31-20e3');
    expect(emojiSvg('🇲🇽')).toBeDefined();
  });

  it('stores well-formed, self-contained SVG with ids scoped per picture', () => {
    const ids = new Map<string, string>();
    for (const [key, svg] of Object.entries(EMOJI_SVG)) {
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
      for (const [, id] of svg.matchAll(/\bid="([^"]+)"/g)) {
        expect(ids.get(id ?? '') ?? key).toBe(key);
        ids.set(id ?? '', key);
      }
    }
  });
});
