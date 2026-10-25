/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        soft: 'var(--color-soft)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#eef2ff',
          muted: '#818cf8',
        },
        navy: {
          900: 'var(--color-navy-900)',
          800: 'var(--color-navy-800)',
          700: 'var(--color-navy-700)',
        },
        secondary: 'var(--color-secondary)',
        muted: 'var(--color-muted)',
        track: 'var(--color-track)',
        success: {
          DEFAULT: '#16a34a',
          light: '#dcfce7',
        },
        error: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fef3c7',
        },
        purple: {
          DEFAULT: '#7c3aed',
          light: '#f3e8ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
