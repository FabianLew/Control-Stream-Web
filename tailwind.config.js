/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
colors: {
        // 🌑 Twoja paleta Royal Dark
        background: {
          DEFAULT: "#0D0F13", // <--- TO JEST FIX (Domyślne tło dla shadcn)
          main: "#0D0F13",    // Alias dla Twojej wygody
          card: "#161A20",    // Karty
          sidebar: "#0B0D11", // Sidebar
        },
        border: {
          DEFAULT: "#1F232B", // Linie / obramowania
        },
        primary: {
          DEFAULT: "#6366F1", // Indigo
          foreground: "#FFFFFF", // Dodane dla przycisków shadcn
          hover: "#4F46E5",
        },
        // Dodajemy te kolory, bo shadcn ich wymaga do działania (np. w tabelach/inputach)
        foreground: "#F3F4F6", 
        muted: {
          DEFAULT: "#161A20",
          foreground: "#9CA3AF",
        },
        accent: {
          DEFAULT: "#161A20",
          foreground: "#F3F4F6",
        },
        popover: {
          DEFAULT: "#161A20",
          foreground: "#F3F4F6",
        },
        input: "#1F232B",
        ring: "#6366F1",
        
        // Twoje statusy
        status: {
          success: "#22C55E",
          warning: "#EAB308",
          danger: "#EF4444",
        },
        text: {
          primary: "#F3F4F6",   
          secondary: "#9CA3AF", 
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};