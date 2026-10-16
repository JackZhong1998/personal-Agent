# Between 之间

移动优先的英语语音故事陪伴 Web 产品。**预写剧本，录完即推进，不调用大语言模型。**

已实现今日页、12 章示例故事、四轮语音练习、逐轮英文提示、回忆回放、每日两章成长规则和关系旅程。产品方案与用户逐屏流程见 [docs/PRODUCT.md](docs/PRODUCT.md)。

## 本地运行

需要 Node 24、npm、Python 3.12。

```bash
cd /workspace/personal-Agent
npm ci --cache /workspace/.npm-cache
python -m venv .venv
.venv/bin/pip install --cache-dir /workspace/.pip-cache -r services/requirements.txt
npm run dev
```

另一个终端启动英文读音服务：

```bash
cd /workspace/personal-Agent
npm run edge-tts
```

通过环境设置或被忽略的 `.env.local` 配置变量，参照 [.env.example](.env.example)。不要将真实密钥提交到仓库、写入客户端代码或设置为 `NEXT_PUBLIC_*`。

| 变量 | 用途 |
| --- | --- |
| `CARTESIA_API_KEY` | 角色语音，仅服务端 |
| `CARTESIA_MODEL` | 默认 `sonic-3.6` |
| `CARTESIA_VOICE_ID` | 默认用户指定 `afb402ce-7a39-49cf-acb5-3ff42e4e224f` |
| `CARTESIA_VERSION` | 默认 `2026-08-14`，参照官方 SDK 当前版本 |
| `SESSION_SECRET` | 线上必填，至少 32 字节随机值，签名匿名 Cookie；变更后旧 Cookie 失效 |
| `SUPABASE_URL` | 线上持久化数据库和私有 Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅服务端，不可暴露给浏览器 |
| `EDGE_TTS_URL` | 本地 `http://127.0.0.1:8001`；线上填独立 Python 服务的 HTTPS 地址 |
| `EDGE_TTS_SECRET` | Next 服务与 Python 服务使用同一安全值，线上必填 |

没有密钥仍可浏览产品、编辑剧本和运行自动化测试；点击真实语音功能会明确显示缺少配置，不伪造可用状态。开发环境未配置 Supabase 时保存在 `.data/`；线上强制使用 Supabase，防止误把 Vercel 临时文件当永久存储。请勿把 `.data/` 放到公开目录。

## 克隆声音的接入方式

你提供的是 **Cartesia voice ID**，不是一个可直接播放的音频 URL。无需再次克隆：把预写台词与 voice ID 一起发送给 TTS API 即可；能否使用取决于该 API key 所属账号的声音权限与额度。

- **HTTP Bytes `/tts/bytes`**：返回完整 MP3/WAV；首版采用此方式，便于保存、去重和重复播放。
- **SSE `/tts/sse`**：逐块返回音频，可降低首段播放等待时间，也可接收时间戳。
- **WebSocket**：适合连续、低延迟的实时语音流。对于当前的固定短句逐轮产品，不是首版必需项。

服务端请求内容如下（实际密钥来自环境变量）：

```json
{
  "model_id": "sonic-3.6",
  "transcript": "The authored line for the current turn.",
  "voice": { "id": "afb402ce-7a39-49cf-acb5-3ff42e4e224f" },
  "language": "en",
  "output_format": { "container": "mp3", "sample_rate": 44100, "bit_rate": 128000 }
}
```

仅在进入当前台词时调用。以文本、提供商、模型、声音、版本、格式的 SHA-256 作为缓存键。命中时直接复用；失败不记录成成功缓存；并发生成通过租约锁避免重复调用。原始台词与语音元数据一并保存在服务端。改声音/模型/文本后自动生成新的缓存键，旧素材保留。

