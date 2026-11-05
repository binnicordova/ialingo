import { Platform } from 'react-native';

/**
 * Design tokens: bright candy colors with strong contrast for text, chunky
 * radii, and big tap targets (at least 56 pt) sized for small fingers.
 */
export const colors = {
  ink: '#2D2A4A',
  inkSoft: '#5B5876',
  muted: '#8C89A6',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F4FF',
  background: '#EEF6FF',
  backgroundWarm: '#FFF6E9',
  border: '#E3E0F2',
  primary: '#6C4BF4',
  primaryDark: '#4F33C9',
  primarySoft: '#E9E3FF',
  orange: '#FF8A3D',
  orangeDark: '#D96A20',
  success: '#3CC46B',
  successDark: '#2A9A51',
  successSoft: '#E3F9EA',
  danger: '#FF5A6A',
  dangerDark: '#D63B4B',
  dangerSoft: '#FFE6E9',
  yellow: '#FFC93C',
  yellowDark: '#E0A800',
  sky: '#59C3FF',
  skyDark: '#2E9BD6',
  berry: '#E8436B',
  locked: '#C9C6DA',
  shadow: 'rgba(45, 42, 74, 0.18)',
  overlay: 'rgba(30, 24, 60, 0.55)',
} as const;

export const radii = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Minimum tap target, larger than the 44 pt guideline, for children. */
export const TAP_TARGET = 56;

export const fonts = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const typeScale = {
  hero: 34,
  title: 28,
  heading: 22,
  body: 18,
  small: 15,
  tiny: 13,
} as const;

export const shadow = Platform.select({
  web: { boxShadow: '0 6px 16px rgba(45, 42, 74, 0.14)' },
  default: {
    shadowColor: '#2D2A4A',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
}) as object;

/** Darkens a hex color (for 3D button edges and outlines). */
export function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const num = Number.parseInt(value.length === 3 ? value.replace(/(.)/g, '$1$1') : value, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 0xff) * (1 - amount));
  const g = clamp(((num >> 8) & 0xff) * (1 - amount));
  const b = clamp((num & 0xff) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Mixes a hex color toward white (for soft tinted backgrounds). */
export function tint(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const num = Number.parseInt(value, 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
