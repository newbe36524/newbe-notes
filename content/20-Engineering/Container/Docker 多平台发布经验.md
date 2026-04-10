---
slug: engineering/container/docker-multi-platform-publishing
---

# Docker 多平台发布经验

## 目的

将同一版本，稳定发布到多架构与多 Registry。参考来源为只读仓库 `repos/hagicode-release`。

## 这套方案在做什么

- 用 `VersionMonitor` 先找“当前应发布之最新版本”
- GitHub Release 与 Docker 发布解耦
- Docker 发布按 Registry 拆工作流
- 各工作流都要求显式 `version`
- 平台参数统一为 `all / linux-amd64 / linux-arm64`
- 由 Nuke 统一做下载、解包、buildx 构建、retag、push

## 可直接复用的经验

### 1. 先定“发布入口”，勿让触发分散

HagiCode Release 将自动发布收束为单入口：

- 版本发现由 `./build.sh VersionMonitor` 负责
- Docker 自动化仅从 `repository_dispatch` 的 registry 专属事件进入
- 手动补发则走各工作流的 `workflow_dispatch`

此设计之利：

- 版本选择逻辑只写一处
- 自动触发与人工补发路径一致
- 各 Registry 出故障时，易单独重跑

## 2. Registry 拆流，不要一锅煮

参考仓库为 Azure ACR、Aliyun ACR、DockerHub 各放一条工作流。其价值在于：

- 凭据隔离
- 失败隔离
- 补发方便
- 审计清楚

若强行把多 Registry 塞进一条流水线，常见后果是：

- 一个 Registry 登录失败，拖垮全局
- 总结信息混乱
- 回滚与重试粒度过粗

## 3. 平台值要收敛

平台参数只接受：

- `all`
- `linux-amd64`
- `linux-arm64`

Nuke 内部再映射为：

- `linux/amd64`
- `linux/arm64`

重点是，外部输入应少，内部表达应标准。否则脚本、工作流、镜像标签三处很快失配。

## 4. 多架构构建，核心是 buildx + QEMU

工作流中先做：

- `docker/setup-buildx-action`
- `docker/setup-qemu-action`

再进入 Nuke 构建。此顺序不可乱。结论是：

- 无 buildx，则难统一多架构构建
- 无 QEMU，则跨架构构建不稳

## 5. 构建上下文要按平台预展开

参考实现并非把所有产物粗暴塞进一个 `lib/`。它会：

- 先下载构建产物 zip
- 按平台过滤 zip 名，如 `linux-x64`、`linux-arm64`
- 多平台时分别解到 `lib-amd64/`、`lib-arm64/`
- 再生成 Dockerfile 并发起 buildx

此法可避两类坑：

- amd64 产物误入 arm64 镜像
- Dockerfile 先引用、目录后生成之时序错误

## 6. Tag 策略要机械化

参考仓库会从版本号生成多组 tag：

- 完整版本，如 `1.2.3`
- `major.minor`，如 `1.2`
- `major`，如 `1`
- `latest`，但仅稳定版可得

预发布版本如 `beta / rc / alpha / preview / dev` 不应推 `latest`。这是底线，不是优化项。

## 7. Retag 不必重建镜像

参考实现用 `docker buildx imagetools create` 基于已推送 manifest 复制 tag，而非重新 build。好处：

- 更快
- 更省流量
- 不重复计算
- 多架构 manifest 可直接复用

## 8. 配置优先级要固定

Nuke 的配置优先级是：

1. 命令行参数
2. 环境变量
3. YAML 配置
4. 代码默认值

这是很实用的约束。重点是：

- CI 用环境变量注入 secrets
- 本地补发可直接命令行覆盖
- 默认配置只承担兜底

## 9. 凭据设计宜“必需与可选”分层

参考仓库里：

- Azure ACR 是主发布通道，凭据必需
- Aliyun ACR 与 DockerHub 可选

这比“所有凭据全必填”更合理。因为真实环境常有：

- 主通道必须成功
- 旁路通道可择时补发

## 10. Dry Run 必须打通

工作流与 Nuke 都支持 `dry_run` / `NUGEX_DryRun`。意义很直接：

- 可先验证版本解析
- 可验证参数透传
- 可看摘要是否正确
- 可在不推镜像时排查流程

无 dry run 的发布系统，排障成本通常偏高。

## 11. 发布摘要不要省

参考工作流会输出 summary：

- Registry
- Version
- Trigger Source
- Platform
- Dry Run
- Is Stable
- Image Tags

这使一次发布在事后仍可快速复盘。宜保留。

## 12. 运行时变量与构建变量要分层

参考仓库把两类变量明确分开：

- 构建发布变量：Registry、平台、版本、token
- 容器运行时变量：`PUID/PGID`、Claude/Codex 等 CLI 配置

此分层很重要。否则常见问题是“镜像构建参数”与“容器启动参数”混在一起，后续维护极乱。

## 推荐落地模板

### 工作流层

- `version-monitor.yml`：只决定“发哪个版本”
- `docker-build-azure-acr.yml`：只管 Azure ACR
- `docker-build-aliyun-acr.yml`：只管 Aliyun ACR
- `docker-build-dockerhub.yml`：只管 DockerHub

### 构建层

- 统一下载产物
- 按平台解包
- 统一生成 Dockerfile
- 统一 buildx build
- 统一 retag

### 配置层

- 必填 secrets：主 Registry、版本来源、GitHub Token
- 可选 secrets：旁路 Registry
- 显式平台参数：`all / linux-amd64 / linux-arm64`

## 一份实用检查单

- 是否只有一个“版本选择入口”
- 是否按 Registry 分工作流
- 是否支持手动补发单一 Registry
- 是否已启用 buildx 与 QEMU
- 是否按平台拆构建产物
- 是否禁止预发布占用 `latest`
- 是否支持 dry run
- 是否有发布摘要
- 是否区分构建参数与运行时参数

## 参考文件

- `repos/hagicode-release/README.md`
- `repos/hagicode-release/README_cn.md`
- `repos/hagicode-release/ENVIRONMENT_VARIABLES.md`
- `repos/hagicode-release/.github/workflows/version-monitor.yml`
- `repos/hagicode-release/.github/workflows/docker-build-azure-acr.yml`
- `repos/hagicode-release/.github/workflows/docker-build-dockerhub.yml`
- `repos/hagicode-release/nukeBuild/Build.Targets.Docker.cs`
- `repos/hagicode-release/nukeBuild/Build.Targets.Docker.AppImage.cs`
- `repos/hagicode-release/nukeBuild/Build.Targets.BuildConfig.cs`
- `repos/hagicode-release/nukeBuild/Build.TargetsDockerPush.cs`

## 后续可补

- 各 Registry 的认证差异
- manifest inspect 与验签
- 回滚策略
- 多平台产物命名约定
