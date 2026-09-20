import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

const accent = '#24664e';

// The single source of brand values for Astryx and Tailwind's token bridge.
export const novelliaTheme = defineTheme({
  name: 'novellia',
  extends: neutralTheme,
  color: { accent, neutralStyle: 'warm' },
  tokens: {
    '--color-accent': accent,
    '--color-accent-muted': '#e6f0e9',
    '--color-text-accent': accent,
    '--color-icon-accent': accent,
    '--color-on-accent': '#ffffff',
    '--color-background-body': '#f7f8f5',
    '--color-background-surface': '#ffffff',
    '--color-background-card': '#ffffff',
    '--color-background-muted': '#f1f5ee',
    '--color-text-primary': '#23372d',
    '--color-text-secondary': '#5f705d',
    '--color-border': '#e4e9e0',
    '--color-border-emphasized': '#a1b9a6',
    '--font-family-body': "system-ui, 'Segoe UI', sans-serif",
    '--font-family-heading': "system-ui, 'Segoe UI', sans-serif",
    '--font-size-2xs': '0.625rem',
    '--font-size-xs': '0.75rem',
    '--font-size-sm': '0.875rem',
    '--font-size-base': '1rem',
    '--font-size-lg': '1.125rem',
    '--font-size-xl': '1.25rem',
    '--font-size-2xl': '1.5rem',
    '--font-size-3xl': '1.875rem',
    '--font-size-4xl': '2.25rem',
    '--font-weight-medium': '500',
    '--font-weight-semibold': '600',
    '--font-weight-bold': '700',
    '--radius-page': '1rem',
  },
  localTokens: {
    '--pet-hero': '#eaf1e5',
    '--pet-hero-decoration': '#dce8d4',
    '--pet-avatar-dog': '#eaf0e0',
    '--pet-avatar-cat': '#f7ecdb',
    '--pet-avatar-rabbit': '#ece8f2',
    '--pet-avatar-bird': '#e5edf3',
    '--pet-warning-surface': '#faf1e3',
    '--pet-error-surface': '#faece9',
    '--pet-error-text': '#8b4133',
    '--pet-error-border': '#efd8cd',
  },
});
