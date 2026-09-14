/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        // Semantic colors — light values, overridden by dark: prefix per component
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        muted: '#94A3B8',
        danger: '#EF4444',
        success: '#10B981',
        border: '#E2E8F0',
        // Dark variants (used via dark:bg-dark-card, etc.)
        'dark-bg': '#0F172A',
        'dark-card': '#1E293B',
        'dark-text': '#F1F5F9',
        'dark-muted': '#64748B',
        'dark-border': '#334155',
      },
    },
  },
  plugins: [],
};
