import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

interface NoteFrontmatter {
  slug?: string;
  title?: string;
}

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

function parseFrontmatter(source: string) {
  if (!source.startsWith("---\n")) {
    return {
      data: {} as NoteFrontmatter,
      content: source
    };
  }

  const endIndex = source.indexOf("\n---\n", 4);

  if (endIndex === -1) {
    return {
      data: {} as NoteFrontmatter,
      content: source
    };
  }

  const rawFrontmatter = source.slice(4, endIndex);
  const content = source.slice(endIndex + 5);
  const data: NoteFrontmatter = {};

  for (const line of rawFrontmatter.split(/\r?\n/)) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.+?)\s*$/.exec(line);

    if (!match) {
      continue;
    }

    const [, key = "", rawValue = ""] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key === "slug" || key === "title") {
      data[key] = value;
    }
  }

  return {
    data,
    content
  };
}

function normalizeSlugSegments(frontmatterSlug: string | undefined, relativePath: string) {
  if (!frontmatterSlug) {
    return slugFromRelativePath(relativePath);
  }

  const normalized = frontmatterSlug.trim();

  if (normalized === "/") {
    return [];
  }

  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) {
    throw new Error(`Invalid empty slug in content/${relativePath}.`);
  }

  for (const segment of segments) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) {
      throw new Error(
        `Invalid slug segment "${segment}" in content/${relativePath}. Use lowercase ASCII words and hyphens only.`
      );
    }
  }

  return segments;
}

function deriveTitle(
  source: string,
  relativePath: string,
  frontmatterTitle: string | undefined
) {
  if (frontmatterTitle?.trim()) {
    return frontmatterTitle.trim();
  }

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

function candidateKeysForSlugReference(reference: string) {
  const normalized = toPosixPath(reference)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
  const keys = new Set<string>();

  if (!normalized) {
    keys.add("");
    keys.add("/");
    return [...keys];
  }

  keys.add(normalized);
  keys.add(`/${normalized}`);

  return [...keys];
}

function createNoteIndex(
  notes: Array<{
    relativePath: string;
    slugSegments: string[];
    routePath: string;
  }>
) {
  const index = new Map<string, string>();
  const usedRoutes = new Set<string>();

  for (const { relativePath, slugSegments, routePath } of notes) {
    if (usedRoutes.has(routePath)) {
      throw new Error(`Duplicate note route detected: ${routePath}`);
    }

    usedRoutes.add(routePath);

    for (const candidate of candidateKeysForReference(relativePath)) {
      if (!index.has(candidate)) {
        index.set(candidate, routePath);
      }
    }

    for (const candidate of candidateKeysForSlugReference(slugSegments.join("/"))) {
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
  for (const candidate of candidateKeysForSlugReference(rawTarget)) {
    const routePath = noteIndex.get(candidate);

    if (routePath) {
      return routePath;
    }
  }

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
  const noteSources = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const sourcePath = path.join(contentRoot, relativePath);
      const source = await fs.readFile(sourcePath, "utf8");
      const { data, content } = parseFrontmatter(source);
      const slugSegments = normalizeSlugSegments(data.slug, relativePath);

      return {
        relativePath,
        content,
        frontmatter: data,
        slugSegments,
        routePath: routeFromSlugSegments(slugSegments)
      };
    })
  );
  const noteIndex = createNoteIndex(noteSources);

  return Promise.all(
    noteSources.map(async (noteSource) => {
      const html = await marked.parse(
        rewriteWikiLinks(noteSource.content, noteSource.relativePath, noteIndex)
      );

      return {
        title: deriveTitle(
          noteSource.content,
          noteSource.relativePath,
          noteSource.frontmatter.title
        ),
        sourcePath: `content/${noteSource.relativePath}`,
        routePath: noteSource.routePath,
        slugSegments: noteSource.slugSegments,
        excerpt: deriveExcerpt(noteSource.content),
        html,
        isDirectoryIndex:
          noteSource.relativePath === "README.md" ||
          noteSource.relativePath.endsWith("/README.md")
      } satisfies NoteRecord;
    })
  );
}

export async function getNoteByRoutePath(routePath: string) {
  const notes = await getAllNotes();
  return notes.find((note) => note.routePath === routePath) ?? null;
}
