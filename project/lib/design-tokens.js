/**
 * Destination Whisky — shared design tokens.
 *
 * This file is duplicated verbatim at cms-admin/lib/design-tokens.js. It is NOT
 * imported across package boundaries on purpose: each app deploys independently
 * (project/ is its own Vercel root), so a `require('../../design-tokens')` would
 * resolve locally and fail at build time on Vercel. Keep the two copies in sync.
 *
 * Palette intent: ByFood's soft, light, rounded card language carrying a whisky
 * brand — warm cream page, white cards, gold accent, charcoal chrome.
 */

/** Gold. Accent only: buttons, stars, badges, links, active states. */
const whisky = {
  50: '#FBF8F3',
  100: '#F5EBD8',
  200: '#EBD9B4',
  300: '#DCBE85',
  400: '#CBA059',
  500: '#B8862F', // brand gold — matches the logo's bronze
  600: '#9C6E26',
  700: '#7B5620',
  800: '#5C411C',
  900: '#3E2C15',
}

/** Warm neutral. Pages, cards, borders, text, and the dark chrome. */
const charcoal = {
  50: '#FAF7F2', // page background (warm cream)
  100: '#F3EFE7',
  200: '#EDE7DF', // hairline borders
  300: '#DAD2C6',
  400: '#A99E8F', // muted / placeholder text
  500: '#7B7164',
  600: '#585046', // secondary text
  700: '#3B342D',
  800: '#241F1A',
  900: '#14110F', // header / footer / sidebar
  950: '#0B0908',
}

/**
 * Status colours, warmed to sit next to gold without clashing.
 * Plain tailwind green-500/red-500 read as neon against this palette.
 */
const status = {
  success: '#3F7D58',
  successSoft: '#E8F1EA',
  danger: '#B4453A',
  dangerSoft: '#F8EBE9',
  warning: '#C08A2E',
  warningSoft: '#FBF1DF',
  info: '#3C6E8F',
  infoSoft: '#E9F1F6',
}

const tokens = {
  colors: {
    whisky,
    charcoal,
    ink: '#1A1614', // primary body text
    cream: '#FAF7F2',
    // `primary` and `accent` are aliases of `whisky` so the large amount of
    // existing text-primary-500 / bg-primary-500 markup recolours to gold with
    // no edit. Previously these were two identical yellow ramps, which made
    // .text-gradient (primary→accent) render flat.
    primary: whisky,
    accent: whisky,
    secondary: charcoal,
    status,
  },

  /**
   * Softer than tailwind's defaults across the board — this is the single
   * biggest lever on the "squarish" feedback. rounded-2xl (cards) goes
   * 1rem -> 1.25rem, rounded-xl 0.75rem -> 0.875rem.
   */
  borderRadius: {
    lg: '0.625rem',
    xl: '0.875rem',
    '2xl': '1.25rem',
    '3xl': '1.75rem',
    '4xl': '2.25rem',
  },

  /** Low-contrast, warm-tinted shadows. Neutral black shadows look dirty on cream. */
  boxShadow: {
    soft: '0 1px 2px rgba(20,17,15,0.04), 0 2px 8px rgba(20,17,15,0.04)',
    card: '0 1px 3px rgba(20,17,15,0.05), 0 6px 16px -4px rgba(20,17,15,0.08)',
    'card-hover': '0 2px 6px rgba(20,17,15,0.06), 0 16px 32px -8px rgba(20,17,15,0.14)',
    lifted: '0 24px 48px -12px rgba(20,17,15,0.18)',
    gold: '0 8px 24px -6px rgba(184,134,47,0.35)',
  },

  fontFamily: {
    sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
    display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
  },

  animation: {
    'fade-in': 'fadeIn 0.5s ease-in-out',
    'slide-up': 'slideUp 0.5s ease-out',
    'bounce-gentle': 'bounceGentle 2s infinite',
    shimmer: 'shimmer 1.6s ease-in-out infinite',
    'swirl': 'swirl 2.4s ease-in-out infinite',
    'pour': 'pour 2.4s ease-in-out infinite',
  },

  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    slideUp: {
      '0%': { transform: 'translateY(20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    bounceGentle: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-800px 0' },
      '100%': { backgroundPosition: '800px 0' },
    },
    swirl: {
      '0%, 100%': { transform: 'rotate(-6deg)' },
      '50%': { transform: 'rotate(6deg)' },
    },
    pour: {
      '0%': { transform: 'scaleY(0)', opacity: '0' },
      '30%, 70%': { transform: 'scaleY(1)', opacity: '1' },
      '100%': { transform: 'scaleY(0)', opacity: '0' },
    },
  },
}

module.exports = tokens
