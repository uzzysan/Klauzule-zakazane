import type { Config } from "tailwindcss";

/**
 * FairPact design tokens.
 * All colours are CSS variables (HSL triplets) defined in src/app/globals.css.
 * They are authored in OKLCH — see docs/DESIGN_LANGUAGE.md for the source values
 * and their measured contrast ratios. Never use raw Tailwind palette colours
 * (slate-*, indigo-*, red-* …) in components; use these semantic names.
 */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("muted"),
          foreground: token("foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("primary-foreground"),
        },
        success: {
          DEFAULT: token("success"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("foreground"),
        },
        popover: {
          DEFAULT: token("card"),
          foreground: token("foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("foreground"),
        },
        // Risk levels — always pair with an icon and a text label (never colour alone).
        risk: {
          high: {
            DEFAULT: token("risk-high"),
            tint: token("risk-high-tint"),
            border: token("risk-high-border"),
          },
          medium: {
            DEFAULT: token("risk-medium"),
            tint: token("risk-medium-tint"),
            border: token("risk-medium-border"),
          },
          low: {
            DEFAULT: token("risk-low"),
            tint: token("risk-low-tint"),
            border: token("risk-low-border"),
          },
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      fontSize: {
        // Display sizes for serif headings (1.25 modular scale from 16px)
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "display-md": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-lg": ["3.125rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        // Soft, ink-tinted shadows. In dark mode elevation comes from lighter surfaces instead.
        xs: "0 1px 2px 0 hsl(var(--shadow) / 0.05)",
        sm: "0 1px 2px 0 hsl(var(--shadow) / 0.06), 0 1px 3px 0 hsl(var(--shadow) / 0.04)",
        md: "0 2px 4px -1px hsl(var(--shadow) / 0.06), 0 6px 16px -4px hsl(var(--shadow) / 0.08)",
        lg: "0 4px 8px -2px hsl(var(--shadow) / 0.06), 0 16px 32px -8px hsl(var(--shadow) / 0.10)",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "280ms",
      },
    },
  },
  plugins: [],
};

export default config;
