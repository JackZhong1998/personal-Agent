"""Local service contract tests. All upstream speech generation is mocked."""
import asyncio
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

from aiohttp.test_utils import TestClient, TestServer
from aiohttp import ClientResponseError


class PronunciationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        spec = importlib.util.spec_from_file_location(
            "pronunciation_under_test", Path(__file__).with_name("pronunciation.py")
        )
        self.service = importlib.util.module_from_spec(spec)
        with patch.dict(os.environ, {"HOST": "127.0.0.1", "EDGE_TTS_SECRET": "local-test-only"}):
            spec.loader.exec_module(self.service)
        self.client = TestClient(TestServer(self.service.app))
        await self.client.start_server()
        self.headers = {"Authorization": "Bearer local-test-only"}

    async def asyncTearDown(self):
        await self.client.close()

    async def test_health_does_not_generate_speech(self):
        with patch.object(self.service.edge_tts, "Communicate") as provider:
            response = await self.client.get("/health")
            self.assertEqual(response.status, 200)
            self.assertEqual((await response.json())["generation"], "on-demand")
            self.assertEqual((await response.json())["version"], "7.3.1")
            provider.assert_not_called()

    async def test_missing_or_wrong_secret_cannot_generate(self):
        with patch.object(self.service.edge_tts, "Communicate") as provider:
            for headers in [{}, {"Authorization": "Bearer wrong"}]:
                response = await self.client.post("/speak", json={"text": "Hello."}, headers=headers)
                self.assertEqual(response.status, 401)
            provider.assert_not_called()

    async def test_invalid_payloads_do_not_generate(self):
        with patch.object(self.service.edge_tts, "Communicate") as provider:
            for payload in [{}, {"text": ""}, {"text": "a" * 501}, {"text": 12}, []]:
                response = await self.client.post("/speak", json=payload, headers=self.headers)
                self.assertEqual(response.status, 400)
            provider.assert_not_called()

    async def test_success_returns_audio_only_after_explicit_request(self):
        class FakeVoice:
            async def stream(self):
                yield {"type": "WordBoundary", "text": "ignored"}
                yield {"type": "audio", "data": b"test-audio" * 20}

        with patch.object(self.service.edge_tts, "Communicate", return_value=FakeVoice()) as provider:
            response = await self.client.post("/speak", json={"text": "Hello."}, headers=self.headers)
            self.assertEqual(response.status, 200)
            self.assertEqual(response.content_type, "audio/mpeg")
            self.assertEqual(await response.read(), b"test-audio" * 20)
            provider.assert_called_once_with("Hello.", "en-US-AriaNeural")

    async def test_upstream_failure_does_not_expose_provider_details(self):
        with patch.object(self.service.edge_tts, "Communicate", side_effect=RuntimeError("private-details")), self.assertLogs("pronunciation", level="WARNING") as logs:
            response = await self.client.post("/speak", json={"text": "Hello."}, headers=self.headers)
            self.assertEqual(response.status, 502)
            self.assertNotIn("private-details", await response.text())
        self.assertNotIn("private-details", " ".join(logs.output))
        self.assertIn("upstream_unavailable", " ".join(logs.output))

    async def test_upstream_rejection_logs_status_without_signed_url(self):
        error = ClientResponseError(None, (), status=403, message="private-token")
        with patch.object(self.service.edge_tts, "Communicate", side_effect=error), self.assertLogs("pronunciation", level="WARNING") as logs:
            response = await self.client.post("/speak", json={"text": "Hello."}, headers=self.headers)
            self.assertEqual(response.status, 502)
            self.assertEqual((await response.json())["code"], "upstream_rejected")
        self.assertIn("upstream_status=403", " ".join(logs.output))
        self.assertNotIn("private-token", " ".join(logs.output))

    async def test_timeout_is_identified(self):
        with patch.object(self.service.edge_tts, "Communicate", side_effect=TimeoutError()), self.assertLogs("pronunciation", level="WARNING"):
            response = await self.client.post("/speak", json={"text": "Hello."}, headers=self.headers)
            self.assertEqual(response.status, 504)
            self.assertEqual((await response.json())["code"], "upstream_timeout")

    async def test_empty_provider_audio_is_a_service_error(self):
        class EmptyVoice:
            async def stream(self):
                yield {"type": "audio", "data": b""}

        with patch.object(self.service.edge_tts, "Communicate", return_value=EmptyVoice()), self.assertLogs("pronunciation", level="WARNING"):
            response = await self.client.post("/speak", json={"text": "Hello."}, headers=self.headers)
            self.assertEqual(response.status, 502)
            self.assertEqual((await response.json())["code"], "empty_audio")

    async def test_public_bind_requires_a_secret(self):
        spec = importlib.util.spec_from_file_location(
            "pronunciation_public_test", Path(__file__).with_name("pronunciation.py")
        )
        module = importlib.util.module_from_spec(spec)
        with patch.dict(os.environ, {"HOST": "0.0.0.0", "EDGE_TTS_SECRET": ""}):
            with self.assertRaisesRegex(RuntimeError, "EDGE_TTS_SECRET"):
                spec.loader.exec_module(module)


if __name__ == "__main__":
    unittest.main()
