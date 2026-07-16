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
      colors: tokens.colors,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
      fontFamily: tokens.fontFamily,
      animation: tokens.animation,
      keyframes: tokens.keyframes,

      /**
       * Blog article bodies use `prose prose-lg`, but the typography plugin was
       * never installed and `plugins` was empty — so those classes were inert
       * and every article body rendered as unstyled HTML. Tuned to the brand
       * rather than left on the plugin's cool-gray defaults.
       */
      typography: ({ theme }) => ({
        whisky: {
          css: {
            '--tw-prose-body': theme('colors.charcoal.700'),
            '--tw-prose-headings': theme('colors.ink'),
            '--tw-prose-lead': theme('colors.charcoal.600'),
            '--tw-prose-links': theme('colors.whisky.700'),
            '--tw-prose-bold': theme('colors.ink'),
            '--tw-prose-counters': theme('colors.charcoal.500'),
            '--tw-prose-bullets': theme('colors.whisky.300'),
            '--tw-prose-hr': theme('colors.charcoal.200'),
            '--tw-prose-quotes': theme('colors.ink'),
            '--tw-prose-quote-borders': theme('colors.whisky.400'),
            '--tw-prose-captions': theme('colors.charcoal.500'),
            '--tw-prose-code': theme('colors.ink'),
            '--tw-prose-pre-bg': theme('colors.charcoal.900'),
            '--tw-prose-th-borders': theme('colors.charcoal.300'),
            '--tw-prose-td-borders': theme('colors.charcoal.200'),
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
