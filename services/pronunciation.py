"""On-demand pronunciation helper using rany2/edge-tts. Never synthesize at startup.

Local: .venv/bin/python services/pronunciation.py
Remote: HOST=0.0.0.0 PORT=8001 EDGE_TTS_SECRET=<secure setting> ...
The Next.js server proxies this service; do not expose it directly to browsers.
"""
import asyncio
import hmac
import logging
import os
import re
from importlib.metadata import version

import edge_tts
from aiohttp import ClientResponseError, web

HOST = os.environ.get("HOST", "127.0.0.1")
SECRET = os.environ.get("EDGE_TTS_SECRET", "")
if HOST != "127.0.0.1" and not SECRET:
    raise RuntimeError("EDGE_TTS_SECRET is required when exposing the service")
slots = asyncio.Semaphore(4)
logger = logging.getLogger("pronunciation")


def provider_failure(code: str, exc: Exception | None = None, status: int = 502) -> web.Response:
    # Exception messages/tracebacks can contain signed URLs, text, or tokens.
    logger.warning("pronunciation_failed code=%s exception=%s upstream_status=%s",
                   code, type(exc).__name__ if exc else "None",
                   exc.status if isinstance(exc, ClientResponseError) else "none")
    return web.json_response({"error": "Pronunciation provider is unavailable", "code": code}, status=status)


async def health(_: web.Request) -> web.Response:
    return web.json_response({"ok": True, "provider": "edge-tts", "version": version("edge-tts"), "generation": "on-demand"})


async def speak(request: web.Request) -> web.Response:
    if SECRET and not hmac.compare_digest(request.headers.get("Authorization", ""), "Bearer " + SECRET):
        return web.json_response({"error": "Unauthorized"}, status=401)
    try:
        payload = await request.json()
        text = payload.get("text") if isinstance(payload, dict) else None
        if not isinstance(text, str) or not 1 <= len(text) <= 500 or not re.search(r"[a-zA-Z]", text):
            return web.json_response({"error": "Expected an English phrase, at most 500 characters"}, status=400)
    except (ValueError, TypeError):
        return web.json_response({"error": "Invalid payload"}, status=400)
    try:
        # Include queue time in the deadline so requests cannot wait indefinitely.
        async with asyncio.timeout(25):
            async with slots:
                audio = bytearray()
                async for chunk in edge_tts.Communicate(text, "en-US-AriaNeural").stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
        if len(audio) < 64:
            return provider_failure("empty_audio")
        return web.Response(body=bytes(audio), content_type="audio/mpeg")
    except TimeoutError as exc:
        return provider_failure("upstream_timeout", exc, status=504)
    except ClientResponseError as exc:
        return provider_failure("upstream_rejected" if exc.status in (401, 403) else "upstream_http_error", exc)
    except Exception as exc:
        return provider_failure("upstream_unavailable", exc)


app = web.Application(client_max_size=8192)
app.router.add_get("/health", health)
app.router.add_post("/speak", speak)
if __name__ == "__main__":
    web.run_app(app, host=HOST, port=int(os.environ.get("PORT", "8001")), access_log=None)
