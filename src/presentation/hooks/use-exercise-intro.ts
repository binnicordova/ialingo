import { useEffect, useRef } from 'react';

import type { Character } from '@/domain/characters/character';

import { useSpeak } from './use-speak';

/**
 * Speaks an exercise's instruction in the child's language (only the first
 * time that kind appears in a lesson), then plays its English prompt. Runs
 * once per exercise id; the latest props are read through a ref so a
 * re-render never repeats the audio.
 */
export function useExerciseIntro(
  id: string,
  introduce: boolean,
  instruction: string,
  guide: Character | undefined,
  prompt?: () => void,
  delayMs = 280,
) {
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
    }, delayMs);
    return () => clearTimeout(timer);
  }, [id, native, delayMs]);
}
