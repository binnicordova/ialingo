import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

import { STAGE_SCALE, type GrowthStage } from '@/domain/pets/leveling';
import type { PetBlueprint } from '@/domain/pets/species';

import { shade } from '../theme/tokens';

export type PortraitMood = 'happy' | 'sleep' | 'wow';

export interface PetPortraitProps {
  readonly blueprint: PetBlueprint;
  readonly size?: number;
  readonly stage?: GrowthStage;
  readonly mood?: PortraitMood;
  /** Emoji of the equipped accessory, drawn on the head. */
  readonly accessoryEmoji?: string | null;
  /** Shows a dark silhouette for pets not yet discovered. */
  readonly silhouette?: boolean;
}

const BODY_RADII = {
  round: { rx: 62, ry: 58 },
  tall: { rx: 54, ry: 66 },
  wide: { rx: 72, ry: 52 },
} as const;

/**
 * 2D portrait generated from the same blueprint as the 3D model. Used in
 * lists, the lesson HUD and anywhere a WebGL context would be too heavy.
 */
export const PetPortrait = memo(function PetPortrait({
  blueprint: bp,
  size = 120,
  stage = 'kid',
  mood = 'happy',
  accessoryEmoji,
  silhouette,
}: PetPortraitProps) {
  const { rx, ry } = BODY_RADII[bp.body];
  const cx = 100;
  const cy = 120;
  const top = cy - ry;
  const fill = silhouette ? '#3F3B5C' : bp.primary;
  const line = silhouette ? '#2B2840' : shade(bp.primary, 0.25);
  const second = silhouette ? '#4A4668' : bp.secondary;
  const accent = silhouette ? '#3F3B5C' : bp.accent;
  const scale = STAGE_SCALE[stage];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <G
          transform={`translate(${100 - 100 * scale} ${200 - 200 * scale}) scale(${scale})`}
        >
          {/* Ground shadow */}
          <Ellipse cx={cx} cy={cy + ry + 6} rx={rx * 0.8} ry={8} fill="rgba(0,0,0,0.12)" />

          {/* Behind the body */}
          {bp.extra === 'wings' && (
            <G>
              <Ellipse cx={cx - rx - 8} cy={cy - 10} rx={26} ry={16} fill={second} stroke={line} strokeWidth={3} transform={`rotate(-25 ${cx - rx - 8} ${cy - 10})`} />
              <Ellipse cx={cx + rx + 8} cy={cy - 10} rx={26} ry={16} fill={second} stroke={line} strokeWidth={3} transform={`rotate(25 ${cx + rx + 8} ${cy - 10})`} />
            </G>
          )}
          {bp.extra === 'mane' && (
            <G>
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                  <Circle
                    key={i}
                    cx={cx + Math.cos(a) * rx * 0.95}
                    cy={cy - 6 + Math.sin(a) * ry * 0.9}
                    r={20}
                    fill={silhouette ? fill : bp.accent}
                  />
                );
              })}
            </G>
          )}
          {bp.extra === 'spikes' && (
            <G>
              {[-40, -14, 14, 40].map((dx) => (
                <Polygon
                  key={dx}
                  points={`${cx + dx - 13},${top + 22} ${cx + dx},${top - 18} ${cx + dx + 13},${top + 22}`}
                  fill={accent}
                  stroke={line}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
              ))}
            </G>
          )}
          {bp.extra === 'shell' && (
            <Ellipse cx={cx} cy={cy - 8} rx={rx + 10} ry={ry * 0.85} fill={accent} stroke={shade(bp.accent, 0.25)} strokeWidth={4} />
          )}
          {bp.extra === 'fins' && (
            <G>
              <Polygon points={`${cx - rx + 6},${cy + 10} ${cx - rx - 26},${cy + 26} ${cx - rx + 4},${cy + 34}`} fill={accent} stroke={line} strokeWidth={3} strokeLinejoin="round" />
              <Polygon points={`${cx + rx - 6},${cy + 10} ${cx + rx + 26},${cy + 26} ${cx + rx - 4},${cy + 34}`} fill={accent} stroke={line} strokeWidth={3} strokeLinejoin="round" />
              <Polygon points={`${cx - 12},${top + 8} ${cx},${top - 22} ${cx + 12},${top + 8}`} fill={accent} stroke={line} strokeWidth={3} strokeLinejoin="round" />
            </G>
          )}
          <Tail style={bp.tail} cx={cx} cy={cy} rx={rx} fill={fill} accent={accent} line={line} second={second} />
          <Ears style={bp.ears} cx={cx} top={top} rx={rx} fill={fill} inner={second} accent={accent} line={line} />

          {/* Body */}
          <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={line} strokeWidth={4} />
          {!silhouette && bp.pattern === 'belly' && (
            <Ellipse cx={cx} cy={cy + ry * 0.38} rx={rx * 0.58} ry={ry * 0.45} fill={second} />
          )}
          {!silhouette && bp.pattern === 'spots' && (
            <G>
              <Circle cx={cx - rx * 0.55} cy={cy + 6} r={9} fill={accent} opacity={0.75} />
              <Circle cx={cx + rx * 0.6} cy={cy - 18} r={7} fill={accent} opacity={0.75} />
              <Circle cx={cx + rx * 0.35} cy={cy + ry * 0.55} r={10} fill={accent} opacity={0.75} />
              <Circle cx={cx - rx * 0.2} cy={cy - ry * 0.65} r={6} fill={accent} opacity={0.75} />
            </G>
          )}
          {/* Feet */}
          <Ellipse cx={cx - rx * 0.42} cy={cy + ry - 2} rx={14} ry={9} fill={line} />
          <Ellipse cx={cx + rx * 0.42} cy={cy + ry - 2} rx={14} ry={9} fill={line} />

          {/* On top */}
          {bp.extra === 'leaf' && (
            <G>
              <Path d={`M${cx} ${top + 6} C ${cx - 4} ${top - 16} ${cx - 30} ${top - 26} ${cx - 34} ${top - 14} C ${cx - 30} ${top - 2} ${cx - 10} ${top + 2} ${cx} ${top + 6} Z`} fill={silhouette ? fill : '#43A047'} stroke={line} strokeWidth={3} />
              <Path d={`M${cx} ${top + 6} C ${cx + 4} ${top - 18} ${cx + 26} ${top - 28} ${cx + 32} ${top - 18} C ${cx + 28} ${top - 4} ${cx + 10} ${top + 2} ${cx} ${top + 6} Z`} fill={silhouette ? fill : '#66BB6A'} stroke={line} strokeWidth={3} />
            </G>
          )}
          {bp.extra === 'horn' && (
            <Polygon points={`${cx - 10},${top + 10} ${cx},${top - 30} ${cx + 10},${top + 10}`} fill={silhouette ? fill : '#FFD54F'} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          )}

          {!silhouette && <Face cx={cx} cy={cy - ry * 0.12} eyes={bp.eyes} mood={mood} />}
          {silhouette && (
            <Path d={`M${cx - 10} ${cy - 6} Q ${cx} ${cy - 26} ${cx + 10} ${cy - 6} Q ${cx + 10} ${cy + 4} ${cx} ${cy + 8} L ${cx} ${cy + 14} M ${cx} ${cy + 24} L ${cx} ${cy + 26}`} stroke="#9A96BF" strokeWidth={7} strokeLinecap="round" fill="none" />
          )}
        </G>
      </Svg>
      {accessoryEmoji && !silhouette ? (
        <Text
          style={[
            styles.accessory,
            {
              fontSize: size * 0.28 * scale,
              top: size * (1 - scale) + size * (top / 200) * scale - size * 0.2 * scale,
            },
          ]}
        >
          {accessoryEmoji}
        </Text>
      ) : null}
    </View>
  );
});

