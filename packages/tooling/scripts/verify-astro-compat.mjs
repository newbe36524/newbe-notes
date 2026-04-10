import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  COMPATIBLE_INTEGRATIONS,
  IGNORED_ASTRO_PACKAGES,
  SUPPORTED_ASTRO_VERSION,
  SUPPORTED_NODE_VERSION,
  SUPPORTED_VITE_VERSION,
  describeIntegrationPolicy
} from "../astro/integration-policy.mjs";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const appManifestPath = path.join(workspaceRoot, "apps/site/package.json");
const rootManifestPath = path.join(workspaceRoot, "package.json");

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? "");

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compareVersions(left, right) {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

function isNodeVersionSupported(nodeVersion) {
  const current = parseVersion(nodeVersion);
  const minimum = parseVersion(SUPPORTED_NODE_VERSION);

  if (!current || !minimum) {
    return false;
  }

  return compareVersions(current, minimum) >= 0;
}

function readDependencyVersion(manifest, packageName) {
  return (
    manifest.dependencies?.[packageName] ??
    manifest.devDependencies?.[packageName] ??
    manifest.optionalDependencies?.[packageName] ??
    manifest.peerDependencies?.[packageName] ??
    null
  );
}

function collectAstroIntegrations(manifest) {
  const dependencyEntries = Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies
  });

  return dependencyEntries.filter(([packageName]) => {
    return packageName.startsWith("@astrojs/") && !IGNORED_ASTRO_PACKAGES.has(packageName);
  });
}

export function evaluateCompatibility({
  astroVersion,
  viteVersion,
  integrations = [],
  nodeVersion = process.versions.node,
  appName = "@newbe-notes/site"
}) {
  const diagnostics = [];

  if (!isNodeVersionSupported(nodeVersion)) {
    diagnostics.push(
      `Node ${nodeVersion} is below the repository baseline ${SUPPORTED_NODE_VERSION}. Use Node ${SUPPORTED_NODE_VERSION}+ before running Astro commands.`
    );
  }

  if (astroVersion !== SUPPORTED_ASTRO_VERSION) {
    diagnostics.push(
      `${appName} must pin astro to ${SUPPORTED_ASTRO_VERSION}, but found ${astroVersion ?? "missing"}. Update apps/site/package.json before running workspace scripts.`
    );
  }

  if (viteVersion !== SUPPORTED_VITE_VERSION) {
    diagnostics.push(
      `The workspace must pin vite to ${SUPPORTED_VITE_VERSION}, but found ${viteVersion ?? "missing"}. Update package.json overrides and apps/site/package.json together.`
    );
  }

  for (const [packageName, version] of integrations) {
    const expectedVersion = COMPATIBLE_INTEGRATIONS[packageName];

    if (!expectedVersion) {
      diagnostics.push(
        `${packageName}@${version} is not registered for the Vite 8 profile. ${describeIntegrationPolicy(packageName)}`
      );
      continue;
    }

    if (version !== expectedVersion) {
      diagnostics.push(
        `${packageName} must use ${expectedVersion} for the Vite 8 profile, but found ${version}. Update the app manifest or refresh the shared policy entry.`
      );
    }
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function main() {
  const [rootManifest, appManifest] = await Promise.all([
    readJson(rootManifestPath),
    readJson(appManifestPath)
  ]);

  const result = evaluateCompatibility({
    astroVersion: readDependencyVersion(appManifest, "astro"),
    viteVersion:
      rootManifest.pnpm?.overrides?.vite ?? readDependencyVersion(appManifest, "vite"),
    integrations: collectAstroIntegrations(appManifest),
    appName: appManifest.name
  });

  if (!result.ok) {
    console.error("Astro/Vite compatibility check failed.");
    for (const diagnostic of result.diagnostics) {
      console.error(`- ${diagnostic}`);
    }
    process.exit(1);
  }

  console.log(
    `Astro/Vite compatibility check passed for ${appManifest.name} (astro ${SUPPORTED_ASTRO_VERSION}, vite ${SUPPORTED_VITE_VERSION}).`
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
