export default {
  darkMode: "class",
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10B981', // More vibrant modern green
          'green-light': '#D1FAE5',
          'green-dark': '#047857',
          'green-gradient': '#34D399',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        transport: '#3B82F6',
        'transport-light': '#DBEAFE',
        entertain: '#8B5CF6',
        page: '#F8FAFC',
        card: '#FFFFFF',
        muted: '#F1F5F9',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-tertiary': '#94A3B8',
        border: 'rgba(0,0,0,0.08)',
        glass: 'rgba(255, 255, 255, 0.7)',
        'glass-dark': 'rgba(15, 23, 42, 0.7)',
        dark: {
          page: '#020617', // Deeper slate for AMOLED optimization
          card: '#0F172A',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        pill: '9999px',
        input: '12px',
        card: '24px',
        modal: '32px',
      },
      boxShadow: {
        // Optimized shadows for performance
        card: '0px 4px 12px -2px rgba(0,0,0,0.03), 0px 0px 1px rgba(0,0,0,0.05)',
        floating: '0px 8px 24px -4px rgba(0,0,0,0.08), 0px 0px 2px rgba(0,0,0,0.05)',
        fab: '0px 8px 20px rgba(16, 185, 129, 0.3)',
        glass: '0px 4px 16px rgba(0, 0, 0, 0.04)',
        glow: '0px 0px 12px rgba(16, 185, 129, 0.5)',
      },
    },
  },
}
