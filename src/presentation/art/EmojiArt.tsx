import { memo } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { EMOJI_SVG } from './emoji-svg.generated';

const VS16 = 0xfe0f;

/** Lookup key of an emoji: its codepoints in hex without U+FE0F ("1f44b", "30-20e3"). */
export function emojiKey(emoji: string): string {
  return [...emoji]
    .map((c) => c.codePointAt(0) ?? 0)
    .filter((cp) => cp !== VS16)
    .map((cp) => cp.toString(16))
    .join('-');
}

/** The SVG markup for an emoji, or undefined when there is no art for it. */
export function emojiSvg(emoji: string): string | undefined {
  return EMOJI_SVG[emojiKey(emoji)];
}

export interface EmojiArtProps {
  /** One emoji, as written in the content ("👋", "🇲🇽", "1️⃣"). */
  readonly emoji: string;
  /** Width and height in dp. */
  readonly size: number;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * An emoji drawn as vector art (Fluent Emoji Flat, see scripts/build-emoji-art.mjs):
 * the same crisp picture on every device and OS version, at any size, instead
 * of the system font's glyph. Decorative: the parent carries the label. Falls
 * back to the text glyph if an emoji has no art.
 */
export const EmojiArt = memo(function EmojiArt({ emoji, size, style }: EmojiArtProps) {
  const xml = emojiSvg(emoji);
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} accessible={false}>
      {xml ? (
        <SvgXml xml={xml} width={size} height={size} />
      ) : (
        <Text style={{ fontSize: size * 0.8, lineHeight: size }} allowFontScaling={false}>
          {emoji}
        </Text>
      )}
    </View>
  );
});

/** A row of emoji written with spaces between them (for example a lesson's words). */
export function EmojiRow({ text, size, gap = 4 }: { text: string; size: number; gap?: number }) {
  const emoji = text.split(/\s+/).filter((e) => e.length > 0);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center' }}>
      {emoji.map((e, i) => (
        <EmojiArt key={`${e}-${i}`} emoji={e} size={size} />
      ))}
    </View>
  );
}
