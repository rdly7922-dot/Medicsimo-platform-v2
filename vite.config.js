import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir:        "dist",
    sourcemap:     true,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          react:    ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          query:    ["@tanstack/react-query"],
          charts:   ["recharts"],
        },
      },
    },
  },
});
