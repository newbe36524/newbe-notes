import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCompatibility } from "./verify-astro-compat.mjs";

test("supported Astro and Vite versions pass validation", () => {
  const result = evaluateCompatibility({
    astroVersion: "6.1.5",
    viteVersion: "8.0.8",
    integrations: [],
    nodeVersion: "24.14.0"
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
});

test("an incompatible Vite version fails before app commands run", () => {
  const result = evaluateCompatibility({
    astroVersion: "6.1.5",
    viteVersion: "7.3.1",
    integrations: [],
    nodeVersion: "24.14.0"
  });

  assert.equal(result.ok, false);
  assert.match(result.diagnostics.join("\n"), /vite to 8\.0\.8/);
});

test("an unregistered Astro integration produces actionable guidance", () => {
  const result = evaluateCompatibility({
    astroVersion: "6.1.5",
    viteVersion: "8.0.8",
    integrations: [["@astrojs/react", "4.0.0"]],
    nodeVersion: "24.14.0"
  });

  assert.equal(result.ok, false);
  assert.match(result.diagnostics.join("\n"), /deny-by-default/);
  assert.match(result.diagnostics.join("\n"), /integration-policy\.mjs/);
});

