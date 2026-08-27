/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        efootball: {
          darkBg: '#080c14',
          surface: '#0d1322',
          card: '#111827',
          cardBorder: '#1f293d',
          neonGreen: '#00ff66',
          cyan: '#00f2fe',
          gold: '#ffd700',
          blue: '#0052cc',
          accentPurple: '#7928ca',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      fontFamily: {
        display: ['Teko', 'Rajdhani', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 102, 0.25)',
        'glow-cyan': '0 0 20px rgba(0, 242, 254, 0.25)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
