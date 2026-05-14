import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["src/**/*.js", "playwright.config.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      ".convex/**",
      ".claude/**",
      ".opencode/**",
      ".pi/**",
      "convex/_generated/**",
      "output/**",
      "build-diagram*.js",
      "capture_convex.js",
      "groq-test.js",
    ],
  },
]);
