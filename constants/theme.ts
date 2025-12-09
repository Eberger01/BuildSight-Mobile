/**
 * BuildSight Design System
 * Converted from CSS variables to React Native compatible format
 */

import { Platform } from 'react-native';

export const colors = {
  // Primary - Blue (Professional Construction Theme)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#2196F3',  // Main primary color
    600: '#1976D2',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#0a3069',
  },

  // Accent - Orange (Construction/Warning Theme)
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // Main accent color
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Success - Green
  success: {
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
  },

  // Warning - Yellow
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },

  // Danger - Red
  danger: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },

  // Neutral - Gray Scale
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Dark Mode Specific
  dark: {
    bgPrimary: '#0f172a',    // Main background
    bgSecondary: '#1e293b',  // Card background
    bgTertiary: '#334155',   // Input/elevated background
    textPrimary: '#f8fafc',  // Main text
    textSecondary: '#94a3b8', // Muted text
    border: '#334155',
  },

  // Semantic colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 12,   // 0.75rem
  lg: 16,   // 1rem
  xl: 20,   // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 32, // 2rem
  '4xl': 40, // 2.5rem
  '5xl': 48, // 3rem
  '6xl': 64, // 4rem
  '7xl': 80, // 5rem
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const fontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Helper to create cross-platform shadows
const createShadow = (
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number,
  color: string = '#000'
) => {
  if (Platform.OS === 'web') {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return {
      boxShadow: `0px ${offsetY}px ${radius}px ${color}${alpha}`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

export const shadows = {
  sm: createShadow(1, 0.05, 2, 1),
  md: createShadow(4, 0.1, 6, 3),
  lg: createShadow(10, 0.1, 15, 5),
  xl: createShadow(20, 0.12, 25, 8),
  glow: createShadow(0, 0.3, 20, 10, colors.primary[500]),
};

// Dark theme (default for BuildSight)
export const darkTheme = {
  colors: {
    background: colors.dark.bgPrimary,
    card: colors.dark.bgSecondary,
    cardElevated: colors.dark.bgTertiary,
    text: colors.dark.textPrimary,
    textMuted: colors.dark.textSecondary,
    border: colors.dark.border,
    primary: colors.primary[500],
    accent: colors.accent[500],
    success: colors.success[500],
    warning: colors.warning[500],
    danger: colors.danger[500],
    tabBar: colors.dark.bgSecondary,
    tabBarActive: colors.primary[500],
    tabBarInactive: colors.neutral[500],
  },
};

// Light theme (optional)
export const lightTheme = {
  colors: {
    background: colors.neutral[50],
    card: colors.white,
    cardElevated: colors.neutral[100],
    text: colors.neutral[900],
    textMuted: colors.neutral[500],
    border: colors.neutral[200],
    primary: colors.primary[500],
    accent: colors.accent[500],
    success: colors.success[500],
    warning: colors.warning[500],
    danger: colors.danger[500],
    tabBar: colors.white,
    tabBarActive: colors.primary[500],
    tabBarInactive: colors.neutral[400],
  },
};

// Default export for convenience
export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  darkTheme,
  lightTheme,
};
