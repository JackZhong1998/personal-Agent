# Between · Rosie，与你一起

以 Rosie 为中心的声音伙伴产品，当前只有两个页面：日常语音对话首页 `/`、美国旅行学习场景 `/travel`。非官方 AI 角色演绎，合成配音，与本人及所属团队无关联。

首页通过 OpenRouter 调用 DeepSeek；学习场景使用七天预写纽约旅程，含 140 个词与表达、旁白和角色台词、同稿听力与阅读、双语口语回应、每日打卡、钻石及成长反馈。产品结构与学习机制见 [docs/ROSIE_PRODUCT.md](docs/ROSIE_PRODUCT.md)。

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
| `OPENROUTER_API_KEY` | 首页日常对话，仅服务端；学习材料不需要此服务 |
| `OPENROUTER_MODEL` | 默认 `deepseek/deepseek-v4-flash`，需为账号实际可用的模型 ID |
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

首页需要 `OPENROUTER_API_KEY`，口语经浏览器 Speech Recognition 转成文本后交给 LLM，生成中英双语回应。学习场景不调用 LLM 或语音识别：材料和答案预写，录音保存后推进。只有用户实际点击或发送当前互动时才请求声音，不预生成整套素材。

## Supabase

1. 创建项目，在 SQL Editor 执行 [supabase/schema.sql](supabase/schema.sql)。脚本可重复执行。
2. 配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。
3. 表 `between_records` 保存进度、会话、剧本文本和音频元信息；私有 bucket `between-audio` 保存素材和录音。`between_leases` 处理跨实例并发。
4. 浏览器不持有 Supabase 服务密钥；录音通过 Next API 按签名 Cookie 所属用户授权。其他用户的录音不能跨会话访问。

继续使用已配置的 Supabase，无需为新学习场景新增 SQL。浏览器偏好保存在 localStorage，实际积分与录音路径由服务端维护；本地浏览器不能直接提交积分。

## 可以部署到 Vercel 吗？

**可以。Next.js 页面与 API 放在 Vercel，持久化交给 Supabase。**

1. 将代码推送到你的仓库；在 Vercel 导入，Framework 为 Next.js。使用 Node 24，`npm ci`、`npm run build`，已附 `vercel.json`。
2. 设置上述服务端环境变量，部署前执行 Supabase SQL。应用本身没有登录或支付集成。
3. 单独部署 `services/` 的 Python 读音服务。已提供 [Render 一键部署配置](https://render.com/deploy?repo=https://github.com/JackZhong1998/personal-Agent)：平台自动生成 `EDGE_TTS_SECRET`，无需自己编造。操作和取值位置见 [读音服务部署说明](docs/DEPLOY_PRONUNCIATION.md)。也可在其他容器平台使用 `services/Dockerfile`，设置 `HOST=0.0.0.0`、`PORT` 和安全密钥，通过 HTTPS 提供地址。Next API 代理访问，前端不直接接触该服务凭证。
4. 配置 Vercel 的 `EDGE_TTS_URL` 和相同 `EDGE_TTS_SECRET`。**`127.0.0.1:8001` 仅用于本地，线上不能继续使用这个地址。**
5. 真实手机通过 HTTPS 测试麦克风、录音上传、播放和回忆恢复。Vercel 的 Serverless 请求不能依赖常驻 Python 子进程，因此首版将读音服务独立部署。

API 最长执行时间设置 120 秒，请确认所选 Vercel 计划与运行模式支持。每段录音限制 45 秒、3.5MB，低于常见的 4.5MB 函数请求限制。Chrome/Android 优先 WebM Opus，Safari 使用 MP4；自动播放失败时提供显式播放按钮。真实 iOS Safari 仍需设备验收。

需要网络访问 `openrouter.ai`、`api.cartesia.ai`、Supabase 项目域名、Python 服务域名；浏览器照片需要 `commons.wikimedia.org`、`upload.wikimedia.org`；Python `edge-tts` 需访问 `speech.platform.bing.com`（HTTPS/WebSocket）。云环境的域名配置草稿与真实运行环境分开，保存草稿不表示运行网络限制已经改变。

## 验证

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
.venv/bin/pip check
.venv/bin/python -m unittest discover -s services -p 'test_*.py' -v
```

单元测试覆盖七天材料、四阶段顺序、答错与重复提交、钻石消耗、每日结算、LLM 双语输出合同、缓存和原有数据兼容。桌面与手机浏览器/API 测试完成整个 47 步章节、两次录音、同稿音频复用、首页语音对话请求、私有内容隔离与照片署名。**测试使用模拟 LLM、TTS 与照片，不调用付费服务，不代表外部提供商或照片上游连通性已验证。**

Playwright 默认使用本机 `/usr/bin/chromium`；其他机器可设置 `CHROMIUM_PATH` 为 Chrome/Chromium 路径。Linux CI 安装 Chromium 后运行，或修改 Playwright 配置使用下载的浏览器。

新课程在 `lib/learning/content.ts`，结算在 `lib/learning/progress.ts`。学习数据使用独立键空间 `us-with-rosie-v1`，旧版故事和音频保留。无登录记录依赖当前浏览器 Cookie，实际 iOS Safari 的语音识别、麦克风权限和音频播放仍需设备验证。
