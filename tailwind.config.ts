import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Dark palette applies only when running as an installed PWA (standalone
  // display mode), not just because the OS/browser prefers dark - a normal
  // browser tab always stays white+green. `dark:` utilities below are keyed
  // off this custom at-rule instead of Tailwind's default
  // `prefers-color-scheme` media strategy.
  darkMode: ['variant', '@media (display-mode: standalone) { & }'],
  theme: {
    extend: {
      colors: {
        // TK77 Skalica brand: green + white.
        court: '#1e7a34'
      }
    }
  },
  plugins: []
};

export default config;
