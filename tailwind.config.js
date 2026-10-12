/** @type {import('tailwindcss').Config} */

// 低饱和度 + 低明度强调色阶：覆盖 Tailwind 默认的高饱和调色板，
// 全站 text-cyan-300 / bg-amber-400/10 这类既有类名会整体变为哑光色。
const mutedRamp = (h) => {
  const steps = {
    50: [95, 16],
    100: [90, 18],
    200: [82, 20],
    300: [71, 22],
    400: [57, 25],
    500: [45, 27],
    600: [35, 29],
    700: [27, 30],
    800: [22, 28],
    900: [17, 26],
    950: [13, 24],
  };
  const toHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const hex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
    return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
  };
  return Object.fromEntries(Object.entries(steps).map(([step, [l, s]]) => [step, toHex(h, s, l)]));
};

const hues = {
  cyan: 187,
  amber: 38,
  violet: 262,
  emerald: 160,
  pink: 332,
  orange: 25,
  indigo: 245,
  sky: 205,
  teal: 178,
  rose: 350,
  blue: 215,
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      // 补齐默认 opacity 刻度里缺失的档位，否则 bg-x/12、border-line/8 这类透明度修饰符不会生成
      opacity: {
        8: '0.08',
        11: '0.11',
        12: '0.12',
        13: '0.13',
        15: '0.15',
        16: '0.16',
        45: '0.45',
        65: '0.65',
        85: '0.85',
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        // 章节专用强调色，命名 accent-<hue>-<step>
        ...Object.fromEntries(
          Object.entries(hues).map(([name, h]) => [`accent-${name}`, mutedRamp(h)]),
        ),
      },
      fontFamily: {
        display: ['Kalnia', '"Songti SC"', '"Noto Serif SC"', 'serif'],
        script: ['Pacifico', 'cursive'],
        sans: [
          '"Josefin Sans"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans SC"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: []
}
