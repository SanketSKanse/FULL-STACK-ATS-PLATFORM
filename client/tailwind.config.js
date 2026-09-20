/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F3EDE2',        // Warm Oatmeal
        panel: '#FAF7F2',         // Warm Ivory Panel
        ink: '#2B2B2B',           // Deep Charcoal
        sub: '#5E5953',           // Charcoal Muted
        muted: '#7A746D',         // Warm Taupe
        border: '#D8D1C7',        // Textured Gray
        oatmeal: '#F3EDE2',
        charcoal: '#2B2B2B',
        texturedGray: '#D8D1C7',
        brand: '#2B2B2B',
        brandHover: '#181818',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(43, 43, 43, 0.05)',
        card: '0 2px 8px rgba(43, 43, 43, 0.04), 0 1px 2px rgba(43, 43, 43, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
