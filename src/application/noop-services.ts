import { toDayKey } from '@/domain/shared/day';

import type { AppServices } from './ports';

/** In-memory services: the default before boot, and a test double. */
export function createNoopServices(today?: string): AppServices {
  let stored: unknown = null;
  return {
    repository: {
      load: async () => stored,
      save: async (snapshot) => {
        stored = snapshot;
      },
      clear: async () => {
        stored = null;
      },
    },
    speech: { speak: (_text, options) => options.onDone?.(), stop: () => undefined },
    sfx: { play: () => undefined },
    haptics: { trigger: () => undefined },
    clock: { today: () => today ?? toDayKey(new Date()), now: () => Date.now() },
  };
}
