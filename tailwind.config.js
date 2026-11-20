/** Brand tokens from .claude/skills/the-company-brand/SKILL.md */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        muted: '#8C8985',
        panel: '#F0EEE4',
        page: '#FAFAF7',
        green: { DEFAULT: '#77BB78', tint: '#D6EBD6' },
        blue: { DEFAULT: '#8DBAED', tint: '#BBD6F4', soft: '#E8F1FB' },
        pink: { DEFAULT: '#F8AAB6', tint: '#FBCCD3', soft: '#FDE5E9' },
        yellow: { DEFAULT: '#FCCF61' },
      },
      fontFamily: {
        display: ['Spectral', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { label: '0.08em' },
    },
  },
  plugins: [],
};
