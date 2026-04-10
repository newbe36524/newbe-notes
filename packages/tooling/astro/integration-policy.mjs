export const SUPPORTED_ASTRO_VERSION = "6.1.5";
export const SUPPORTED_VITE_VERSION = "8.0.8";
export const SUPPORTED_NODE_VERSION = "22.12.0";

export const IGNORED_ASTRO_PACKAGES = new Set([
  "@astrojs/check",
  "@astrojs/compiler",
  "@astrojs/internal-helpers",
  "@astrojs/markdown-remark",
  "@astrojs/telemetry"
]);

export const COMPATIBLE_INTEGRATIONS = Object.freeze({});

export function describeIntegrationPolicy(packageName) {
  return [
    `The Vite 8 profile treats Astro runtime integrations as deny-by-default.`,
    `Validate ${packageName} with "corepack pnpm run validate" before registering it.`,
    `Then add an exact version entry to packages/tooling/astro/integration-policy.mjs.`
  ].join(" ");
}

