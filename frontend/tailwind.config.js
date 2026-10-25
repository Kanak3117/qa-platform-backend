/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f8fa',
        surface: '#ffffff',
        soft: '#f9fafb',
        border: '#e5e7eb',
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#eef2ff',
          muted: '#818cf8',
        },
        navy: {
          900: '#172033',
          800: '#1e293b',
          700: '#334155',
        },
        secondary: '#6b7280',
        muted: '#9ca3af',
        track: '#eef0f3',
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
