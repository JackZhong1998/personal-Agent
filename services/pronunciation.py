"""On-demand pronunciation helper using rany2/edge-tts. Never synthesize at startup.

Local: .venv/bin/python services/pronunciation.py
Remote: HOST=0.0.0.0 PORT=8001 EDGE_TTS_SECRET=<secure setting> ...
The Next.js server proxies this service; do not expose it directly to browsers.
"""
import asyncio
import hmac
import os
import re

import edge_tts
from aiohttp import web

HOST = os.environ.get("HOST", "127.0.0.1")
SECRET = os.environ.get("EDGE_TTS_SECRET", "")
if HOST != "127.0.0.1" and not SECRET:
    raise RuntimeError("EDGE_TTS_SECRET is required when exposing the service")
slots = asyncio.Semaphore(4)


async def health(_: web.Request) -> web.Response:
    return web.json_response({"ok": True, "provider": "edge-tts", "generation": "on-demand"})


async def speak(request: web.Request) -> web.Response:
    if SECRET and not hmac.compare_digest(request.headers.get("Authorization", ""), "Bearer " + SECRET):
        return web.json_response({"error": "Unauthorized"}, status=401)
    try:
        payload = await request.json()
        text = payload.get("text") if isinstance(payload, dict) else None
        if not isinstance(text, str) or not 1 <= len(text) <= 500 or not re.search(r"[a-zA-Z]", text):
            return web.json_response({"error": "Expected an English phrase, at most 500 characters"}, status=400)
        async with slots:
            async with asyncio.timeout(25):
                audio = bytearray()
                async for chunk in edge_tts.Communicate(text, "en-US-AriaNeural").stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
        if len(audio) < 64:
            raise ValueError("No audio returned")
        return web.Response(body=bytes(audio), content_type="audio/mpeg")
    except (ValueError, TypeError):
        return web.json_response({"error": "Invalid payload or audio response"}, status=400)
    except Exception:
        # Never log request text, credentials, or provider response bodies.
        return web.json_response({"error": "Pronunciation provider is unavailable"}, status=502)


app = web.Application(client_max_size=8192)
app.router.add_get("/health", health)
app.router.add_post("/speak", speak)
if __name__ == "__main__":
    web.run_app(app, host=HOST, port=int(os.environ.get("PORT", "8001")), access_log=None)
