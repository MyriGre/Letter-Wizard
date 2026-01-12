/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
      },
      boxShadow: {
        'soft-lg': '0 10px 25px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'phone': '2rem',
      },
    },
  },
  plugins: [],
}

