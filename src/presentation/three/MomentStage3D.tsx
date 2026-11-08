import { useImperativeHandle, useRef, type Ref } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GrowthStage } from '@/domain/pets/leveling';
import type { PetBlueprint } from '@/domain/pets/species';

import { useCalm } from '../hooks/use-calm';
import { createMomentScene, type MomentSceneController, type MomentStyle } from './moment-scene';
import type { AccessoryLook } from './pet-scene';
import { ThreeStage, type StageContext } from './ThreeStage';

export interface MomentStageHandle {
  /** Another hop with a confetti burst. */
  cheer(): void;
}

export interface MomentStage3DProps {
  readonly blueprint: PetBlueprint;
  readonly stage: GrowthStage;
  readonly accessory?: AccessoryLook | null;
  readonly moment: MomentStyle;
  readonly sky: readonly [string, string];
  readonly style?: StyleProp<ViewStyle>;
  /** When set, the stage is a button (for example "tap your pet to cheer again"). */
  readonly onTap?: () => void;
  readonly accessibilityLabel?: string;
  readonly ref?: Ref<MomentStageHandle>;
}

/** The child's pet in a celebration sky (see `moment-scene.ts`). One GL context. */
export function MomentStage3D({
  blueprint,
  stage,
  accessory = null,
  moment,
  sky,
  style,
  onTap,
  accessibilityLabel,
  ref,
}: MomentStage3DProps) {
  const calm = useCalm();
  const controller = useRef<MomentSceneController | null>(null);
  useImperativeHandle(ref, () => ({ cheer: () => controller.current?.cheer() }), []);

  const setup = (ctx: StageContext) => {
    const scene = createMomentScene(ctx, { blueprint, stage, accessory, style: moment, sky, calm });
    controller.current = scene;
    return {
      update: scene.update,
      dispose: () => {
        scene.dispose();
        controller.current = null;
      },
    };
  };

  return (
    <View style={[styles.container, style]}>
      {/* The same sky as the 3D dome, shown while Android creates the GL surface (about 0.5 s). */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="moment-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky[0]} />
            <Stop offset="1" stopColor={sky[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#moment-sky)" />
      </Svg>
      <ThreeStage setup={setup} background={sky[0]} style={StyleSheet.absoluteFill} />
      {onTap ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onTap}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
