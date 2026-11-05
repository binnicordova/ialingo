import { useAtomValue } from 'jotai';
import { memo, useEffect, useState } from 'react';
import Animated, {
  Easing,
  useReducedMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import type { CharacterLook } from '@/domain/characters/character';
import { settingsAtom } from '@/state/selectors';

import { shade } from '../theme/tokens';

export interface CharacterAvatarProps {
  readonly look: CharacterLook;
  readonly size?: number;
  /** Animates the mouth while the character is speaking. */
  readonly talking?: boolean;
  readonly mood?: 'happy' | 'cheer';
  readonly bob?: boolean;
}

/** The guide characters, drawn as SVG with a talking mouth and a gentle idle bob. */
export const CharacterAvatar = memo(function CharacterAvatar({
  look,
  size = 120,
  talking = false,
  mood = 'happy',
  bob = true,
}: CharacterAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const y = useSharedValue(0);
  const systemReduced = useReducedMotion();
  const calm = useAtomValue(settingsAtom).reducedMotion || systemReduced;
  const shouldBob = bob && !calm;

  useEffect(() => {
    if (!talking) return;
    const id = setInterval(() => setMouthOpen((open) => !open), 150);
    return () => clearInterval(id);
  }, [talking]);

  useEffect(() => {
    if (!shouldBob) return;
    y.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [shouldBob, y]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const line = shade(look.primary, 0.3);

  return (
    <Animated.View style={[{ width: size, height: size }, animated]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Ellipse cx={100} cy={188} rx={56} ry={8} fill="rgba(0,0,0,0.12)" />
        <Body look={look} line={line} />
        <FaceFeatures look={look} mouthOpen={talking && mouthOpen} mood={mood} />
        <Topper look={look} line={line} />
      </Svg>
    </Animated.View>
  );
});

function Body({ look, line }: { look: CharacterLook; line: string }) {
  const { primary, secondary, accent } = look;
  switch (look.kind) {
    case 'owl':
      return (
        <G>
          <Ellipse cx={40} cy={120} rx={20} ry={36} fill={shade(primary, 0.15)} transform="rotate(-15 40 120)" />
          <Ellipse cx={160} cy={120} rx={20} ry={36} fill={shade(primary, 0.15)} transform="rotate(15 160 120)" />
          <Polygon points="52,52 66,18 86,48" fill={primary} stroke={line} strokeWidth={4} strokeLinejoin="round" />
          <Polygon points="148,52 134,18 114,48" fill={primary} stroke={line} strokeWidth={4} strokeLinejoin="round" />
          <Ellipse cx={100} cy={112} rx={66} ry={72} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={140} rx={42} ry={40} fill={secondary} />
          <Ellipse cx={80} cy={176} rx={12} ry={7} fill={accent} />
          <Ellipse cx={120} cy={176} rx={12} ry={7} fill={accent} />
        </G>
      );
    case 'mouse':
      return (
        <G>
          <Circle cx={46} cy={56} r={32} fill={primary} stroke={line} strokeWidth={4} />
          <Circle cx={46} cy={56} r={18} fill={secondary} />
          <Circle cx={154} cy={56} r={32} fill={primary} stroke={line} strokeWidth={4} />
          <Circle cx={154} cy={56} r={18} fill={secondary} />
          <Ellipse cx={100} cy={118} rx={64} ry={66} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={146} rx={36} ry={30} fill={secondary} />
        </G>
      );
    case 'robot':
      return (
        <G>
          <Rect x={86} y={164} width={28} height={20} rx={6} fill={shade(primary, 0.2)} />
          <Rect x={26} y={98} width={18} height={34} rx={8} fill={accent} />
          <Rect x={156} y={98} width={18} height={34} rx={8} fill={accent} />
          <Rect x={40} y={52} width={120} height={120} rx={30} fill={primary} stroke={line} strokeWidth={4} />
          <Rect x={56} y={72} width={88} height={70} rx={20} fill={secondary} />
        </G>
      );
    case 'dino':
      return (
        <G>
          <Path d="M150 150 Q 190 150 186 112 Q 172 136 146 128 Z" fill={primary} stroke={line} strokeWidth={4} strokeLinejoin="round" />
          {[60, 84, 108, 132].map((x, i) => (
            <Polygon key={x} points={`${x - 12},${58 + (i % 2) * 2} ${x},${32 + (i % 2) * 2} ${x + 12},${58 + (i % 2) * 2}`} fill={accent} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          ))}
          <Ellipse cx={100} cy={116} rx={64} ry={66} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={146} rx={38} ry={32} fill={secondary} />
        </G>
      );
    case 'turtle':
      return (
        <G>
          <Ellipse cx={100} cy={150} rx={78} ry={40} fill={accent} stroke={shade(accent, 0.3)} strokeWidth={4} />
          {[64, 100, 136].map((x) => (
            <Polygon key={x} points={`${x - 14},150 ${x - 7},138 ${x + 7},138 ${x + 14},150 ${x + 7},162 ${x - 7},162`} fill={shade(accent, 0.15)} />
          ))}
          <Circle cx={100} cy={96} r={56} fill={primary} stroke={line} strokeWidth={4} />
          <Path d="M48 74 Q 100 40 152 74 L 150 86 Q 100 60 50 86 Z" fill="#FF7043" />
        </G>
      );
    case 'coconut':
      return (
        <G>
          <Circle cx={100} cy={118} r={68} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={124} rx={50} ry={46} fill={secondary} />
          {[70, 130, 100].map((x, i) => (
            <Circle key={x} cx={x} cy={i === 2 ? 60 : 66} r={4} fill={shade(primary, 0.35)} />
          ))}
        </G>
      );
    case 'cloud':
      return (
        <G>
          <Circle cx={150} cy={52} r={22} fill={accent} />
          {[
            [56, 120, 40],
            [144, 120, 40],
            [80, 88, 44],
            [124, 84, 46],
            [100, 132, 56],
          ].map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={secondary} stroke={primary} strokeWidth={5} />
          ))}
          {[
            [56, 120, 36],
            [144, 120, 36],
            [80, 88, 40],
            [124, 84, 42],
            [100, 132, 52],
          ].map(([x, y, r]) => (
            <Circle key={`f-${x}-${y}`} cx={x} cy={y} r={r} fill={secondary} />
          ))}
        </G>
      );
    case 'parrot':
      return (
        <G>
          <Path d="M66 40 Q 80 6 96 34 Q 106 4 118 36 Q 136 14 134 50 Z" fill={accent} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={150} cy={130} rx={24} ry={44} fill={shade(primary, 0.18)} transform="rotate(20 150 130)" />
          <Path d="M88 168 L 76 196 L 100 184 L 112 196 L 112 168 Z" fill={accent} />
          <Ellipse cx={100} cy={112} rx={62} ry={70} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={142} rx={36} ry={34} fill={secondary} />
        </G>
      );
    case 'beaver':
      return (
        <G>
          <Ellipse cx={160} cy={160} rx={34} ry={20} fill={shade(primary, 0.25)} transform="rotate(-25 160 160)" />
          <Path d="M140 150 L 180 170 M 146 162 L 176 150" stroke={shade(primary, 0.45)} strokeWidth={3} />
          <Circle cx={52} cy={62} r={18} fill={primary} stroke={line} strokeWidth={4} />
          <Circle cx={148} cy={62} r={18} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={116} rx={64} ry={66} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={144} rx={40} ry={30} fill={secondary} />
          <Path d="M54 56 Q 100 14 146 56 L 146 64 L 54 64 Z" fill="#FFC93C" stroke="#E0A800" strokeWidth={3} />
          <Rect x={46} y={60} width={108} height={9} rx={4} fill="#E0A800" />
        </G>
      );
    case 'lion':
      return (
        <G>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <Circle key={i} cx={100 + Math.cos(a) * 66} cy={108 + Math.sin(a) * 66} r={26} fill={accent} />;
          })}
          <Circle cx={56} cy={62} r={16} fill={primary} stroke={line} strokeWidth={4} />
          <Circle cx={144} cy={62} r={16} fill={primary} stroke={line} strokeWidth={4} />
          <Circle cx={100} cy={108} r={60} fill={primary} stroke={line} strokeWidth={4} />
          <Ellipse cx={100} cy={134} rx={30} ry={22} fill={secondary} />
        </G>
      );
  }
}

