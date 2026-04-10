---
slug: projects/hagicode-public-sites-and-community
---

# HagiCode 公开站点与社群入口

## 这篇笔记整理什么

这是一份面向外部公开信息的快照，集中整理 HagiCode 当前可公开引用的：

- 关键站点入口
- 备案信息
- 社群与内容分发渠道
- 可作为 source of truth 的公开数据入口

本文只记录已经公开发布的信息，不包含任何内部地址、私有配置或未公开规划。

## 本次核对时间

- 仓库参考时间：`2026-04-10`
- 线上核对时间：`2026-04-10`

## 公开信息来源

本次整理主要基于以下来源：

- 只读参考仓库：`/home/newbe36524/repos/hagicode-mono/repos/index`
- 站点清单源文件：`repos/index/src/data/public/sites.json`
- 社群清单源文件：`repos/index/src/data/about/about-source.ts`
- 线上站点清单：`https://index.hagicode.com/sites.json`
- 线上社群清单：`https://index.hagicode.com/about.json`
- 主站页脚备案展示：`https://hagicode.com/`

判断上应优先以 `index.hagicode.com` 发布出来的 JSON 为公开 canonical 入口；这篇笔记只是方便查阅的人工整理版。

## 关键站点

### 核心站点

| 站点 | 地址 | 说明 |
| --- | --- | --- |
| HagiCode 主站 | `https://hagicode.com/` | 产品官网、统一入口 |
| HagiCode Docs | `https://docs.hagicode.com/` | 正式文档与使用指南 |
| newbe | `https://newbe.hagicode.com/` | 长期文章与技术沉淀 |

### 数据与工具

| 站点 | 地址 | 说明 |
| --- | --- | --- |
| Index Data Mirror | `https://index.hagicode.com/data/` | 人类可读的数据镜像页 |
| Docker Compose Builder | `https://builder.hagicode.com/` | Docker Compose 配置生成 |
| AI Replacement Calculator | `https://cost.hagicode.com/` | AI 替代成本测算工具 |
| HagiCode Status | `https://status.hagicode.com/` | 对外服务状态页 |
| Awesome Design MD | `https://design.hagicode.com/` | 设计条目与 DESIGN.md 画廊 |

### 创作实验

| 站点 | 地址 | 说明 |
| --- | --- | --- |
| Soul Builder | `https://soul.hagicode.com/` | 面向角色灵魂设定的独立站点 |
| Trait Builder | `https://trait.hagicode.com/` | 面向特质搜索与组合的独立站点 |

## 备案信息

截至 `2026-04-10`，直接从 `https://hagicode.com/` 页脚可见：

- ICP 备案：`闽ICP备2026004153号-1`
- 公安备案：`闽公网安备35011102351148号`

当前这份笔记只记录主站页脚明确展示出来的备案信息。若后续其他公开站点也单独展示备案号，应以各自页面实时展示为准，再回写这里。

## 社群入口

### 直接可加入或可关注的渠道

| 渠道 | 公开信息 | 入口 |
| --- | --- | --- |
| QQ群 | `610394020` | `https://qm.qq.com/q/ZWPYvrYRYQ` |
| 飞书群 | 通过公开邀请链接加入 | `https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=238gb3f7-6820-43b8-9f1f-e0f2e704a000` |
| Discord | 公开邀请链接 | `https://discord.gg/b5kDHUcUZY` |
| 微信公众号 | `NEWBE` 公众号二维码见 `about.json` | `https://index.hagicode.com/about.json` |
| 抖音 | 账号 `hagicode` | `https://index.hagicode.com/about.json` |

### 内容平台与对外分发

| 渠道 | 入口 |
| --- | --- |
| YouTube | `https://www.youtube.com/@hagicode` |
| Bilibili | `https://space.bilibili.com/272265720` |
| 小红书 | `https://www.xiaohongshu.com/user/profile/665e764800000000030320b6` |
| 小黑盒 | `https://www.xiaoheihe.cn/app/user/profile/92527604` |
| InfoQ | `https://www.infoq.cn/u/newbe36524/publish` |
| 思否 | `https://segmentfault.com/u/newbe36524` |
| CSDN | `https://blog.csdn.net/pianzide1117` |
| 腾讯云开发者社区 | `https://cloud.tencent.com/developer/user/1583778` |
| OSCHINA | `https://my.oschina.net/newbe36524` |
| 掘金 | `https://juejin.cn/user/2682464104098654` |
| 博客园 | `https://www.cnblogs.com/newbe36524` |
| 知乎 | `https://www.zhihu.com/people/newbe36524` |
| Dev.to | `https://dev.to/newbe36524` |
| X | `https://x.com/newbe36524` |
| LinkedIn | `https://www.linkedin.com/in/newbe36524/` |
| Facebook | `https://www.facebook.com/people/Justin-Yu/pfbid033bU66WV6A8LHVUp1sDTGFHo6io5NdRQ7ThCj6Euo56FMx76WcVdJ3dMbGbtcoLgCl/` |

## 最值得记住的两个公开 JSON

若只是想拿到“机器可读的公开入口”，优先记住这两个：

- 站点总表：`https://index.hagicode.com/sites.json`
- 社群与联系渠道总表：`https://index.hagicode.com/about.json`

这两个地址比手工维护的清单更适合被其他站点、脚本、文档或导航页复用。

## 维护建议

- 若站点入口有新增或下线，优先更新 `repos/index/src/data/public/sites.json`
- 若社群、二维码或联系渠道有变化，优先更新 `repos/index/src/data/about/about-source.ts`
- `index.hagicode.com` 发布完成后，再同步更新这篇 notes
- 若只是临时活动页，不建议直接写入长期清单，避免把短期入口误写成长期入口
