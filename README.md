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