function FaceFeatures({ look, mouthOpen, mood }: { look: CharacterLook; mouthOpen: boolean; mood: 'happy' | 'cheer' }) {
  const eyeY = look.kind === 'robot' ? 100 : look.kind === 'turtle' ? 92 : 104;
  const mouthY = look.kind === 'robot' ? 126 : look.kind === 'turtle' ? 118 : 132;
  const isOwl = look.kind === 'owl';
  return (
    <G>
      {[-1, 1].map((s) => {
        const x = 100 + s * (isOwl ? 28 : 24);
        if (look.kind === 'robot') {
          return <Rect key={s} x={x - 9} y={eyeY - 12} width={18} height={24} rx={8} fill="#2D2A4A" />;
        }
        return (
          <G key={s}>
            {isOwl && <Circle cx={x} cy={eyeY} r={22} fill="#FFFFFF" stroke={look.accent} strokeWidth={5} />}
            {mood === 'cheer' ? (
              <Path d={`M${x - 9} ${eyeY + 3} Q ${x} ${eyeY - 9} ${x + 9} ${eyeY + 3}`} stroke="#2D2A4A" strokeWidth={5} strokeLinecap="round" fill="none" />
            ) : (
              <G>
                <Circle cx={x} cy={eyeY} r={isOwl ? 10 : 9} fill="#2D2A4A" />
                <Circle cx={x + 3} cy={eyeY - 3} r={3} fill="#FFFFFF" />
              </G>
            )}
          </G>
        );
      })}
      {isOwl ? (
        <Polygon points={`92,${eyeY + 22} 108,${eyeY + 22} 100,${eyeY + 36}`} fill={look.accent} />
      ) : null}
      {look.kind === 'mouse' && (
        <G>
          <Circle cx={100} cy={124} r={7} fill="#6D4C41" />
          <Path d="M70 128 L 46 122 M70 134 L 46 138 M130 128 L 154 122 M130 134 L 154 138" stroke="#6D4C41" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      )}
      {look.kind === 'lion' && <Path d="M92 124 L 108 124 L 100 132 Z" fill="#6D4C41" />}
      {look.kind === 'parrot' && (
        <Path d="M84 120 Q 100 108 116 120 Q 112 146 100 152 Q 92 140 84 120 Z" fill="#FFB300" stroke="#E68A00" strokeWidth={3} />
      )}
      {look.kind === 'beaver' && (
        <G>
          <Ellipse cx={100} cy={122} rx={10} ry={7} fill="#4E342E" />
          <Rect x={90} y={140} width={9} height={14} rx={2} fill={look.accent} stroke="#BDBDBD" strokeWidth={1.5} />
          <Rect x={101} y={140} width={9} height={14} rx={2} fill={look.accent} stroke="#BDBDBD" strokeWidth={1.5} />
        </G>
      )}
      <Ellipse cx={62} cy={mouthY - 8} rx={10} ry={6} fill="#FF8FB1" opacity={0.6} />
      <Ellipse cx={138} cy={mouthY - 8} rx={10} ry={6} fill="#FF8FB1" opacity={0.6} />
      {look.kind === 'parrot' ? (
        mouthOpen ? <Ellipse cx={100} cy={150} rx={7} ry={4} fill="#2D2A4A" /> : null
      ) : mouthOpen ? (
        <Ellipse cx={100} cy={mouthY + (isOwl ? 14 : 4)} rx={12} ry={10} fill="#2D2A4A" />
      ) : (
        <Path
          d={`M${88} ${mouthY + (isOwl ? 12 : 0)} Q 100 ${mouthY + (isOwl ? 24 : 14)} ${112} ${mouthY + (isOwl ? 12 : 0)}`}
          stroke="#2D2A4A"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </G>
  );
}

function Topper({ look, line }: { look: CharacterLook; line: string }) {
  switch (look.kind) {
    case 'mouse':
      return <Ellipse cx={100} cy={52} rx={40} ry={14} fill={look.accent} transform="rotate(-10 100 52)" />;
    case 'robot':
      return (
        <G>
          <Rect x={97} y={22} width={6} height={30} fill={line} />
          <Circle cx={100} cy={20} r={10} fill={look.accent} />
        </G>
      );
    case 'coconut':
      return (
        <G>
          <Rect x={62} y={40} width={76} height={22} rx={6} fill="#FFFFFF" stroke="#D6D3E8" strokeWidth={3} />
          <Circle cx={74} cy={34} r={18} fill="#FFFFFF" />
          <Circle cx={100} cy={26} r={22} fill="#FFFFFF" />
          <Circle cx={126} cy={34} r={18} fill="#FFFFFF" />
        </G>
      );
    case 'lion':
      return <Path d="M44 84 Q 100 60 156 84" stroke="#E53935" strokeWidth={10} strokeLinecap="round" fill="none" />;
    case 'dino':
      return null;
    default:
      return null;
  }
}
