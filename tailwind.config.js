/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  safelist: [
    {
      pattern: /(bg|text|border)-(bio|earth|moss)-(100|200|300|400|500|600|700|800)(\/(5|10|15|20|25|30|40|50))?/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bio-border': 'rgba(255, 255, 255, 0.08)',
        bio: {
          50: '#f5fbf6',
          100: '#e7f4e8',
          200: '#cbe4ce',
          300: '#abd2b1',
          400: '#8dbb95',
          500: '#6ca876',
          600: '#4f875b',
          700: '#3c6647',
          800: '#2b4932',
          900: '#1b3022',
          950: '#0d1911',
        },
        earth: {
          50: '#fff9ed',
          100: '#f9eed1',
          200: '#f1ddb0',
          300: '#e2c57b',
          400: '#c9a257',
          500: '#ac8443',
          600: '#8e6834',
          700: '#6f5129',
          800: '#543d1f',
          900: '#3a2915',
        },
        moss: {
          50: '#f7f9f2',
          100: '#edf2df',
          200: '#dce5bc',
          300: '#c1cf8c',
          400: '#a1b264',
          500: '#859348',
          600: '#69753a',
          700: '#515b2e',
          800: '#3c4424',
          900: '#292e19',
        },
        dark: {
          900: '#0c1012',
          800: '#12181c',
          700: '#182126',
          600: '#26323a',
          500: '#3d4a53',
        }
      },
      backgroundImage: {
        'bio-gradient': 'radial-gradient(circle at top left, rgba(108,168,118,0.08), transparent 28%), linear-gradient(180deg, #0c1012 0%, #11171a 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(20,27,31,0.98) 0%, rgba(16,22,25,0.98) 100%)',
        'glow-gradient': 'radial-gradient(ellipse at center, rgba(108,168,118,0.08) 0%, transparent 72%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'count-up': 'countUp 1s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(34,197,94,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(34,197,94,0.6)' },
        },
      },
      boxShadow: {
        'bio': '0 14px 32px rgba(0,0,0,0.18)',
        'bio-lg': '0 24px 50px rgba(0,0,0,0.26)',
        'card': '0 10px 24px rgba(0,0,0,0.14)',
        'inner-bio': 'inset 0 0 0 1px rgba(208,213,221,0.4)',
      },
    },
  },
  plugins: [],
}
