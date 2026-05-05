import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/src-tauri/**",
        "**/*.config.*",
        "**/test/**",
        "**/types/**",
      ],
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
