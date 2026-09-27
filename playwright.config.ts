import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  testIgnore: "admin.spec.ts",
  timeout: 45000,
  use: { baseURL: "http://localhost:8787", headless: true, channel: "chrome" },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "npm run dev:cloud",
    url: "http://localhost:8787",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
