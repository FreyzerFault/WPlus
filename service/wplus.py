#!/usr/bin/env python3
"""
WPlus v2.0 — Self-contained WhatsApp Desktop Plugin
by KuchiSofts — github.com/KuchiSofts
"""

import http.client
import json
import os
import ssl
import subprocess
import sys
import threading
import time
from itertools import count
from typing import Any, TypedDict

from PIL import Image, ImageDraw
import pystray


class ServiceState(TypedDict):
    status: str
    injected: bool
    syncs: int
    running: bool
    ws_url: str | None


class CDPTarget(TypedDict):
    url: str
    type: str
    webSocketDebuggerUrl: str


CURRENT_VERSION = "2.0.0"
GITHUB_REPO = "KuchiSofts/WPlus"
CDP_PORT = 9223
CDP_ARGUMENTS = (
    f"--remote-debugging-port={CDP_PORT} --remote-allow-origins=*"
)

if getattr(sys, "frozen", False):
    EXE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, "_MEIPASS", EXE_DIR)
else:
    EXE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BUNDLE_DIR = EXE_DIR

DATA_DIR = os.path.join(EXE_DIR, "data")
ASSETS_DIR = os.path.join(EXE_DIR, "assets")


def ensure_debug_port() -> bool:
    import winreg

    key_path = (
        r"Software\Policies\Microsoft\Edge\WebView2\AdditionalBrowserArguments"
    )
    configured = False
    try:
        key = winreg.CreateKeyEx(
            winreg.HKEY_CURRENT_USER,
            key_path,
            0,
            winreg.KEY_READ | winreg.KEY_WRITE,
        )
        try:
            existing = winreg.QueryValueEx(key, "*")[0]
        except FileNotFoundError:
            existing = None
        if existing != CDP_ARGUMENTS:
            winreg.SetValueEx(key, "*", 0, winreg.REG_SZ, CDP_ARGUMENTS)
            configured = True
        winreg.CloseKey(key)
    except PermissionError:
        # WebView2 also supports the per-user environment variable below.
        pass
    except OSError as error:
        print(
            f"Could not set WebView2 registry policy: {error}",
            file=sys.stderr,
        )

    try:
        key = winreg.CreateKeyEx(
            winreg.HKEY_CURRENT_USER,
            "Environment",
            0,
            winreg.KEY_READ | winreg.KEY_WRITE,
        )
        try:
            existing = winreg.QueryValueEx(
                key, "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"
            )[0]
        except FileNotFoundError:
            existing = None
        if existing != CDP_ARGUMENTS:
            winreg.SetValueEx(
                key,
                "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                0,
                winreg.REG_SZ,
                CDP_ARGUMENTS,
            )
            configured = True
        winreg.CloseKey(key)
    except PermissionError as error:
        print(
            f"Could not set WebView2 environment: {error}",
            file=sys.stderr,
        )
    except OSError as error:
        print(
            f"Could not set WebView2 environment: {error}",
            file=sys.stderr,
        )

    os.environ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = CDP_ARGUMENTS
    if configured:
        try:
            import ctypes

            send_message_timeout = (
                ctypes.windll.user32.SendMessageTimeoutW
            )
            send_message_timeout.argtypes = (
                ctypes.c_void_p,
                ctypes.c_uint,
                ctypes.c_size_t,
                ctypes.c_void_p,
                ctypes.c_uint,
                ctypes.c_uint,
                ctypes.POINTER(ctypes.c_size_t),
            )
            send_message_timeout.restype = ctypes.c_ssize_t
            result = ctypes.c_size_t()
            sent = send_message_timeout(
                ctypes.c_void_p(0xFFFF),
                0x001A,
                0,
                ctypes.cast(
                    ctypes.c_wchar_p("Environment"), ctypes.c_void_p
                ),
                0x0002,
                5000,
                ctypes.byref(result),
            )
            if not sent:
                print(
                    "Windows did not acknowledge the WebView2 setting change.",
                    file=sys.stderr,
                )
        except (AttributeError, OSError) as error:
            print(
                f"Could not notify Windows about the WebView2 setting: {error}",
                file=sys.stderr,
            )
    return configured


