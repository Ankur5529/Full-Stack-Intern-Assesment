/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#05050A", // Deep space black-blue
          900: "#0A0B14",
          800: "#101223",
          700: "#1A1D36",
          600: "#272A4A",
        },
        primary: {
          600: "#3B82F6", // Vibrant Blue
          500: "#60A5FA", // Soft Blue
          400: "#93C5FD",
          300: "#BFDBFE",
          accent: "#8B5CF6", // Purple glow accent
        },
        ink: {
          50: "#F8FAFC",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
        },
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '50%': { opacity: '.8', boxShadow: '0 0 25px rgba(139, 92, 246, 0.7)' },
        }
      }
    },
  },
  plugins: [],
};