function Face({ cx, cy, eyes, mood }: { cx: number; cy: number; eyes: PetBlueprint['eyes']; mood: PortraitMood }) {
  const ex = 24;
  const closed = mood === 'sleep';
  return (
    <G>
      {[-1, 1].map((side) => {
        const x = cx + side * ex;
        if (closed || eyes === 'sleepy') {
          return (
            <Path
              key={side}
              d={closed ? `M${x - 10} ${cy} Q ${x} ${cy + 8} ${x + 10} ${cy}` : `M${x - 10} ${cy + 2} Q ${x} ${cy - 8} ${x + 10} ${cy + 2}`}
              stroke="#2D2A4A"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
          );
        }
        const big = eyes === 'sparkle' || mood === 'wow';
        return (
          <G key={side}>
            <Ellipse cx={x} cy={cy} rx={big ? 13 : 11} ry={big ? 15 : 12} fill="#FFFFFF" />
            <Circle cx={x} cy={cy + 1} r={big ? 9 : 7} fill="#2D2A4A" />
            <Circle cx={x + 3} cy={cy - 3} r={3.2} fill="#FFFFFF" />
            {eyes === 'sparkle' && <Circle cx={x - 3} cy={cy + 4} r={1.8} fill="#FFFFFF" />}
          </G>
        );
      })}
      <Ellipse cx={cx - 40} cy={cy + 20} rx={10} ry={6} fill="#FF8FB1" opacity={0.55} />
      <Ellipse cx={cx + 40} cy={cy + 20} rx={10} ry={6} fill="#FF8FB1" opacity={0.55} />
      {mood === 'wow' ? (
        <Ellipse cx={cx} cy={cy + 22} rx={7} ry={9} fill="#2D2A4A" />
      ) : closed ? (
        <Path d={`M${cx - 6} ${cy + 20} Q ${cx} ${cy + 24} ${cx + 6} ${cy + 20}`} stroke="#2D2A4A" strokeWidth={4} strokeLinecap="round" fill="none" />
      ) : (
        <G>
          <Path d={`M${cx - 12} ${cy + 16} Q ${cx} ${cy + 32} ${cx + 12} ${cy + 16} Z`} fill="#2D2A4A" />
          <Path d={`M${cx - 6} ${cy + 24} Q ${cx} ${cy + 30} ${cx + 6} ${cy + 24} Z`} fill="#FF6F91" />
        </G>
      )}
    </G>
  );
}

