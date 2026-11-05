import { router, usePathname } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { recordPlayTimeAtom, startDayAtom, stopSpeechAtom } from '@/state/actions';
import { clockTickAtom } from '@/state/core';
import { onboardedAtom, screenTimeAtom } from '@/state/selectors';

/** Seconds between play-time ticks. */
export const PLAY_TICK_SECONDS = 15;

/** Screens that stay open when the daily limit is reached. */
const ALLOWED_AFTER_LIMIT = ['/bedtime', '/parents', '/profiles'];

/**
 * App-wide lifecycle:
 * - counts foreground play time toward the parent's daily limit;
 * - sends the child to the bedtime screen when the limit is reached;
 * - on resume, refreshes "today" (daily gift, pet happiness, budget);
 * - on background, stops speech and flushes the save.
 */
export function useAppLifecycle(onBackground: () => void) {
  const pathname = usePathname();
  const onboarded = useAtomValue(onboardedAtom);
  const { limitReached } = useAtomValue(screenTimeAtom);
  const recordPlayTime = useSetAtom(recordPlayTimeAtom);
  const startDay = useSetAtom(startDayAtom);
  const bumpClock = useSetAtom(clockTickAtom);
  const stopSpeech = useSetAtom(stopSpeechAtom);
  const activeRef = useRef(AppState.currentState === 'active');
  const backgroundRef = useRef(onBackground);

  useEffect(() => {
    backgroundRef.current = onBackground;
  }, [onBackground]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasActive = activeRef.current;
      activeRef.current = next === 'active';
      if (next === 'active' && !wasActive) {
        bumpClock((n) => n + 1);
        startDay();
      } else if (next !== 'active' && wasActive) {
        stopSpeech();
        backgroundRef.current();
      }
    });
    return () => subscription.remove();
  }, [bumpClock, startDay, stopSpeech]);

  useEffect(() => {
    if (!onboarded) return;
    const id = setInterval(() => {
      if (activeRef.current) recordPlayTime(PLAY_TICK_SECONDS);
    }, PLAY_TICK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [onboarded, recordPlayTime]);

  useEffect(() => {
    if (onboarded && limitReached && !ALLOWED_AFTER_LIMIT.includes(pathname)) {
      stopSpeech();
      router.replace('/bedtime');
    }
  }, [onboarded, limitReached, pathname, stopSpeech]);
}
