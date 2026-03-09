import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#060a12',
          panel: '#0f172a',
          panelSoft: '#111b2f',
          border: '#1f2a44',
          text: '#e5edff',
          muted: '#98a6c7',
          emerald: '#10b981',
          rose: '#fb7185',
          primary: '#60a5fa',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(4, 8, 20, 0.35)',
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at 25% 15%, rgba(96,165,250,0.28), transparent 45%), radial-gradient(circle at 80% 10%, rgba(16,185,129,0.24), transparent 50%), linear-gradient(145deg, #0f172a 0%, #111b2f 100%)',
      },
    },
  },
  plugins: [],
}

export default config
