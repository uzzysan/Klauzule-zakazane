import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#F5F5DC", // Ecru
                foreground: "#3E2723", // Dark Brown
                primary: {
                    DEFAULT: "#8D6E63",
                    foreground: "#FFFFFF",
                },
                accent: {
                    DEFAULT: "#E65100", // Burnt Orange
                    foreground: "#FFFFFF",
                },
            },
        },
    },
    plugins: [],
};
export default config;
