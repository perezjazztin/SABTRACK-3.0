import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        civic: {
          forest: "#0F5132",
          forestHover: "#0b3d26",
          emerald: "#198754",
          emeraldLight: "#d1e7dd",
          slate: "#1E293B",
          slateLight: "#334155",
          sand: "#f4f8f5",
          card: "#ffffff",
          border: "#E2E8F0",
        },
      },
      boxShadow: {
        // Refined Minimal Soft-Neumorphic Elevations
        'neu-flat': '3px 3px 8px rgba(148, 163, 184, 0.16), -3px -3px 8px rgba(255, 255, 255, 0.9)',
        'neu-raised': '4px 4px 12px rgba(148, 163, 184, 0.18), -4px -4px 12px rgba(255, 255, 255, 0.95)',
        'neu-raised-lg': '8px 8px 20px rgba(148, 163, 184, 0.2), -8px -8px 20px rgba(255, 255, 255, 0.95)',
        'neu-raised-hover': '6px 6px 16px rgba(148, 163, 184, 0.22), -6px -6px 16px rgba(255, 255, 255, 1)',
        'neu-sm': '2px 2px 6px rgba(148, 163, 184, 0.14), -2px -2px 6px rgba(255, 255, 255, 0.9)',
        'neu-xs': '1px 1px 3px rgba(148, 163, 184, 0.12), -1px -1px 3px rgba(255, 255, 255, 0.85)',
        // Sunken / Inset for Inputs, Pressed States & Sockets
        'neu-sunken': 'inset 2px 2px 4px rgba(148, 163, 184, 0.16), inset -2px -2px 4px rgba(255, 255, 255, 0.85)',
        'neu-sunken-sm': 'inset 1px 1px 3px rgba(148, 163, 184, 0.14), inset -1px -1px 3px rgba(255, 255, 255, 0.8)',
        'neu-sunken-deep': 'inset 3px 3px 6px rgba(148, 163, 184, 0.2), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
        // Accent Green Soft Glow
        'neu-green': '0 4px 14px rgba(15, 81, 50, 0.25)',
        'neu-green-pressed': 'inset 2px 2px 4px rgba(11, 61, 38, 0.5), inset -2px -2px 4px rgba(25, 135, 84, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
