/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // "The System" — Solo Leveling palette
        system: {
          bg: '#0B0F19',
          panel: '#101624',
          border: '#1E293B',
          neon: '#60A5FA',
          cyan: '#22D3EE',
          violet: '#A855F7',
          gold: '#FBBF24',
        },
      },
      fontFamily: {
        // Future: plug a pixel/holo font here.
      },
    },
  },
  plugins: [],
};
