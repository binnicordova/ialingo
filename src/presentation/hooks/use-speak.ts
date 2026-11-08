import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import type { Character } from '@/domain/characters/character';
import { speakAtom, stopSpeechAtom } from '@/state/actions';

/** Speech helpers bound to the parent's voice-speed setting. */
export function useSpeak() {
  const speak = useSetAtom(speakAtom);
  const stop = useSetAtom(stopSpeechAtom);

  /** English word or sentence (the language being learned). */
  const english = useCallback(
    (text: string, onDone?: () => void) => speak({ text, language: 'target', onDone }),
    [speak],
  );

  /** The same, slowly (the turtle button). */
  const englishSlow = useCallback(
    (text: string, onDone?: () => void) => speak({ text, language: 'target', slow: true, onDone }),
    [speak],
  );

  /** Text in the child's own language, in a guide's voice. */
  const native = useCallback(
    (text: string, character?: Character, onDone?: () => void) =>
      speak({ text, language: 'native', voice: character?.voice, onDone }),
    [speak],
  );

  /** English line in a guide's voice (cheers and encouragement). */
  const characterEnglish = useCallback(
    (text: string, character?: Character, onDone?: () => void) =>
      speak({ text, language: 'target', voice: character?.voice, onDone }),
    [speak],
  );

  return { english, englishSlow, native, characterEnglish, stop };
}
