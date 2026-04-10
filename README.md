# newbe-notes

这个仓库现在分成两层：

- `content/`：实际笔记内容与目录结构
- `apps/site/`：渲染这些笔记的 Astro 站点

内容站点会直接读取 `content/**/*.md`，因此新增、移动或整理笔记时，优先在
`content/` 下操作，不需要把 Markdown 再复制一份到 `apps/site/src/`。

## 常用命令

```bash
corepack pnpm install
corepack pnpm run dev
corepack pnpm run build
corepack pnpm run preview
corepack pnpm run check
corepack pnpm run validate
```

## 内容约定

- 根入口笔记是 `content/README.md`
- 分类目录继续使用 `content/00-Index/`、`content/20-Engineering/` 这类结构
- 每篇笔记应在 frontmatter 中定义 ASCII `slug`
- Obsidian 风格 wiki link 会在构建时转换成站点链接

## 站点壳层导航

- 统一页眉、页脚与 HagiCode 公开入口定义集中在 `apps/site/src/lib/site-shell.ts`
- `apps/site/src/components/site-header.astro` 只消费共享配置里的精简快捷入口
- `apps/site/src/components/site-footer.astro` 复用同一份配置展示扩展版公开链接
- 新增 HagiCode 壳层链接时，只放公开、安全、适合长期引用的入口；详细长尾渠道继续维护在 `content/10-Projects/HagiCode 公开站点与社群入口.md`
