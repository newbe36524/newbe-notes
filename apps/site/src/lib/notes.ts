import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

export interface NoteRecord {
  title: string;
  sourcePath: string;
  routePath: string;
  slugSegments: string[];
  excerpt: string;
  html: string;
  isDirectoryIndex: boolean;
}

// Astro runs from the app workspace root, so the shared note content always
// lives two levels above the app package.
const contentRoot = path.resolve(process.cwd(), "../../content");

const markdownExtensionPattern = /\.md$/i;

marked.use({
  gfm: true
});

function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}

function stripMarkdownExtension(relativePath: string) {
  return relativePath.replace(markdownExtensionPattern, "");
}

function slugFromRelativePath(relativePath: string) {
  const segments = stripMarkdownExtension(relativePath).split("/").filter(Boolean);

  if (segments.at(-1) === "README") {
    segments.pop();
  }

  return segments;
}

function routeFromSlugSegments(slugSegments: string[]) {
  if (slugSegments.length === 0) {
    return "/";
  }

  return `/${slugSegments.map((segment) => encodeURIComponent(segment)).join("/")}/`;
}

function deriveTitle(source: string, relativePath: string) {
  const headingMatch = source.match(/^#\s+(.+)$/m);

  if (headingMatch) {
    return headingMatch[1]?.trim() ?? "Untitled";
  }

  const basename = path.posix.basename(stripMarkdownExtension(relativePath));
  return basename === "README" ? "Untitled" : basename;
}

function deriveExcerpt(source: string) {
  const firstMeaningfulLine = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("- ") && !line.startsWith("```"));

  return firstMeaningfulLine ?? "";
}

function candidateKeysForReference(reference: string) {
  const normalized = toPosixPath(reference).replace(/^\.\//, "").replace(/\/+/g, "/");
  const keys = new Set<string>();

  if (!normalized || normalized === ".") {
    keys.add("");
    keys.add("README");
    keys.add("README.md");
    return [...keys];
  }

  const withoutExtension = normalized.replace(markdownExtensionPattern, "");

  keys.add(normalized);
  keys.add(withoutExtension);

  if (path.posix.basename(withoutExtension) === "README") {
    const directory = path.posix.dirname(withoutExtension);
    keys.add(directory === "." ? "" : directory);
    keys.add(directory === "." ? "README" : `${directory}/README`);
    keys.add(directory === "." ? "README.md" : `${directory}/README.md`);
  } else {
    keys.add(`${withoutExtension}.md`);
    keys.add(`${withoutExtension}/README`);
    keys.add(`${withoutExtension}/README.md`);
  }

  return [...keys].filter((value) => value !== ".");
}

function createNoteIndex(relativePaths: string[]) {
  const index = new Map<string, string>();

  for (const relativePath of relativePaths) {
    const routePath = routeFromSlugSegments(slugFromRelativePath(relativePath));

    for (const candidate of candidateKeysForReference(relativePath)) {
      if (!index.has(candidate)) {
        index.set(candidate, routePath);
      }
    }
  }

  return index;
}

function resolveWikiTarget(
  currentRelativePath: string,
  rawTarget: string,
  noteIndex: Map<string, string>
) {
  const baseDirectory = path.posix.dirname(currentRelativePath);
  const resolved = path.posix.normalize(path.posix.join(baseDirectory, rawTarget));

  for (const candidate of candidateKeysForReference(resolved)) {
    const routePath = noteIndex.get(candidate);

    if (routePath) {
      return routePath;
    }
  }

  return null;
}

function rewriteWikiLinks(
  markdownSource: string,
  currentRelativePath: string,
  noteIndex: Map<string, string>
) {
  return markdownSource.replace(/\[\[([^[\]]+)\]\]/g, (_fullMatch, innerValue: string) => {
    const [targetAndAnchor = "", alias] = innerValue.split("|");
    const [rawTarget = "", rawAnchor] = targetAndAnchor.split("#");
    const normalizedTarget = rawTarget.trim();
    const label = (alias ?? rawTarget).trim();

    if (!normalizedTarget) {
      return label;
    }

    const routePath = resolveWikiTarget(currentRelativePath, normalizedTarget, noteIndex);

    if (!routePath) {
      return label;
    }

    const anchorSuffix = rawAnchor ? `#${encodeURIComponent(rawAnchor.trim())}` : "";
    return `[${label}](${routePath}${anchorSuffix})`;
  });
}

async function collectMarkdownFiles(directory: string) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && markdownExtensionPattern.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

export async function getAllNotes() {
  const absoluteFiles = await collectMarkdownFiles(contentRoot);
  const relativePaths = absoluteFiles
    .map((absolutePath) => toPosixPath(path.relative(contentRoot, absolutePath)))
    .sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
  const noteIndex = createNoteIndex(relativePaths);

  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const sourcePath = path.join(contentRoot, relativePath);
      const source = await fs.readFile(sourcePath, "utf8");
      const html = await marked.parse(rewriteWikiLinks(source, relativePath, noteIndex));
      const slugSegments = slugFromRelativePath(relativePath);

      return {
        title: deriveTitle(source, relativePath),
        sourcePath: `content/${relativePath}`,
        routePath: routeFromSlugSegments(slugSegments),
        slugSegments,
        excerpt: deriveExcerpt(source),
        html,
        isDirectoryIndex: relativePath === "README.md" || relativePath.endsWith("/README.md")
      } satisfies NoteRecord;
    })
  );
}

export async function getNoteByRoutePath(routePath: string) {
  const notes = await getAllNotes();
  return notes.find((note) => note.routePath === routePath) ?? null;
}
