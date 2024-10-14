import type { Config } from "tailwindcss";

import plugin from "tailwindcss/plugin";

const rotateY = plugin(function ({ addUtilities }) {
  addUtilities({
    ".rotate-y-60": {
      transform: "rotateY(60deg)",
    },
    ".rotate-y-90": {
      transform: "rotateY(90deg)",
    },
    ".rotate-y-120": {
      transform: "rotateY(120deg)",
    },
    ".rotate-y-180": {
      transform: "rotateY(180deg)",
    },
    ".rotate-y-270": {
      transform: "rotateY(270deg)",
    },
    ".rotate-y-0": {
      transform: "rotateY(0deg)",
    },
  });
});


const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography"), rotateY, require('@tailwindcss/forms')],
  daisyui: {
    themes: [
      'light',
      'dark',
      'black',
    ]
  },
};
export default config;
