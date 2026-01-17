/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        'domo-primary': '#248BFB',
        'domo-secondary': '#6FB3FC',
        'domo-light': '#DAEAFB',
        'domo-alert': '#FF6F61',

        // Dark theme backgrounds
        'domo-bg-dark': '#0A0A0F',
        'domo-bg-card': '#12121A',
        'domo-bg-elevated': '#1A1A24',
        'domo-border': '#2A2A3A',

        // Text colors
        'domo-text': '#FFFFFF',
        'domo-text-secondary': '#A0A0B0',
        'domo-text-muted': '#666680',

        // Status colors
        'domo-success': '#10B981',
        'domo-warning': '#F59E0B',
        'domo-error': '#EF4444',

        // Legacy colors (for backwards compatibility during migration)
        'domo-dark-blue': '#0A0A0F',
        'domo-light-blue': '#248BFB',
        'domo-green': '#10B981',
        'domo-blue-accent': '#248BFB',
        'domo-light-gray': '#12121A',
        'domo-dark-text': '#FFFFFF',
        'domo-light-text': '#A0A0B0',
      },
      fontFamily: {
        'heading': ['Poppins', 'sans-serif'],
        'body': ['Figtree', 'sans-serif'],
      },
      boxShadow: {
        'domo': '0 4px 20px rgba(36, 139, 251, 0.15)',
        'domo-lg': '0 8px 40px rgba(36, 139, 251, 0.2)',
      },
    },
  },
  plugins: [],
}
