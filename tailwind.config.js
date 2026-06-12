/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    borderRadius: {
      none: '0',
      sm: '0',
      DEFAULT: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      '3xl': '0',
      full: '0',
    },
    extend: {
      colors: {
        // 你的 tokens
        'primary-green': '#87C06D',
        'primary-light': '#D9F0A8',
        'primary-pale': '#DEF4CD',
        'primary-mid': '#9DBD86',
        'pixel-yellow': '#E9EF6E',
        'warm-peach': '#F9CE9A',
        'page-bg': '#FEF7E8',
        'cell-faded': '#F5F5EE',
        'brand-text': '#4A5040',
        // 隊友的 tokens
        primary: '#87C06D',
        peach: '#F9CE9A',
        cream: '#FEF7E8',
        'text-main': '#4A5040',
        'text-muted': '#9DBD86',
        border: '#DEF4CD',
        bg: '#FAF8F4',
      },
      fontFamily: {
        'press-start': ['"Press Start 2P"', 'monospace'],
        'cubic11': ['cubic11', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'syne': ['Syne', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        pixel: '3px 3px 0 #4A5040',
        'pixel-sm': '2px 2px 0 #4A5040',
        'pixel-pressed': '1px 1px 0 #4A5040',
      },
    },
  },
  plugins: [],
}
