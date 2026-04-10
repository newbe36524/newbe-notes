---
slug: /
---

# newbe-notes

个人知识库。先建骨架，再逐步填充。

## 目录

- [[00-Index/README|00-Index]]：入口与导航
- [[10-Projects/README|10-Projects]]：项目笔记
- [[20-Engineering/README|20-Engineering]]：工程实践
- [[30-Operations/README|30-Operations]]：运维与发布
- [[90-Templates/README|90-Templates]]：模板
- [[99-Inbox/README|99-Inbox]]：临时收纳

## 当前重点

- [[engineering/container/docker-multi-platform-publishing|Docker 多平台发布经验]]

## Astro Workspace Contract

`repos/newbe-notes` now carries a self-contained Astro workspace. The root files
that every compliant app relies on are:

- `package.json`: root scripts for `dev`, `build`, `preview`, `check`, and `validate`
- `pnpm-workspace.yaml`: workspace discovery for `apps/*` and `packages/*`
- `tsconfig.base.json`: shared TypeScript baseline for Astro apps
- `packages/tooling`: shared Vite config and compatibility guards
- `apps/<app-name>`: the canonical location for repository-managed Astro apps

The initial app lives in `apps/site`. Future Astro apps should follow the same
layout and depend on `@newbe-notes/tooling` instead of copying config files into
each application.

## Commands

Use Corepack so the repository always runs with the pinned pnpm version:

```bash
corepack pnpm install
corepack pnpm run dev
corepack pnpm run build
corepack pnpm run preview
corepack pnpm run check
corepack pnpm run validate
```

`validate` runs the compatibility tests first, then exercises the root `check`,
`dev`, `build`, and `preview` flows against `apps/site`.

## Astro And Vite 8 Policy

The repository currently treats the Astro runtime profile as an exact,
repository-owned pair:

- `astro`: `6.1.5`
- `vite`: `8.0.8`

The compatibility guard in `packages/tooling/scripts/verify-astro-compat.mjs`
fails before any app command runs when:

- Node is below `22.12.0`
- `astro` or `vite` drifts from the pinned workspace pair
- an `@astrojs/*` runtime integration is added without an explicit policy entry

Astro integrations that depend on Vite behavior are deny-by-default for this
profile. To add one, validate it with `corepack pnpm run validate`, then record
the exact package version in
`packages/tooling/astro/integration-policy.mjs` before merging.

When maintainers need to update the version pair:

1. Change the exact versions in `package.json`, `apps/site/package.json`, and `packages/tooling/astro/integration-policy.mjs`.
2. Run `corepack pnpm install` to refresh the lockfile.
3. Run `corepack pnpm run validate`.
4. Only then update CI expectations.

## Canonical Requirements

The executable files live inside `repos/newbe-notes`, but the canonical
requirements stay in the aggregate checkout under
`openspec/changes/add-astro-vite8-support-to-newbe-mono/`. Keep requirement
changes there and keep implementation changes in this repository workspace.
