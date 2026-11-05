import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { SoundEffect, SoundEffectsService } from '@/application/ports';

/** Bundled by Metro as assets. */
const SOURCES: Readonly<Record<SoundEffect, number>> = {
  tap: require('@/assets/sfx/tap.wav'),
  pop: require('@/assets/sfx/pop.wav'),
  correct: require('@/assets/sfx/correct.wav'),
  wrong: require('@/assets/sfx/wrong.wav'),
  coin: require('@/assets/sfx/coin.wav'),
  'level-up': require('@/assets/sfx/level-up.wav'),
  hatch: require('@/assets/sfx/hatch.wav'),
};

/**
 * Short bundled sound effects through expo-audio. Players are created lazily
 * and reused; a failure to play is never shown to the child.
 */
export function createExpoSfxService(): SoundEffectsService {
  const players = new Map<SoundEffect, AudioPlayer>();
  let configured = false;

  const configure = () => {
    if (configured) return;
    configured = true;
    // Speech and sounds are core to learning, so play them even when the
    // iPhone's silent switch is on. Never record, never play in background.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(
      () => undefined,
    );
  };

  return {
    play(effect) {
      try {
        configure();
        let player = players.get(effect);
        if (!player) {
          player = createAudioPlayer(SOURCES[effect]);
          player.volume = 0.6;
          players.set(effect, player);
        }
        void player.seekTo(0);
        player.play();
      } catch {
        // Sound is decoration; ignore failures.
      }
    },
  };
}
