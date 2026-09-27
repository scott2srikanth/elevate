import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
// Publishing changes a shared test catalog; isolate these tests from ordinary UI tests.
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "admin.spec.ts",
  workers: 1,
});
