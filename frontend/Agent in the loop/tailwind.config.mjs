/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'control-bg': '#0B0F15',
        'glass': 'rgba(13, 17, 23, 0.6)',
        'text-primary': '#E6F0FF',
        'text-bright': '#F1F5FF',
        'text-muted': '#94A3B8',
        'accent-cyan': '#22D3EE',
        'accent-violet': '#A78BFA',
        'accent-pink': '#F472B6',
        'success-lime': '#A3E635',
        'running-amber': '#F59E0B',
        'fail-rose': '#FB7185',
        'hairline': 'rgba(148, 163, 184, 0.2)',
        'hairline-bright': 'rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'orchestrate': 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 50%, #F472B6 100%)',
        'verified': 'linear-gradient(135deg, #22D3EE 0%, #A3E635 100%)',
        'cyan-violet': 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'hero': ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h3': ['20px', { lineHeight: '1.4', letterSpacing: '-0.005em' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['15px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'card': '0 10px 30px rgba(34, 211, 238, 0.08), 0 2px 8px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 20px 40px rgba(34, 211, 238, 0.12), 0 4px 12px rgba(0, 0, 0, 0.5)',
        'glow-cyan': '0 0 22px rgba(34, 211, 238, 0.4)',
        'glow-fail': '0 0 22px rgba(251, 113, 133, 0.35)',
        'glow-verified': '0 0 22px rgba(163, 230, 53, 0.3)',
        'focus-ring': '0 0 0 2px rgba(34, 211, 238, 0.6)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'drift': 'drift 20s linear infinite',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translateX(-50%) translateY(-50%)' },
          '100%': { transform: 'translateX(-50%) translateY(-60%)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
      },
    },
  },
  plugins: [],
};
