import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { HapticsService } from '@/application/ports';

/** Short vibrations that make taps feel physical. Ignored where unsupported. */
export function createExpoHapticsService(): HapticsService {
  return {
    trigger(kind) {
      if (Platform.OS === 'web') return;
      const run = async () => {
        switch (kind) {
          case 'tap':
            return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          case 'success':
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          case 'warning':
            return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      };
      run().catch(() => undefined);
    },
  };
}
