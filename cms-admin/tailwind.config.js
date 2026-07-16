const tokens = require('./lib/design-tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ...tokens.colors,
        /**
         * `gray` is remapped onto the charcoal ramp rather than removed.
         *
         * The admin already overrode tailwind's default gray here, and ~50 pages
         * use `gray-*` classes directly. Aliasing it to charcoal re-tones the
         * entire dashboard to the warm brand neutral without touching those
         * files, and keeps it in step with the customer site. 950 is declared
         * explicitly because `extend` deep-merges — omitting it would leave
         * `text-gray-950` (used by .section-title) on tailwind's cool default.
         */
        gray: tokens.colors.charcoal,
      },
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      fontFamily: tokens.fontFamily,
      animation: tokens.animation,
      keyframes: tokens.keyframes,
    },
  },
  plugins: [],
}
