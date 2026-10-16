"""ไลบรารี Robot Framework: เปิด mock API + Vite dev server ให้ทดสอบ

- mock API  : http://127.0.0.1:8787/latest/USD  (อัตราล่าสุด)
              http://127.0.0.1:8787/v1/<start>..<end>?base=X&symbols=Y  (อัตราย้อนหลัง)
- แอป (Vite): http://127.0.0.1:5174 โดยตั้ง VITE_RATES_URL และ VITE_HISTORY_URL ชี้ไป mock API

อัตราย้อนหลังที่ mock สร้าง: วันที่ i จาก n วัน = p * (0.9 + 0.1 * i/(n-1)) เมื่อ p คืออัตราปัจจุบัน
(ต้นช่วง = 0.9p, ปลายช่วง = p) ทำให้ค่า ต่ำสุด/สูงสุด/% เปลี่ยนแปลง คำนวณล่วงหน้าได้
(ต้องตรงกับ historyBody ใน tests/playwright/helpers.ts)
"""
import atexit
import json
import os
import signal
import subprocess
import threading
import time
import urllib.request
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[3]
MOCK_PORT = 8787
APP_PORT = 5174
DEFAULT_RATES = {"USD": 1.0, "THB": 35.0, "JPY": 150.0, "EUR": 0.9, "GBP": 0.8}


class _Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-store")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def _history(self, state):
        url = urlparse(self.path)
        qs = parse_qs(url.query)
        base = qs.get("base", ["USD"])[0]
        sym = qs.get("symbols", [""])[0]
        start_s, end_s = url.path.rsplit("/", 1)[-1].split("..")
        rates = state["rates"]
        if base not in rates or sym not in rates:
            return self._json(404, {"message": "not found"})
        p = rates[sym] / rates[base]
        start, end = date.fromisoformat(start_s), date.fromisoformat(end_s)
        n = (end - start).days + 1
        series = {}
        for i in range(n):
            frac = i / (n - 1) if n > 1 else 1.0
            series[(start + timedelta(days=i)).isoformat()] = {sym: round(p * (0.9 + 0.1 * frac), 6)}
        self._json(200, {"amount": 1.0, "base": base, "start_date": start_s, "end_date": end_s, "rates": series})

    def do_GET(self):
        state = self.server.state  # type: ignore[attr-defined]
        if ".." in self.path:  # อัตราย้อนหลัง (ไม่นับใน hits ของอัตราล่าสุด)
            state["history_hits"] += 1
            if state["fail"]:
                return self._json(500, {"message": "error"})
            return self._history(state)
        state["hits"] += 1
        if state["fail"]:
            self.send_response(500)
            self._cors()
            self.end_headers()
            self.wfile.write(b"error")
            return
        body = json.dumps({"result": "success", "rates": state["rates"]}).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # เงียบ
        pass


class AppServers:
    ROBOT_LIBRARY_SCOPE = "GLOBAL"

    def __init__(self):
        self._mock = None
        self._app = None
        atexit.register(self.stop_servers)

    # ---------- เริ่ม/หยุดเซิร์ฟเวอร์ ----------
    def start_servers(self):
        """เริ่ม mock API และแอป (ทำซ้ำได้ ไม่เปิดซ้ำ) แล้วคืน URL ของแอป"""
        live_api = os.getenv("LIVE_API", "").lower() in ("1", "true", "yes")
        if self._mock is None and not live_api:
            self._mock = ThreadingHTTPServer(("127.0.0.1", MOCK_PORT), _Handler)
            self._mock.state = {"rates": dict(DEFAULT_RATES), "fail": False, "hits": 0, "history_hits": 0}  # type: ignore[attr-defined]
            threading.Thread(target=self._mock.serve_forever, daemon=True).start()
        if self._app is None:
            env = {**os.environ}
            if not live_api:
                env.update(
                    VITE_RATES_URL=f"http://127.0.0.1:{MOCK_PORT}/latest/USD",
                    VITE_HISTORY_URL=f"http://127.0.0.1:{MOCK_PORT}/v1",
                )
            windows = os.name == "nt"
            self._app = subprocess.Popen(
                ["npx", "vite", "--host", "127.0.0.1", "--port", str(APP_PORT), "--strictPort"],
                cwd=ROOT,
                env=env,
                shell=windows,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=not windows,
            )
            self._wait_for(f"http://127.0.0.1:{APP_PORT}/", 60)
        return f"http://127.0.0.1:{APP_PORT}/"

    def stop_servers(self):
        if self._app is not None:
            try:
                if os.name == "nt":
                    subprocess.run(["taskkill", "/T", "/F", "/PID", str(self._app.pid)], capture_output=True)
                else:
                    os.killpg(os.getpgid(self._app.pid), signal.SIGTERM)
            except Exception:
                pass
            self._app = None
        if self._mock is not None:
            self._mock.shutdown()
            self._mock = None

    @staticmethod
    def _wait_for(url, timeout):
        end = time.time() + timeout
        while time.time() < end:
            try:
                urllib.request.urlopen(url, timeout=2)
                return
            except Exception:
                time.sleep(0.5)
        raise RuntimeError(f"เซิร์ฟเวอร์ไม่พร้อมภายใน {timeout} วินาที: {url}")

    # ---------- ควบคุม mock ----------
    def reset_mock(self):
        """คืนค่าอัตราเริ่มต้น (THB=35, JPY=150, EUR=0.9, GBP=0.8) และปิดโหมด error"""
        if self._mock is None:
            return
        s = self._mock.state  # type: ignore[union-attr]
        s["rates"] = dict(DEFAULT_RATES)
        s["fail"] = False
        s["hits"] = 0
        s["history_hits"] = 0

    def set_mock_rates(self, **rates):
        """ตั้งอัตราใหม่ เช่น: Set Mock Rates    JPY=140    THB=36"""
        for code, value in rates.items():
            self._mock.state["rates"][code] = float(value)  # type: ignore[union-attr]

    def set_mock_failure(self, enabled=True):
        """ให้ mock API (ทั้งอัตราล่าสุดและย้อนหลัง) ตอบ HTTP 500 (True) หรือกลับมาปกติ (False)"""
        self._mock.state["fail"] = str(enabled).lower() in ("true", "1", "yes")  # type: ignore[union-attr]

    def get_mock_hits(self):
        """จำนวนครั้งที่แอปเรียก mock API"""
        return self._mock.state["hits"]  # type: ignore[union-attr]
