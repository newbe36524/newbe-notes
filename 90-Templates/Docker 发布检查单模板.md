# Docker 发布检查单模板

## 基本信息

- 项目：
- 版本：
- 发布目标：
- 触发方式：`workflow_dispatch / repository_dispatch / local`
- 发布人：
- 发布时间：

## 版本确认

- [ ] 已确认本次发布版本号
- [ ] 已确认版本来源唯一
- [ ] 已确认当前版本非误发旧版本
- [ ] 已确认预发布或稳定版属性
- [ ] 已确认稳定版才可占用 `latest`

## 构建输入

- [ ] 已确认构建产物齐全
- [ ] 已确认产物命名符合平台约定
- [ ] 已确认 `linux/amd64` 产物可用
- [ ] 已确认 `linux/arm64` 产物可用
- [ ] 已确认 Dockerfile 与入口脚本为预期版本

## 平台策略

- [ ] 已确认目标平台：`all / linux-amd64 / linux-arm64`
- [ ] 已确认 buildx 已启用
- [ ] 已确认 QEMU 已启用
- [ ] 已确认多平台产物不会混装
- [ ] 已确认单平台补发不会误改其他平台结果

## Registry 策略

- [ ] 已确认主发布 Registry
- [ ] 已确认旁路 Registry 是否一并发布
- [ ] 已确认各 Registry 凭据完整
- [ ] 已确认各 Registry namespace / image name 正确
- [ ] 已确认失败时可按 Registry 单独重跑

## 配置与密钥

- [ ] 已确认版本参数已传入
- [ ] 已确认平台参数已传入
- [ ] 已确认 dry run 开关符合预期
- [ ] 已确认 secrets 来源正确
- [ ] 已确认日志不会泄露 token

## Tag 策略

- [ ] 已确认完整版本 tag 正确，如 `1.2.3`
- [ ] 已确认 `major.minor` tag 正确，如 `1.2`
- [ ] 已确认 `major` tag 正确，如 `1`
- [ ] 已确认预发布版本不会推 `latest`
- [ ] 已确认 retag 策略无需重复构建

## 发布执行前

- [ ] 已跑一次 dry run
- [ ] 已检查 workflow inputs 解析结果
- [ ] 已检查版本、平台、dry run 摘要输出
- [ ] 已确认失败告警路径可用
- [ ] 已确认补发预案明确

## 发布执行后

- [ ] 已确认镜像推送成功
- [ ] 已确认 manifest 可拉取
- [ ] 已确认 amd64 拉取正常
- [ ] 已确认 arm64 拉取正常
- [ ] 已确认关键 tag 已生成

## 验证命令

```bash
docker buildx imagetools inspect <image>:<tag>
docker pull --platform linux/amd64 <image>:<tag>
docker pull --platform linux/arm64 <image>:<tag>
```

## 回滚与补发

- [ ] 已确认回滚版本
- [ ] 已确认补发仅影响目标 Registry
- [ ] 已确认旧 tag 处理策略
- [ ] 已确认通知相关人员

## 发布记录

- 结果：`成功 / 失败 / 部分成功`
- 失败点：
- 处置：
- 后续动作：

## 使用建议

- 稳定版与预发布版宜分开检查
- 多 Registry 发布宜逐条记录结果
- 若为补发，宜额外注明原因
