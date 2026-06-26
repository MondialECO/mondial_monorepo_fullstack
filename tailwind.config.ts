import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                instrument: ['var(--font-instrument)', 'sans-serif'],
                playfair: ['var(--font-playfair)', 'serif'],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            colors: {
                "skin-tone-1": "var(--skin-tone-1)",
                "skin-tone-2": "var(--skin-tone-2)",
                "skin-tone-3": "var(--skin-tone-3)",
                "skin-tone-4": "var(--skin-tone-4)",
                "success-light": "var(--success-light)",
                "success-text": "var(--success-text)",
                "text-secondary": "var(--text-secondary)",
            },
        },
    },
    plugins: [],
};
export default config;
