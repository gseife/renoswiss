import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Base path matches the GitHub Pages project URL: https://<user>.github.io/renoswiss/
// Override with VITE_BASE=/ for custom-domain or root deployment.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/renoswiss/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