英文推荐表达使用 [rany2/edge-tts](https://github.com/rany2/edge-tts)，固定 `en-US-AriaNeural`，不使用角色的克隆声音。Python 服务只响应显式的 `/speak`，启动与 `/health` 不合成音频。**当前没有调用真实语音服务作预生成。**

不需要 `OPENROUTER_API_KEY` 或 DeepSeek：根据最终确认，主流程没有 LLM 请求，也不做语音转文字。若将来需要内容分支，优先增加预写分支及选择条件，另行确认是否需要识别。

## Supabase

1. 创建项目，在 SQL Editor 执行 [supabase/schema.sql](supabase/schema.sql)。脚本可重复执行。
2. 配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。
3. 表 `between_records` 保存进度、会话、剧本文本和音频元信息；私有 bucket `between-audio` 保存素材和录音。`between_leases` 处理跨实例并发。
4. 浏览器不持有 Supabase 服务密钥；录音通过 Next API 按签名 Cookie 所属用户授权。其他用户的录音不能跨会话访问。

真实 Supabase 项目尚未提供，SQL 与 REST 集成需在你的项目上完成首次验证。浏览器偏好保存在 localStorage，实际积分与录音路径由服务端维护；本地浏览器不能直接提交积分。

## 可以部署到 Vercel 吗？

**可以。Next.js 页面与 API 放在 Vercel，持久化交给 Supabase。**

1. 将代码推送到你的仓库；在 Vercel 导入，Framework 为 Next.js。使用 Node 24，`npm ci`、`npm run build`，已附 `vercel.json`。
2. 设置上述服务端环境变量，部署前执行 Supabase SQL。应用本身没有登录或支付集成。
3. 单独部署 `services/` 的 Python 读音服务。已提供 [Render 一键部署配置](https://render.com/deploy?repo=https://github.com/JackZhong1998/personal-Agent)：平台自动生成 `EDGE_TTS_SECRET`，无需自己编造。操作和取值位置见 [读音服务部署说明](docs/DEPLOY_PRONUNCIATION.md)。也可在其他容器平台使用 `services/Dockerfile`，设置 `HOST=0.0.0.0`、`PORT` 和安全密钥，通过 HTTPS 提供地址。Next API 代理访问，前端不直接接触该服务凭证。
4. 配置 Vercel 的 `EDGE_TTS_URL` 和相同 `EDGE_TTS_SECRET`。**`127.0.0.1:8001` 仅用于本地，线上不能继续使用这个地址。**
5. 真实手机通过 HTTPS 测试麦克风、录音上传、播放和回忆恢复。Vercel 的 Serverless 请求不能依赖常驻 Python 子进程，因此首版将读音服务独立部署。

API 最长执行时间设置 120 秒，请确认所选 Vercel 计划与运行模式支持。每段录音限制 45 秒、3.5MB，低于常见的 4.5MB 函数请求限制。Chrome/Android 优先 WebM Opus，Safari 使用 MP4；自动播放失败时提供显式播放按钮。真实 iOS Safari 仍需设备验收。

需要网络访问 `api.cartesia.ai`、Supabase 项目域名、Python 服务域名；Python `edge-tts` 需访问 `speech.platform.bing.com`（HTTPS/WebSocket）。云环境的域名配置草稿与真实运行环境分开，保存草稿不表示运行网络限制已经改变。

## 验证

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
.venv/bin/pip check
.venv/bin/python -m unittest discover -s services -p 'test_*.py' -v
```

单元测试检查章节内容、奖励封顶与去重、时区、并发锁、持久化、同源限制、合成缓存与失败重试；浏览器测试在桌面和手机尺寸检查页面、锁定章节、首次流程、缺少配置和四轮录音。**自动化用模拟提供商与测试音频，不调用付费 TTS，不代表外部服务账号、声音权限或 Supabase 已验证。**

Playwright 默认使用本机 `/usr/bin/chromium`；其他机器可设置 `CHROMIUM_PATH` 为 Chrome/Chromium 路径。Linux CI 安装 Chromium 后运行，或修改 Playwright 配置使用下载的浏览器。

发布前需补齐：正式剧本、Cartesia/存储安全配置、真实服务连通性与手机音频验证。无登录的公开站点仍需按规模增加反滥用、防机器人、录音删除/保留政策；当前服务端每天限制每个匿名会话 120 次生成/上传操作，浏览器基本音量检测不能证明真人或语音正确性。
