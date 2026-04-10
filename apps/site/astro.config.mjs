import { defineConfig } from "astro/config";
import { createSharedViteConfig } from "@newbe-notes/tooling/astro/vite-shared";

export default defineConfig({
  output: "static",
  vite: createSharedViteConfig({ appName: "@newbe-notes/site" })
});

