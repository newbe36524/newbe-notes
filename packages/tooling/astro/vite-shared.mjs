import path from "node:path";
import { fileURLToPath } from "node:url";

const toolingDirectory = fileURLToPath(new URL("./", import.meta.url));

export function createSharedViteConfig({ appName = "site" } = {}) {
  const cacheName = appName.replaceAll("/", "-").replaceAll("@", "");

  return {
    cacheDir: path.join(toolingDirectory, "../../../.cache/vite", cacheName),
    server: {
      host: "127.0.0.1",
      strictPort: true
    },
    preview: {
      host: "127.0.0.1",
      strictPort: true
    },
    resolve: {
      alias: {
        "@newbe-notes/tooling": path.join(toolingDirectory, "..")
      }
    }
  };
}

