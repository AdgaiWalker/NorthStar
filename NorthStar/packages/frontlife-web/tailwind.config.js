/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#4A7C59',
          light: '#E8F0E9',
          dark: '#3A6347',
        },
        ink: {
          DEFAULT: '#1C1917',
          secondary: '#44403C',
          muted: '#78716C',
          faint: '#A8A29E',
        },
        amber: {
          custom: '#B8860B',
          light: '#FEF3C7',
        },
        blue: {
          custom: '#3D5A80',
          light: '#E8EEF4',
        },
        rose: {
          custom: '#BE4B4B',
          light: '#FDF2F2',
        },
        border: {
          DEFAULT: '#E7E5E4',
          light: '#F5F5F4',
        },
        surface: '#FFFFFF',
        bg: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAFAF9',
        },
      },
      fontFamily: {
        display: ["'LXGW WenKai'", "'PingFang SC'", "'Microsoft YaHei'", 'serif'],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'PingFang SC'",
          "'Microsoft YaHei'",
          "'Segoe UI'",
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.05)',
        lg: '0 8px 24px rgba(0,0,0,0.08)',
      },
      spacing: {
        'nav-h': '56px',
        'bottom-nav-h': '60px',
        'content-max': '960px',
        'reader-max': '720px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
