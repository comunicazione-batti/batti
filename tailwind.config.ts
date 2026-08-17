import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1918",
        inksoft: "#2E2A26",
        ivory: "#F6F1E7",
        ivorydim: "#EBE3D2",
        paper: "#FBF8F1",
        brass: "#A9824C",
        brasslight: "#C9A876",
        brassdim: "#EFE3CC",
        sage: "#3F6653",
        sagebg: "#E4EEE7",
        wine: "#8B3A3A",
        winebg: "#F5E6E6",
        amber: "#9A6B22",
        amberbg: "#F3E7CE",
        line: "#DDD5C2",
        linesoft: "#E8E1D2"
      },
      fontFamily: {
        display: ["var(--font-fraunces)"],
        sans: ["var(--font-inter)"],
        mono: ["var(--font-plex-mono)"]
      },
      borderRadius: {
        card: "12px"
      }
    }
  },
  plugins: []
};

export default config;
