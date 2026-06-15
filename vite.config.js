import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      src: path.resolve(__dirname, "src"), // maps "src/" → "./src"
    },
  },
  server: {
    host: "0.0.0.0",
    watch: {
      usePolling: true,
      interval: 100,
      // Important: force Chokidar to not accidentally ignore src.
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/coverage/**",
      ],
    },
  },

  future: {
    perEnvironmentStartEndDuringDev: true,
    perEnvironmentWatchChangeDuringDev: true,
  },
});