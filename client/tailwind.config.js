/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        panel: '#FFFFFF',
        ink: '#111827',
        sub: '#64748B',
        muted: '#94A3B8',
        border: '#E5E7EB',
        brand: '#4F46E5',
        brandHover: '#4338CA',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

