/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    fontSize: {
      xxs: ["12px", "1.2"],
      xs: ["14px", "1.2"],
      sm: ["16px", "1.2"],
      card: ["18px", "1.2"],
      base: ["20px", "1.2"],
      md: ["26px", "1.2"],
      lg: ["32px", "1.2"],
      xl: ["42px", "1.2"],
    },
    extend: {
      borderRadius: {
        card: "30px",
        content: "18px",
      },
      colors: {
        bg: "rgb(var(--bg-color) / <alpha-value>)",
        fg: "rgb(var(--fg-color) / <alpha-value>)",
        primary: "rgb(var(--primary-color) / <alpha-value>)",
        success: "rgb(var(--success-color) / <alpha-value>)",
        warning: "rgb(var(--warning-color) / <alpha-value>)",
        error: "rgb(var(--error-color) / <alpha-value>)",
        text: "rgb(var(--text-color) / <alpha-value>)",
        "text-on-primary": "rgb(var(--text-on-primary-color) / <alpha-value>)",
        hint1: "rgb(var(--hint1-color) / <alpha-value>)",
        hint2: "rgb(var(--hint2-color) / <alpha-value>)",
        hint3: "rgb(var(--hint3-color) / <alpha-value>)",
        "hint-on-success": "rgb(var(--hint-on-success-color) / <alpha-value>)",
      },
      boxShadow: {
        "inside-border": "inset 0px 0px 0px 1px var(--tw-shadow-color)",
        menu: "0px 0px 30px var(--shadow-menu-color)",
      },
    },
  },
  plugins: [],
  safelist: ["bg-error", "bg-success", "bg-warning"],
}