def setup() -> None:
    for d in [
        "data",
        "data/Images",
        "data/Videos",
        "data/Sounds",
        "data/Docs",
    ]:
        os.makedirs(os.path.join(EXE_DIR, d), exist_ok=True)

    first_run = ensure_debug_port()
    if first_run:
        try:
            import ctypes

            ctypes.windll.user32.MessageBoxW(
                0,
                "WPlus has been configured!\n\n"
                "Please restart WhatsApp Desktop for changes to take effect.\n"
                "(Close WhatsApp from the system tray, then reopen it)\n\n"
                "WPlus will wait and connect automatically.",
                "WPlus — First Time Setup",
                0x40,
            )
        except (AttributeError, OSError) as error:
            print(f"Could not show setup notice: {error}", file=sys.stderr)

    # FIX: never overwrite an existing local engine.js/ui.js.
    # The bundled copies are used only on first run when the files
    # do not exist beside WPlus.exe.
    for filename in ["engine.js", "ui.js"]:
        dst = os.path.join(EXE_DIR, filename)

        if os.path.exists(dst):
            continue

        src = os.path.join(BUNDLE_DIR, filename)
        if os.path.exists(src):
            try:
                with open(src, "r", encoding="utf-8") as f:
                    content = f.read()
                with open(dst, "w", encoding="utf-8") as f:
                    f.write(content)
            except OSError as error:
                print(f"Could not copy {filename}: {error}", file=sys.stderr)

    src_fs = os.path.join(BUNDLE_DIR, "fileserver.py")
    if not os.path.exists(src_fs):
        src_fs = os.path.join(EXE_DIR, "service", "fileserver.py")
    if os.path.exists(src_fs):
        try:
            with open(src_fs, "r", encoding="utf-8") as f:
                content = f.read()
            content = content.replace(
                "os.path.dirname(os.path.dirname(os.path.abspath(__file__)))",
                f'r"{EXE_DIR}"',
            ).replace(
                "os.path.dirname(os.path.abspath(__file__))",
                f'r"{EXE_DIR}"',
            )
            with open(
                os.path.join(EXE_DIR, "_fileserver.py"), "w", encoding="utf-8"
            ) as f:
                f.write(content)
        except OSError as error:
            print(f"Could not prepare file server: {error}", file=sys.stderr)


setup()

sys.path.insert(0, EXE_DIR)

try:
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "fileserver",
        os.path.join(EXE_DIR, "_fileserver.py"),
    )
    if spec and spec.loader:
        fileserver = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(fileserver)
        start_file_server = fileserver.start_server
    else:
        raise ImportError("No fileserver")
except (ImportError, OSError, AttributeError) as error:
    print(
        f"Could not load the full WPlus file server: {error}",
        file=sys.stderr,
    )

    from http.server import HTTPServer, BaseHTTPRequestHandler

    class MinHandler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: object) -> None:
            pass

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header(
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS"
            )
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header(
                "Access-Control-Allow-Private-Network", "true"
            )
            self.end_headers()

        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header(
                "Access-Control-Allow-Private-Network", "true"
            )
            self.end_headers()
            self.wfile.write(b"[]")

        def do_POST(self):
            if self.path.split("?", 1)[0] == "/sticker/convert":
                self.send_response(503)
                response = json.dumps({
                    "error": (
                        "El conversor de stickers no está disponible. "
                        "Reinicia WPlus para cargar su servidor local."
                    )
                }).encode("utf-8")
            else:
                self.send_response(200)
                response = b'{"ok":true}'
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header(
                "Access-Control-Allow-Private-Network", "true"
            )
            self.end_headers()
            self.wfile.write(response)

    def start_file_server(port):
        s = HTTPServer(("127.0.0.1", port), MinHandler)
        threading.Thread(target=s.serve_forever, daemon=True).start()


