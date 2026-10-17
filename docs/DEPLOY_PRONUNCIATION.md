# 部署英文提示读音服务

仓库已提供 Render Blueprint：`render.yaml`。它只部署 `services/` 中的 Python 服务，不部署 Next.js 页面，也不会在部署、健康检查时生成任何读音。

## 创建服务

打开 [部署 Between 读音服务到 Render](https://render.com/deploy?repo=https://github.com/JackZhong1998/personal-Agent)。登录你自己的 Render 账号，按平台提示授权访问该 GitHub 仓库并创建 Blueprint。

配置已指定 Docker、免费实例、新加坡区域、`/health` 健康检查，以及随 GitHub 提交自动更新。**`EDGE_TTS_SECRET` 由 Render 自动生成，不需要你自己编造或从第三方购买。** 当前使用免费实例；如账号不支持此计划，平台会提示选择，代码不会自动选择付费方案。

## 连接 Vercel

等 Render 服务显示已上线，获取两个值：

| Vercel 变量 | 从哪里取得 |
| --- | --- |
| `EDGE_TTS_URL` | Render 服务 Overview 页面实际分配的公网 HTTPS 地址。不加 `/speak`，不要填写示例域名或 localhost。 |
| `EDGE_TTS_SECRET` | Render 服务 Environment 页面，查看自动生成的同名变量，安全复制到 Vercel。不要发到聊天或提交到 GitHub。 |

在 Vercel 项目的 Settings → Environment Variables 添加它们，选择需要使用的 Production / Preview 环境，然后重新部署对应环境。Render 中的 `HOST`、`PORT` 不需要复制到 Vercel。

## 检查结果

1. 服务地址加 `/health` 应返回 `ok: true`、`provider: edge-tts`、`version: 7.3.1`、`generation: on-demand`。此操作不会生成语音，也不代表微软上游已经连通。
2. 没有访问密钥的 `/speak` 请求必须返回 401；这证明接口没有对外匿名开放。
3. Vercel 重新部署后，进入章节，展开表达提示。**只有你点击读音按钮时才生成该句音频**；成功后由主应用存入 Supabase，后续点击复用缓存。

免费实例空闲后可能休眠，首次调用会经历冷启动。如果读音按钮首次超时，等 Render 服务恢复运行后再试；当前主应用请求超时为 30 秒。角色语音仍由 Cartesia 单独提供，不依赖此服务。

## 读音返回 502 时

先检查 Render 最新部署是否为当前 GitHub 提交，以及 `/health` 的版本是否为 `7.3.1`。旧版 `7.2.7` 使用的微软请求校验协议已被新版替换。更新服务无需更换环境变量，已有主应用音频缓存继续复用。

在 Render 服务 → Logs 中查找 `pronunciation_failed`。日志只记录错误类别、异常类型和上游 HTTP 状态，不记录对话、密钥或带签名的请求地址：

| code | 含义 |
| --- | --- |
| `upstream_rejected` | 微软返回 401 / 403，需检查依赖版本及服务出口是否被拒绝。 |
| `upstream_timeout` | 等待或生成超过 25 秒，服务返回 504。 |
| `upstream_http_error` | 微软返回其他 HTTP 错误，查看同一行的 `upstream_status`。 |
| `upstream_unavailable` | 网络、WebSocket 或其他上游异常，查看异常类型。 |
| `empty_audio` | 上游没有返回有效音频。 |

若没有上述日志但前端显示 502，检查 Render 的部署状态和网关错误。若显示 401，则检查 Vercel 与 Render 的 `EDGE_TTS_SECRET` 是否相同，并重新部署 Vercel。

## 当前交付状态

已准备自动部署配置与本地服务合同测试；本地测试不调用真实 TTS。目前执行环境没有 Render / Vercel 部署凭据或关联云账号。**推送配置不等于服务上线**：必须通过你的部署平台账号创建服务，才能取得真实服务地址及平台生成的密钥。

本地验证命令：

```bash
.venv/bin/python -m unittest discover -s services -p 'test_*.py' -v
```

## 服务临时故障时继续听读音

主应用会区分上游拒绝、生成超时、网关错误和访问凭证错误，在 Vercel 日志记录 `guide request failed` 与安全的错误代码，不记录提供方完整响应。网络超时不再变成无法区分的通用 500。错误响应同时包含 `code`，例如 `guide_upstream_rejected` 或 `guide_gateway_error`。

失败后页面提供「重试读音」与「系统朗读」。只有用户点击「系统朗读」才调用浏览器 Speech Synthesis，使用英文语音；不调用 Cartesia 付费接口，不推进剧情。此音频无法由网页导出保存，页面明确标记「系统朗读 · 未保存音频」，不会写成已缓存。暂停、开始录音、播放其他音频或退出对话都会取消系统朗读。若手机没有可用的英文语音或浏览器不支持，会显示错误并保留重试入口。

备用朗读不证明 Render / 微软上游已经恢复；主服务原因仍需结合失败响应与部署平台日志确认。正常 edge-tts 成功路径仍先保存再播放，原有缓存键保持不变。
