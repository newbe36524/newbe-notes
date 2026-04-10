export type RouteMatchMode = "exact" | "prefix";

export interface SiteLinkItem {
  label: string;
  href: string;
  description: string;
  external?: boolean;
  matchMode?: RouteMatchMode;
}

export interface SectionNavItem {
  label: string;
  href: string;
  matchMode?: RouteMatchMode;
}

export const siteShellMeta = {
  name: "newbe-notes",
  tagline: "Public-facing notes and reusable operating context.",
  summary: "公开知识库，沉淀项目之外也能长期复用的经验与入口。",
  owner: "newbe36524"
} as const;

export const hagiCodeReferenceRoute = "/projects/hagicode-public-sites-and-community/";

export const primaryNavItems: SiteLinkItem[] = [
  {
    label: "首页",
    href: "/",
    description: "返回 newbe-notes 首页。",
    matchMode: "exact"
  },
  {
    label: "索引",
    href: "/index/",
    description: "查看知识库入口与导航。",
    matchMode: "prefix"
  },
  {
    label: "项目",
    href: "/projects/",
    description: "浏览项目相关笔记。",
    matchMode: "prefix"
  },
  {
    label: "工程",
    href: "/engineering/",
    description: "浏览工程实践笔记。",
    matchMode: "prefix"
  },
  {
    label: "运维",
    href: "/operations/",
    description: "浏览运维与交付笔记。",
    matchMode: "prefix"
  }
];

const hagicodeShellLinks: Array<SiteLinkItem & { surfaces: Array<"header" | "footer"> }> = [
  {
    label: "Entry Note",
    href: hagiCodeReferenceRoute,
    description: "站内整理的 HagiCode 公开入口笔记。",
    matchMode: "exact",
    surfaces: ["header", "footer"]
  },
  {
    label: "HagiCode",
    href: "https://hagicode.com/",
    description: "HagiCode 产品官网。",
    external: true,
    surfaces: ["header", "footer"]
  },
  {
    label: "Docs",
    href: "https://docs.hagicode.com/",
    description: "HagiCode 正式文档。",
    external: true,
    surfaces: ["header", "footer"]
  },
  {
    label: "newbe",
    href: "https://newbe.hagicode.com/",
    description: "长期文章与技术沉淀。",
    external: true,
    surfaces: ["header", "footer"]
  },
  {
    label: "Status",
    href: "https://status.hagicode.com/",
    description: "对外服务状态页。",
    external: true,
    surfaces: ["header", "footer"]
  },
  {
    label: "Data Mirror",
    href: "https://index.hagicode.com/data/",
    description: "公开数据镜像页。",
    external: true,
    surfaces: ["footer"]
  }
];

export function getHagiCodeLinks(surface: "header" | "footer") {
  return hagicodeShellLinks.filter((link) => link.surfaces.includes(surface));
}

export function matchesRoute(currentRoute: string, href: string, mode: RouteMatchMode = "exact") {
  if (mode === "exact") {
    return currentRoute === href;
  }

  if (href === "/") {
    return currentRoute === href;
  }

  return currentRoute === href || currentRoute.startsWith(href);
}

export function isLinkCurrent(currentRoute: string, link: Pick<SiteLinkItem, "href" | "external" | "matchMode">) {
  if (link.external) {
    return false;
  }

  return matchesRoute(currentRoute, link.href, link.matchMode ?? "exact");
}

export function formatSectionLabel(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
