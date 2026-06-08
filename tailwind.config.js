/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary:          '#87C06D',
        'primary-light':  '#D9F0A8',
        'primary-mid':    '#9DBD86',
        'primary-pale':   '#DEF4CD',
        'pixel-yellow':   '#E9EF6E',
        peach:            '#F9CE9A',
        cream:            '#FEF7E8',
        'text-main':      '#2B2E24',
        'text-sub':       '#4A5040',
        'text-muted':     '#9DBD86',
        border:           '#DEF4CD',
        bg:               '#FAF8F4',
      },
      fontFamily: {
        pixel:  ['"Press Start 2P"', 'monospace'],
        syne:   ['Syne', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
    
      },
    },
  },
  plugins: [],
}