function Ears({
  style,
  cx,
  top,
  rx,
  fill,
  inner,
  accent,
  line,
}: {
  style: PetBlueprint['ears'];
  cx: number;
  top: number;
  rx: number;
  fill: string;
  inner: string;
  accent: string;
  line: string;
}) {
  const dx = rx * 0.55;
  switch (style) {
    case 'cat':
      return (
        <G>
          {[-1, 1].map((s) => (
            <G key={s}>
              <Polygon points={`${cx + s * dx - 22},${top + 26} ${cx + s * (dx + 6)},${top - 22} ${cx + s * dx + 22},${top + 26}`} fill={fill} stroke={line} strokeWidth={4} strokeLinejoin="round" />
              <Polygon points={`${cx + s * dx - 10},${top + 20} ${cx + s * (dx + 5)},${top - 6} ${cx + s * dx + 10},${top + 20}`} fill={inner} />
            </G>
          ))}
        </G>
      );
    case 'bunny':
      return (
        <G>
          {[-1, 1].map((s) => (
            <G key={s} transform={`rotate(${s * 10} ${cx + s * dx * 0.7} ${top + 10})`}>
              <Ellipse cx={cx + s * dx * 0.7} cy={top - 26} rx={15} ry={40} fill={fill} stroke={line} strokeWidth={4} />
              <Ellipse cx={cx + s * dx * 0.7} cy={top - 22} rx={7} ry={28} fill={inner} />
            </G>
          ))}
        </G>
      );
    case 'round':
      return (
        <G>
          {[-1, 1].map((s) => (
            <G key={s}>
              <Circle cx={cx + s * dx} cy={top + 10} r={20} fill={fill} stroke={line} strokeWidth={4} />
              <Circle cx={cx + s * dx} cy={top + 12} r={10} fill={inner} />
            </G>
          ))}
        </G>
      );
    case 'floppy':
      return (
        <G>
          {[-1, 1].map((s) => (
            <Ellipse key={s} cx={cx + s * (rx * 0.82)} cy={top + 46} rx={16} ry={34} fill={accent} stroke={line} strokeWidth={4} transform={`rotate(${s * -18} ${cx + s * (rx * 0.82)} ${top + 46})`} />
          ))}
        </G>
      );
    case 'horns':
      return (
        <G>
          {[-1, 1].map((s) => (
            <Path key={s} d={`M${cx + s * dx - 9} ${top + 20} Q ${cx + s * (dx + 18)} ${top - 4} ${cx + s * (dx + 6)} ${top - 24} Q ${cx + s * (dx + 2)} ${top + 4} ${cx + s * dx + 9} ${top + 20} Z`} fill="#FFF3C4" stroke={line} strokeWidth={3} strokeLinejoin="round" />
          ))}
        </G>
      );
    case 'antenna':
      return (
        <G>
          {[-1, 1].map((s) => (
            <G key={s}>
              <Path d={`M${cx + s * 16} ${top + 8} Q ${cx + s * 22} ${top - 20} ${cx + s * 34} ${top - 30}`} stroke={line} strokeWidth={4} strokeLinecap="round" fill="none" />
              <Circle cx={cx + s * 34} cy={top - 30} r={8} fill={accent} stroke={line} strokeWidth={3} />
            </G>
          ))}
        </G>
      );
    case 'none':
      return null;
  }
}

