import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import {
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { GrowthStage } from '@/domain/pets/leveling';
import type { PetBlueprint } from '@/domain/pets/species';

import {
  createPetScene,
  type AccessoryLook,
  type PetAction,
  type PetSceneController,
} from './pet-scene';
import { ThreeStage, type StageContext } from './ThreeStage';

export interface PetStageHandle {
  play(action: PetAction): void;
}

export interface PetStage3DProps {
  readonly blueprint: PetBlueprint;
  readonly stage: GrowthStage;
  readonly accessory?: AccessoryLook | null;
  readonly sleeping?: boolean;
  readonly mode?: 'pet' | 'egg';
  readonly background: string;
  readonly ground?: string;
  readonly closeUp?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  /** Called on a tap (not a drag). */
  readonly onTap?: () => void;
  readonly onHatched?: () => void;
  readonly accessibilityLabel?: string;
  readonly ref?: Ref<PetStageHandle>;
}

/**
 * Interactive 3D pet: drag to turn it, tap to play. Remount with a `key` to
 * show a different species; accessory, stage and sleep update live.
 */
export function PetStage3D({
  blueprint,
  stage,
  accessory = null,
  sleeping = false,
  mode = 'pet',
  background,
  ground = '#9CE58B',
  closeUp,
  style,
  onTap,
  onHatched,
  accessibilityLabel,
  ref,
}: PetStage3DProps) {
  const controllerRef = useRef<PetSceneController | null>(null);
  const queued = useRef<PetAction[]>([]);
  const callbacks = useRef({ onHatched });

  useEffect(() => {
    callbacks.current = { onHatched };
  }, [onHatched]);

  useImperativeHandle(
    ref,
    () => ({
      play(action) {
        if (controllerRef.current) controllerRef.current.play(action);
        else queued.current.push(action);
      },
    }),
    [],
  );

  const accessoryModel = accessory?.model;
  const accessoryColor = accessory?.color;
  useEffect(() => {
    controllerRef.current?.setAccessory(
      accessoryModel && accessoryColor ? { model: accessoryModel, color: accessoryColor } : null,
    );
  }, [accessoryModel, accessoryColor]);
  useEffect(() => controllerRef.current?.setStage(stage), [stage]);
  useEffect(() => controllerRef.current?.setSleeping(sleeping), [sleeping]);

  const touchStart = useRef({ x: 0, y: 0 });

  const setup = (ctx: StageContext) => {
    const controller = createPetScene(
      ctx,
      { blueprint, stage, accessory, sleeping, mode, ground, closeUp },
      { onHatched: () => callbacks.current.onHatched?.() },
    );
    controllerRef.current = controller;
    for (const action of queued.current) controller.play(action);
    queued.current = [];
    return {
      update: controller.update,
      dispose: () => {
        controller.dispose();
        controllerRef.current = null;
      },
    };
  };

  return (
    <View style={[styles.container, style]}>
      <ThreeStage setup={setup} background={background} style={StyleSheet.absoluteFill} />
      {/* Drag to turn the pet, tap to play (plain responder events, no gesture library). */}
      <View
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onAccessibilityTap={onTap}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event: GestureResponderEvent) => {
          touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        }}
        onResponderMove={(event: GestureResponderEvent) => {
          controllerRef.current?.dragYaw((event.nativeEvent.pageX - touchStart.current.x) * 0.012);
        }}
        onResponderRelease={(event: GestureResponderEvent) => {
          controllerRef.current?.dragYaw(null);
          const dx = event.nativeEvent.pageX - touchStart.current.x;
          const dy = event.nativeEvent.pageY - touchStart.current.y;
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) onTap?.();
        }}
        onResponderTerminate={() => controllerRef.current?.dragYaw(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});
