---
slug: operations/hagicode-site-aliyun-esa
---

# HagiCode Site 发布到阿里云 ESA 笔记

## 目的

将 monorepo 中的 `repos/site` 发布到阿里云 ESA Pages，并挂到自定义域名。

## 参考范围

- 只读参考仓库：`/home/newbe36524/repos/hagicode-mono/repos/site`
- 本文只整理 HagiCode Site 这一个项目，不扩展到其他子仓库

## 先看仓库现状

### 1. 构建入口已清楚

`repos/site/package.json` 里已给出发布所需关键值：

- `engines.node` 为 `>=22.12.0`
- `build` 为 `npm run sync:footer-sites && astro build && npm run seo:audit`
- 构建产物目录为 `dist`

### 2. 站点形态是 Astro 多页静态站

`repos/site/astro.config.mjs` 里可见：

- `site` 为 `https://hagicode.com`
- `base` 为 `/`
- 默认语种为 `en`
- 存在 `zh-CN` 路由

结论是：此项目首先是 Pages 静态站，而非“必须依赖函数入口”的项目。

### 3. 仓库已自带 ESA 配置

`repos/site/esa.jsonc` 当前内容：

```json
{
  "name": "hagicode site",
  "entry": "./src/index.js",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

此处有两点要先记住：

- `assets.directory = ./dist` 是对的
- `entry = ./src/index.js` 有问题。仓库里并无此文件

## 推荐发布路径

优先用“导入 GitHub 仓库”方式发 ESA。此法最贴合当前 monorepo 与现有构建脚本。

## 控制台填写值

若直接导入 monorepo，则 ESA 控制台建议这样填：

| 项目 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | `/repos/site` |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build` |
| 静态资源目录 | `./dist` |
| Node.js 版本 | `22` |

补充说明：

- 若导入的不是 monorepo，而是单独的 `site` 仓库，则根目录填 `/`
- `repos/site/.github/workflows/azure-deploy-website.yml` 也使用 Node `22` 与 `NODE_ENV=production npm run build`，可视为现有发布事实参考

## 建议环境变量

最少先配：

- `NODE_ENV=production`

其余按需：

- `VITE_CLARITY_PROJECT_ID`
- `VITE_CLARITY_DEBUG`
- `LI_51LA_ID`
- `LI_51LA_DEBUG`

说明：

- Clarity 不配也能构建，只是相关统计不会启用
- `LI_51LA_ID` 在代码里已有默认值，若线上要换，再显式覆盖

## 实际发布步骤

### 1. 在 ESA 创建 Pages 项目

- 进入 ESA 控制台
- 打开“边缘计算 > 函数和 Pages”
- 选择“导入 GitHub 仓库”
- 完成 GitHub 授权
- 选择目标仓库

### 2. 填写构建信息

按上表填写即可。重点是：

- monorepo 场景下，根目录必须填 `/repos/site`
- 静态资源目录必须指向 `./dist`
- Node 版本要对齐仓库要求，直接用 `22`

### 3. 等首次构建完成

构建成功后，ESA 会给一个预览访问地址。此时先不要急着切正式域名，先验站点是否完整。

### 4. 验证关键页面

至少检查：

- `/`
- `/zh-CN/`
- `/desktop/`
- `/container/`
- `sitemap-index.xml`
- `robots.txt`

再检查：

- 首屏样式是否正常
- 图片与字体是否加载成功
- 中英文切换是否正常
- 站内跳转是否正常

### 5. 绑定正式域名

若准备正式上线，再做域名绑定。

- 若整个子域名都交给 Pages，用“域名绑定”
- 若只想把某一路径挂到已有 ESA 站点上，用“路由”

## 域名接入注意点

- 域名需先接入并激活 ESA
- 若选择“中国内地”或“全球”加速区域，域名需已完成 ICP 备案
- 若线上已有流量，宜先做本地测试，再正式切换 DNS

## 当前配置里的两个风险点

### 风险 1：`entry` 指向不存在文件

`esa.jsonc` 里的：

```json
"entry": "./src/index.js"
```

当前仓库无此文件。

而 ESA 文档里，`entry` 表示函数入口文件路径。对纯静态 Pages 项目，这个字段不该乱填。若 ESA 读取了该配置，可能直接把错误入口覆盖到控制台设置里。

结论是：

- 纯静态站先删掉 `entry`
- 若未来真要加函数，再填真实入口

更稳妥的静态站版本可先记为：

```json
{
  "name": "hagicode site",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

### 风险 2：`notFoundStrategy` 现设为 `singlePageApplication`

当前配置：

```json
"notFoundStrategy": "singlePageApplication"
```

这更像 SPA 的兜底方式。

但 `repos/site` 是 Astro 多页静态站，不是典型 SPA。并且当前仓库里也没有 `src/pages/404.*` 页面。

因此这里有两条路：

#### 路线 A：先维持现状

保留 `singlePageApplication`，优点是：

- 不必立刻补 404 页面
- 首次部署更快

缺点是：

- 未命中路径的回退行为更像 SPA
- 是否符合站点期望，要靠上线后实测

#### 路线 B：改成静态站模式

若想更贴合 Astro 多页站，宜：

1. 先新增 `src/pages/404.astro`
2. 再把 `notFoundStrategy` 改为 `404Page`

届时 ESA 配置可改成：

```json
{
  "name": "hagicode site",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "404Page"
  }
}
```

重点是，当前仓库未补 404 页前，不要盲改。

## 一份最小检查单

- 根目录是否为 `/repos/site`
- Node 版本是否为 `22`
- 安装命令是否为 `npm ci`
- 构建命令是否为 `npm run build`
- 静态资源目录是否为 `./dist`
- `esa.jsonc` 是否仍带错误 `entry`
- 首页与中英文页是否可访问
- 站内资源是否全部 200
- 域名证书是否已正常签发
- 未知路径的回退行为是否符合预期

## 可选路线：用 ESA CLI

若不想走 GitHub 导入，也可走 CLI：

```bash
npm i esa-cli@latest -g
esa-cli login
esa-cli commit
esa-cli deploy
```

但对当前 HagiCode Site 而言，GitHub 导入更省事。因为此仓库本就已有稳定的 `npm ci` 与 `npm run build` 路径。

## 参考文件

- `repos/site/package.json`
- `repos/site/astro.config.mjs`
- `repos/site/esa.jsonc`
- `repos/site/.github/workflows/azure-deploy-website.yml`