FILES = {
    "wplus_del": os.path.join(DATA_DIR, "deleted_messages.json"),
    "wplus_cfg": os.path.join(DATA_DIR, "settings.json"),
}
LOG_FILE = os.path.join(DATA_DIR, "debug.log")
STATUS_FILE = os.path.join(DATA_DIR, "status.txt")
_sync_call_count = count()

state: ServiceState = {
    "status": "Starting...",
    "injected": False,
    "syncs": 0,
    "running": True,
    "ws_url": None,
}


def log(msg: str) -> None:
    msg = msg.replace("\r", " ").replace("\n", " | ")
    state["status"] = msg
    try:
        with open(STATUS_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] {msg}\n")
    except OSError as error:
        print(f"Could not write status log: {error}", file=sys.stderr)


def load_file(path: str, default: str = "[]") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return default


def save_file(path: str, data: str) -> bool:
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(data)
        return True
    except OSError as error:
        log(f"Could not save {path}: {error}")
        return False


def get_wa_target() -> CDPTarget | None:
    connection = http.client.HTTPConnection(
        "127.0.0.1", CDP_PORT, timeout=3
    )
    try:
        connection.request("GET", "/json")
        targets = json.loads(connection.getresponse().read())
    except (OSError, ValueError, TypeError, AttributeError):
        return None
    finally:
        connection.close()

    if not isinstance(targets, list):
        return None
    for target in targets:
        if not isinstance(target, dict):
            continue
        url = target.get("url")
        websocket_url = target.get("webSocketDebuggerUrl")
        if (
            target.get("type") == "page"
            and isinstance(url, str)
            and "whatsapp" in url
            and isinstance(websocket_url, str)
        ):
            return {
                "url": url,
                "type": "page",
                "webSocketDebuggerUrl": websocket_url,
            }
    return None