function Tail({
  style,
  cx,
  cy,
  rx,
  fill,
  accent,
  line,
  second,
}: {
  style: PetBlueprint['tail'];
  cx: number;
  cy: number;
  rx: number;
  fill: string;
  accent: string;
  line: string;
  second: string;
}) {
  const x = cx + rx - 6;
  switch (style) {
    case 'fluffy':
      return <Ellipse cx={x + 18} cy={cy + 14} rx={24} ry={18} fill={second} stroke={line} strokeWidth={4} />;
    case 'long':
      return <Path d={`M${x - 4} ${cy + 26} Q ${x + 46} ${cy + 30} ${x + 36} ${cy - 20}`} stroke={line} strokeWidth={12} strokeLinecap="round" fill="none" />;
    case 'fish':
      return <Polygon points={`${x - 6},${cy + 20} ${x + 36},${cy - 6} ${x + 40},${cy + 44}`} fill={accent} stroke={line} strokeWidth={4} strokeLinejoin="round" />;
    case 'curly':
      return <Path d={`M${x - 4} ${cy + 20} C ${x + 34} ${cy + 26} ${x + 34} ${cy - 10} ${x + 18} ${cy - 6} C ${x + 6} ${cy - 2} ${x + 12} ${cy + 12} ${x + 22} ${cy + 6}`} stroke={line} strokeWidth={8} strokeLinecap="round" fill="none" />;
    case 'stub':
      return <Circle cx={x + 6} cy={cy + 22} r={12} fill={fill} stroke={line} strokeWidth={4} />;
    case 'none':
      return null;
  }
}

/** Egg drawing used for eggs waiting to hatch and during onboarding. */
export const EggPortrait = memo(function EggPortrait({
  blueprint,
  size = 120,
  wobble = 0,
}: {
  blueprint: PetBlueprint;
  size?: number;
  wobble?: number;
}) {
  const base = blueprint.secondary;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Ellipse cx={100} cy={186} rx={52} ry={8} fill="rgba(0,0,0,0.12)" />
      <G transform={`rotate(${wobble} 100 180)`}>
        <Path
          d="M100 24 C 146 24 164 98 164 128 C 164 166 136 186 100 186 C 64 186 36 166 36 128 C 36 98 54 24 100 24 Z"
          fill={base}
          stroke={shade(blueprint.primary, 0.2)}
          strokeWidth={5}
        />
        <Circle cx={76} cy={98} r={13} fill={blueprint.primary} />
        <Circle cx={126} cy={78} r={9} fill={blueprint.accent} />
        <Circle cx={128} cy={138} r={15} fill={blueprint.primary} />
        <Circle cx={80} cy={150} r={8} fill={blueprint.accent} />
        <Path d="M60 88 Q 66 60 86 46" stroke="rgba(255,255,255,0.8)" strokeWidth={8} strokeLinecap="round" fill="none" />
      </G>
    </Svg>
  );
});

const styles = StyleSheet.create({
  accessory: { position: 'absolute', alignSelf: 'center', textAlign: 'center' },
});
