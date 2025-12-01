module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f0ff',
          100: '#ede3ff',
          200: '#dcc7ff',
          300: '#c49eff',
          400: '#a66fff',
          500: '#BF4EF9',
          600: '#a832e6',
          700: '#8f1fcc',
          800: '#761ba8',
          900: '#611a88',
        },
        dark: {
          50: '#e6e6f0',
          100: '#b3b3d9',
          200: '#8080c2',
          300: '#4d4dab',
          400: '#1a1a94',
          500: '#0a0a5c',
          600: '#08084a',
          700: '#060638',
          800: '#040426',
          900: '#020214',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(191, 78, 249, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(191, 78, 249, 0.8), 0 0 30px rgba(191, 78, 249, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #BF4EF9 0%, #0a0a5c 100%)',
        'gradient-primary-light': 'linear-gradient(135deg, #BF4EF9 0%, #a832e6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0a0a5c 0%, #08084a 100%)',
      },
    },
  },
  plugins: [],
}
