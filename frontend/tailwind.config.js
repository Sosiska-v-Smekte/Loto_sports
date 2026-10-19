/** Цвета и радиусы берутся из CSS-переменных в src/styles/tokens.css */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        line: "var(--color-line)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        weekend: "var(--color-weekend)",
        level: "var(--color-level)",
        success: { DEFAULT: "var(--color-success)", ink: "var(--color-success-ink)" },
        warning: { DEFAULT: "var(--color-warning)", ink: "var(--color-warning-ink)" },
        danger: { DEFAULT: "var(--color-danger)", ink: "var(--color-danger-ink)" },
        info: { DEFAULT: "var(--color-info)", ink: "var(--color-info-ink)" },
        today: "var(--color-today)",
      },
      fontFamily: {
        sans: ["Onest", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        header: "var(--radius-header)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        pop: "var(--shadow-pop)",
      },
      maxWidth: {
        page: "1320px",
      },
    },
  },
  plugins: [],
};
