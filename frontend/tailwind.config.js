/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.tsx",
  ],
  presets: [require("nativewind/preset")],
  // Completely disable responsive variants
  theme: {
    screens: {}, // Empty object disables all breakpoints
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        card: "#1a1a1a",
        "card-foreground": "#ffffff",
        popover: "#1a1a1a",
        "popover-foreground": "#ffffff",
        primary: "#ffffff",
        "primary-foreground": "#000000",
        secondary: "#334155",
        "secondary-foreground": "#ffffff",
        muted: "#475569",
        "muted-foreground": "#cbd5e1",
        accent: "#ff6b35",
        "accent-foreground": "#ffffff",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#334155",
        input: "#1e293b",
        ring: "#64748b",
      },
    },
  },
  corePlugins: {
    // CRITICAL: Disable ALL plugins that use CSS custom properties or functions
    space: false, // Uses --tw-space-x-reverse, --tw-space-y-reverse
    ringWidth: false, // Uses --tw-ring-offset-width, --tw-ring-color, etc.
    ringOffsetWidth: false, // Uses --tw-ring-offset-width
    ringColor: false, // Uses --tw-ring-color
    ringOffsetColor: false, // Uses --tw-ring-offset-color
    ringOpacity: false, // Uses --tw-ring-opacity
    ringOffset: false, // Uses --tw-ring-offset-*
    container: false, // Uses media queries
    transform: false, // Uses CSS custom properties
    rotate: false,
    scale: false,
    translate: false,
    skew: false,
    animation: false, // Uses CSS custom properties
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    blur: false,
    brightness: false,
    contrast: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
  },
  plugins: [],
}