def cdp_eval(
    ws_url: str, code: str, label: str = "JavaScript"
) -> dict[str, Any] | None:
    cdp = json.dumps(
        {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {
                "expression": code,
                "returnByValue": True,
            },
        }
    )

    p = os.path.join(DATA_DIR, "_cdp.json")
    with open(p, "w", encoding="utf-8") as f:
        f.write(cdp)

    log(f"CDP: {label} — sending request")

    try:
        r = subprocess.run(
            [
                "powershell",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                f"$ws=New-Object System.Net.WebSockets.ClientWebSocket;"
                f"$ct=[System.Threading.CancellationToken]::None;"
                f'$ws.ConnectAsync([System.Uri]::new("{ws_url}"),$ct).Wait();'
                f'$msg=[System.IO.File]::ReadAllText("{p}");'
                f"$b=[System.Text.Encoding]::UTF8.GetBytes($msg);"
                f"$ws.SendAsync([System.ArraySegment[byte]]::new($b),"
                "[System.Net.WebSockets.WebSocketMessageType]::Text,"
                "$true,$ct).Wait();"
                f"$buf=New-Object byte[] 262144;"
                "$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf),"
                "$ct).Wait()|Out-Null;"
                f"[System.Text.Encoding]::UTF8.GetString($buf).Trim([char]0);"
                f"$ws.Dispose()",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        if r.returncode != 0:
            stderr = r.stderr.strip()[:500] or "no PowerShell error details"
            log(
                f"CDP: {label} — PowerShell exited with code "
                f"{r.returncode}: {stderr}"
            )
            return None

        response = json.loads(r.stdout.strip())
        os.remove(p)
        if "error" in response:
            log(f"CDP: {label} — protocol error: {response['error']}")
            return None

        exception_details = response.get("exceptionDetails")
        if exception_details:
            exception = exception_details.get("exception", {})
            description = exception.get("description")
            if not description:
                description = exception_details.get(
                    "text", "Unknown JavaScript exception"
                )
            log(f"CDP: {label} — JavaScript exception: {description}")
            return None

        result = response.get("result", {}).get("result")
        if not isinstance(result, dict):
            log(f"CDP: {label} — unexpected response shape")
            return None

        result_type = result.get("type", "unknown")
        subtype = result.get("subtype")
        result_summary = f"type={result_type}"
        if subtype:
            result_summary += f", subtype={subtype}"
        if label == "injection bundle" and "value" in result:
            result_summary += f", value={result['value']!r}"
        log(f"CDP: {label} — completed ({result_summary})")
        return result
    except (
        OSError,
        subprocess.SubprocessError,
        ValueError,
        AttributeError,
        TypeError,
    ) as error:
        try:
            log(f"CDP: {label} — request failed: {error}")
            os.remove(p)
        except OSError as error:
            log(f"CDP: could not remove request file {p}: {error}")
        return None


def cdp_eval_value(
    ws_url: str, code: str, label: str = "JavaScript"
) -> Any | None:
    result = cdp_eval(ws_url, code, label)
    return result.get("value") if result is not None else None


def get_plugin_status(ws_url: str) -> dict[str, Any] | None:
    snapshot = cdp_eval_value(
        ws_url,
        'JSON.stringify({engineLoaded:!!window.__wplus,'
        'engineReady:!!window.__wplus?.ready,'
        'uiButton:!!document.querySelector("#wplus-btn"),'
        'uiPanel:!!document.querySelector("#wplus-panel")})',
        "check engine and UI state",
    )
    if not isinstance(snapshot, str):
        return None
    try:
        status = json.loads(snapshot)
    except json.JSONDecodeError as error:
        log(f"Plugin status check returned invalid JSON: {error}")
        return None
    return status if isinstance(status, dict) else None


_last_wa_pid: int | None = None


def _find_wa_process() -> int:
    try:
        r = subprocess.run(
            [
                "tasklist",
                "/FI",
                "IMAGENAME eq WhatsApp.Root.exe",
                "/FO",
                "CSV",
                "/NH",
            ],
            capture_output=True,
            text=True,
            timeout=5,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        for line in r.stdout.strip().split("\n"):
            if "WhatsApp" in line:
                parts = line.strip('"').split('","')
                if len(parts) >= 2:
                    try:
                        return int(parts[1].strip('"'))
                    except (TypeError, ValueError):
                        return -1
        return 0
    except (OSError, subprocess.SubprocessError, ValueError):
        return 0


def is_wa_running() -> bool:
    return _find_wa_process() > 0


def detect_wa_change() -> str:
    global _last_wa_pid
    pid = _find_wa_process()

    if pid > 0 and _last_wa_pid is None:
        _last_wa_pid = pid
        return "started"
    elif pid > 0 and _last_wa_pid and pid != _last_wa_pid:
        _last_wa_pid = pid
        return "restarted"
    elif pid == 0 and _last_wa_pid:
        _last_wa_pid = None
        return "stopped"
    elif pid > 0:
        return "same"
    else:
        return "stopped"


def inject(ws_url: str) -> tuple[bool, int]:
    code = "if(window.__wplus&&window.__wplus.cleanup)window.__wplus.cleanup()"
    cdp_eval_value(
        ws_url,
        code,
        "remove previous injection",
    )

    restored = 0
    for key, path in FILES.items():
        data = load_file(path, "null")
        if data and data != "null":
            cdp_eval(
                ws_url,
                f'localStorage.setItem("{key}",{json.dumps(data)})',
                f"restore localStorage key {key}",
            )
            restored += 1

    with open(os.path.join(EXE_DIR, "engine.js"), "r", encoding="utf-8") as f:
        engine = f.read()

    with open(os.path.join(EXE_DIR, "ui.js"), "r", encoding="utf-8") as f:
        ui = f.read()

    # esbuild wraps each entry point in a module IIFE, so ui.ts's internal
    # `return 'ok'` is not the result of the whole evaluated expression.
    log(
        "Injection: evaluating engine.js "
        f"({len(engine):,} chars) + ui.js ({len(ui):,} chars)"
    )
    code = engine + ";\n" + ui + '\n;"ok";'
    result = cdp_eval(ws_url, code, "injection bundle")

    if result is None:
        log(
            "Injection failed: CDP returned no result; "
            "see preceding CDP error."
        )
        return False, restored

    value = result.get("value")

    if result.get("type") != "string" or value != "ok":
        log(
            "Injection failed: completion marker mismatch "
            f"(type={result.get('type')}, value={value!r})"
        )
        return False, restored

    log(
        "Injection script completed successfully; checking asynchronous "
        "engine startup and UI mount."
    )
    return True, restored


def uninject(ws_url: str) -> None:
    try:
        cdp_eval(
            ws_url,
            """(function(){
            if(window.__wplus&&window.__wplus.cleanup)window.__wplus.cleanup();
            document.querySelectorAll("[id*=wplus],.wplus-restore-btn,.wplus-b,.wpp").forEach(function(e){e.remove();});
            document.querySelectorAll(".wplus-blur-t,.wplus-blur-p").forEach(function(e){e.classList.remove("wplus-blur-t","wplus-blur-p");});
            window.__wplus=undefined;
        })()""",
            "remove WPlus from page",
        )
    except (OSError, subprocess.SubprocessError) as error:
        log(f"Could not uninject plugin: {error}")


def sync(ws_url: str) -> int:
    changes = 0

    cdp_eval(
        ws_url,
        '(function(){var f=localStorage.getItem("wplus_sync_now");'
        'if(f)localStorage.removeItem("wplus_sync_now");})()',
        "clear immediate-sync flag",
    )

    for key, path in FILES.items():
        val = cdp_eval_value(
            ws_url,
            f'localStorage.getItem("{key}")',
            f"read localStorage key {key}",
        )
        if isinstance(val, str) and val != "null":
            current = load_file(path, "")
            if val != current:
                if save_file(path, val):
                    changes += 1

    if next(_sync_call_count) % 5 == 4:
        try:
            log_val = cdp_eval_value(
                ws_url,
                'localStorage.getItem("wplus_log")',
                "read WPlus debug log",
            )
            if isinstance(log_val, str) and log_val != "null":
                entries = json.loads(log_val)
                if isinstance(entries, list) and entries:
                    lines = [
                        "WPlus Debug Log — "
                        + time.strftime("%Y-%m-%d %H:%M:%S"),
                        "=" * 50,
                        "",
                    ]
                    for e in entries:
                        lines.append(
                            f"[{e.get('ts', '?')}] [{e.get('cat', '?')}] "
                            f"{e.get('msg', '')}"
                            + (
                                f" | {e.get('data', '')}"
                                if e.get("data")
                                else ""
                            )
                        )
                    with open(LOG_FILE, "w", encoding="utf-8") as f:
                        f.write("\n".join(lines) + "\n")
        except (OSError, ValueError, TypeError, AttributeError) as error:
            log(f"Could not sync debug log: {error}")

    return changes


def check_for_update() -> tuple[bool, str | None, str | None]:
    try:
        ctx = ssl.create_default_context()
        conn = http.client.HTTPSConnection(
            "api.github.com", timeout=10, context=ctx
        )
        try:
            conn.request(
                "GET",
                f"/repos/{GITHUB_REPO}/releases/latest",
                headers={"User-Agent": f"WPlus/{CURRENT_VERSION}"},
            )
            resp = conn.getresponse()
            if resp.status != 200:
                return False, None, None
            data = json.loads(resp.read())
        finally:
            conn.close()

        latest_tag = data.get("tag_name", "").lstrip("v")
        if not latest_tag:
            return False, None, None

        def ver_tuple(v):
            return tuple(int(x) for x in v.split(".") if x.isdigit())

        if ver_tuple(latest_tag) > ver_tuple(CURRENT_VERSION):
            dl_url = data.get(
                "html_url",
                f"https://github.com/{GITHUB_REPO}/releases/latest",
            )
            for asset in data.get("assets", []):
                if asset.get("name", "").endswith((".exe", ".zip")):
                    dl_url = asset.get("browser_download_url", dl_url)
                    break
            return True, latest_tag, dl_url

        return False, latest_tag, None
    except (
        OSError,
        http.client.HTTPException,
        ValueError,
        TypeError,
        KeyError,
        AttributeError,
    ) as error:
        log(f"Update check failed: {error}")
        return False, None, None


def notify_update(latest: str | None, url: str | None) -> None:
    try:
        import ctypes

        result = ctypes.windll.user32.MessageBoxW(
            0,
            f"WPlus v{latest} is available!\n\n"
            f"You are running v{CURRENT_VERSION}.\n\n"
            f"Would you like to download the update?",
            "WPlus — Update Available",
            0x44,
        )
        if result == 6 and url:
            os.startfile(url)
    except (AttributeError, OSError) as error:
        log(f"Could not show update notification: {error}")


def create_icon() -> Image.Image:
    ico_path = os.path.join(ASSETS_DIR, "icon-64.png")
    if os.path.exists(ico_path):
        try:
            return Image.open(ico_path)
        except OSError as error:
            log(f"Could not load tray icon: {error}")

    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pts = [(12, 12), (32, 6), (52, 12), (52, 38), (32, 58), (12, 38)]
    draw.polygon(pts, fill="#25D366")
    draw.rounded_rectangle([20, 28, 44, 36], radius=2, fill="white")
    draw.rounded_rectangle([28, 20, 36, 44], radius=2, fill="white")
    return img


def on_quit(icon: Any, item: Any) -> None:
    log("Shutting down...")
    if state["ws_url"]:
        try:
            sync(state["ws_url"])
        except (
            OSError,
            ValueError,
            subprocess.SubprocessError,
        ) as error:
            log(f"Final sync failed: {error}")
        uninject(state["ws_url"])
    state["running"] = False
    icon.stop()


def on_reinject(icon: Any, item: Any) -> None:
    if state["ws_url"]:
        uninject(state["ws_url"])
    state["injected"] = False
    log("Re-injecting...")


def on_open_data(icon: Any, item: Any) -> None:
    os.startfile(DATA_DIR)


def on_open_folder(icon: Any, item: Any) -> None:
    os.startfile(EXE_DIR)


def on_check_update(icon: Any, item: Any) -> None:
    has_update, latest, url = check_for_update()
    if has_update:
        notify_update(latest, url)
    else:
        try:
            import ctypes

            ctypes.windll.user32.MessageBoxW(
                0,
                f"You're up to date!\n\nRunning WPlus v{CURRENT_VERSION}",
                "WPlus — No Updates",
                0x40,
            )
        except (AttributeError, OSError) as error:
            log(f"Could not show update status: {error}")


def on_github(icon: Any, item: Any) -> None:
    os.startfile(f"https://github.com/{GITHUB_REPO}")


def on_toggle_startup(icon: Any, item: Any) -> None:
    enabled = is_startup_enabled()
    if set_startup(not enabled):
        log(f"Startup {'disabled' if enabled else 'enabled'}")


def startup_checked(item: Any) -> bool:
    return is_startup_enabled()


def create_tray() -> Any:
    return pystray.Icon(
        "WPlus",
        create_icon(),
        f"WPlus v{CURRENT_VERSION} — by KuchiSofts",
        menu=pystray.Menu(
            pystray.MenuItem(
                lambda text: f"Status: {state['status']}",
                None,
                enabled=False,
            ),
            pystray.MenuItem(
                lambda text: f"v{CURRENT_VERSION}",
                None,
                enabled=False,
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Re-inject Plugin", on_reinject),
            pystray.MenuItem("Check for Updates", on_check_update),
            pystray.MenuItem(
                "Run at Startup",
                on_toggle_startup,
                checked=startup_checked,
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Data Folder", on_open_data),
            pystray.MenuItem("Open WPlus Folder", on_open_folder),
            pystray.MenuItem("GitHub", on_github),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit WPlus", on_quit),
        ),
    )


def service_loop() -> None:
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        f.write(
            f"WPlus Service started {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            "Status guide: CDP type=undefined is normal for commands with no "
            "return value. Injection requires marker=ok; startup verification "
            "checks engine readiness and UI mount.\n\n"
        )

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(
            f"[WPlus] Session started {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        )

    try:
        start_file_server(18733)
        log("File server on port 18733")
    except (OSError, RuntimeError) as error:
        log(f"File server: {error}")

    def bg_update_check():
        time.sleep(10)
        has_update, latest, url = check_for_update()
        if has_update:
            log(f"Update available: v{latest}")
            notify_update(latest, url)
        else:
            log(f"Up to date (v{CURRENT_VERSION})")

    threading.Thread(target=bg_update_check, daemon=True).start()

    if is_wa_running():
        log("WhatsApp already running")
        _find_wa_process()
        detect_wa_change()
    else:
        log("Waiting for WhatsApp...")

    sync_tick = 0

    def do_inject():
        log("Connecting...")
        wa = None

        for _ in range(20):
            if not state["running"]:
                return False
            wa = get_wa_target()
            if wa:
                break
            time.sleep(2)

        if not wa:
            log(
                f"Connection failed: no WhatsApp page found on CDP port "
                f"{CDP_PORT} "
                "after 40 seconds."
            )
            return False

        ws_url = wa["webSocketDebuggerUrl"]
        state["ws_url"] = ws_url
        log(f"WhatsApp page found ({wa['url']}). Starting injection.")
        ok, restored = inject(ws_url)

        if ok:
            state["injected"] = True
            log(
                f"Injection script completed (marker=ok; "
                f"{restored} local file(s) restored). Waiting for engine "
                "startup and UI mount."
            )
            for attempt in range(8):
                time.sleep(1)
                plugin_status = get_plugin_status(ws_url)
                if plugin_status is None:
                    continue
                engine_ready = plugin_status.get("engineReady") is True
                ui_mounted = (
                    plugin_status.get("uiButton") is True
                    and plugin_status.get("uiPanel") is True
                )
                if engine_ready and ui_mounted:
                    log(
                        "Injection verified: engine ready and UI mounted "
                        f"(check {attempt + 1}/8)."
                    )
                    return True

            if plugin_status is None:
                log(
                    "Injection script completed, but engine/UI status "
                    "could not be read from WhatsApp."
                )
            else:
                log(
                    "Injection script completed, but startup is incomplete "
                    f"after 8 seconds: {plugin_status!r}"
                )
            return True

        log("Injection failed; see the preceding CDP or marker diagnostic.")
        return False

    while state["running"]:
        try:
            time.sleep(3)
            sync_tick += 1
            change = detect_wa_change()

            if change == "stopped":
                if state["injected"]:
                    log("WhatsApp closed — saving data")
                    ws_url = state["ws_url"]
                    if ws_url is not None:
                        try:
                            sync(ws_url)
                        except (
                            OSError,
                            ValueError,
                            subprocess.SubprocessError,
                        ) as error:
                            log(f"Final sync failed: {error}")
                    state["injected"] = False
                    state["ws_url"] = None
                continue

            if change == "started":
                log("WhatsApp started — waiting for WebView2...")
                time.sleep(8)
                do_inject()
                continue

            if change == "restarted":
                log("WhatsApp restarted — re-injecting...")
                state["injected"] = False
                state["ws_url"] = None
                time.sleep(8)
                do_inject()
                continue

            if not state["injected"]:
                if not do_inject():
                    time.sleep(5)
                continue

            if sync_tick % 20 == 0:
                wa = get_wa_target()
                if not wa:
                    log("Debug port lost")
                    state["injected"] = False
                    state["ws_url"] = None
                    continue

                ws_url = wa["webSocketDebuggerUrl"]
                state["ws_url"] = ws_url
                plugin_status = get_plugin_status(ws_url)
                engine_ready = (
                    plugin_status is not None
                    and plugin_status.get("engineReady") is True
                )
                ui_mounted = (
                    plugin_status is not None
                    and plugin_status.get("uiButton") is True
                    and plugin_status.get("uiPanel") is True
                )
                if engine_ready and ui_mounted:
                    log("Health check passed: engine ready and UI mounted.")
                else:
                    log(
                        "Health check failed; re-injecting. "
                        f"Current page state: {plugin_status!r}"
                    )
                    state["injected"] = False
                    continue

            if sync_tick % 2 == 0:
                ws_url = state["ws_url"]
                if ws_url is None:
                    log("Cannot sync: CDP target is unavailable")
                    state["injected"] = False
                    continue
                changes = sync(ws_url)
                if changes > 0:
                    state["syncs"] += changes

        except KeyboardInterrupt:
            break
        except (
            OSError,
            ValueError,
            TypeError,
            KeyError,
            AttributeError,
            RuntimeError,
            http.client.HTTPException,
            subprocess.SubprocessError,
        ) as error:
            log(f"Service loop error: {error}")
            time.sleep(5)

    ws_url = state["ws_url"]
    if ws_url is not None:
        try:
            sync(ws_url)
        except (OSError, ValueError, subprocess.SubprocessError) as error:
            log(f"Shutdown sync failed: {error}")
        uninject(ws_url)

    log("Service stopped")


STARTUP_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
STARTUP_NAME = "WPlus"


def is_startup_enabled() -> bool:
    import winreg

    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            STARTUP_KEY,
            0,
            winreg.KEY_READ,
        )
        val, _ = winreg.QueryValueEx(key, STARTUP_NAME)
        winreg.CloseKey(key)
        return bool(val)
    except OSError as error:
        log(f"Could not read startup setting: {error}")
        return False


def set_startup(enable: bool) -> bool:
    import winreg

    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            STARTUP_KEY,
            0,
            winreg.KEY_WRITE,
        )

        if enable:
            exe_path = (
                sys.executable
                if getattr(sys, "frozen", False)
                else os.path.abspath(__file__)
            )
            winreg.SetValueEx(
                key,
                STARTUP_NAME,
                0,
                winreg.REG_SZ,
                f'"{exe_path}"',
            )
        else:
            try:
                winreg.DeleteValue(key, STARTUP_NAME)
            except FileNotFoundError:
                pass

        winreg.CloseKey(key)
        return True
    except OSError as error:
        log(f"Could not update startup setting: {error}")
        return False


def kill_old_instances() -> int:
    my_pid = os.getpid()

    try:
        r = subprocess.run(
            [
                "powershell",
                "-Command",
                f"Get-Process -Name 'WPlus' -ErrorAction SilentlyContinue | "
                f"Where-Object {{ $_.Id -ne {my_pid} }} | "
                f"ForEach-Object {{ Stop-Process -Id $_.Id -Force; "
                f"'killed:' + $_.Id }}",
            ],
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        killed = [
            output_line
            for output_line in r.stdout.strip().split("\n")
            if output_line.startswith("killed:")
        ]

        if killed:
            time.sleep(1)
            return len(killed)

    except (OSError, subprocess.SubprocessError) as error:
        log(f"Could not stop existing WPlus processes: {error}")

    return 0


def main() -> None:
    killed = kill_old_instances()
    if killed:
        log(f"Replaced {killed} old instance(s)")

    icon = create_tray()
    t = threading.Thread(target=service_loop, daemon=True)
    t.start()
    print("START")
    icon.run()
    state["running"] = False
    t.join(timeout=10)


if __name__ == "__main__":
    main()
