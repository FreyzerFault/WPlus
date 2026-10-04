#!/usr/bin/env pythonw
# WPlus Service v1.3 — System Tray App
# by KuchiSofts — github.com/KuchiSofts
# Smart tray service: auto-detect, inject, sync, uninject on exit

import http.client
import json
import os
import subprocess
import sys
import threading
import time
from itertools import count
from typing import Any, TypedDict

from PIL import Image, ImageDraw, ImageFont
import pystray
from fileserver import start_server as start_file_server

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)  # Parent of service/


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


DATA_DIR = os.path.join(project_dir, "data")
os.makedirs(DATA_DIR, exist_ok=True)

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
    connection = http.client.HTTPConnection("127.0.0.1", 9222, timeout=3)
    try:
        connection.request("GET", "/json")
        response = connection.getresponse()
        targets = json.loads(response.read())
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


def cdp_eval(ws_url: str, code: str) -> Any | None:
    cdp = json.dumps(
        {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": code, "returnByValue": True},
        }
    )
    p = os.path.join(project_dir, "_cdp.json")
    with open(p, "w", encoding="utf-8") as f:
        f.write(cdp)
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
                f"[System.Net.WebSockets.WebSocketMessageType]::Text,"
                f"$true,$ct).Wait();"
                f"$buf=New-Object byte[] 262144;"
                f"$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf),"
                f"$ct).Wait()|Out-Null;"
                f"[System.Text.Encoding]::UTF8.GetString($buf).Trim([char]0);"
                f"$ws.Dispose()",
            ],
            capture_output=True,
            text=True,
            timeout=30,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        os.remove(p)
        return (
            json.loads(r.stdout.strip())
            .get("result", {})
            .get("result", {})
            .get("value")
        )
    except (
        OSError,
        subprocess.SubprocessError,
        ValueError,
        AttributeError,
        TypeError,
    ) as error:
        log(f"Could not execute CDP request: {error}")
        try:
            os.remove(p)
        except FileNotFoundError:
            pass
        return None


def is_wa_running() -> bool:
    try:
        r = subprocess.run(
            [
                "powershell",
                "-Command",
                "Get-Process -Name 'WhatsApp*' -ErrorAction SilentlyContinue "
                "| "
                "Select-Object -First 1 | ForEach-Object { 'yes' }",
            ],
            capture_output=True,
            text=True,
            timeout=5,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        return "yes" in r.stdout
    except (OSError, subprocess.SubprocessError):
        return False


# ── Inject / Uninject ────────────────────────────────────────
def inject(ws_url: str) -> tuple[bool, int]:
    # Uninject previous instance first
    cdp_eval(
        ws_url,
        "if(window.__wplus&&window.__wplus.cleanup)window.__wplus.cleanup()",
    )

    # Restore saved data
    restored = 0
    for key, path in FILES.items():
        data = load_file(path, "null")
        if data and data != "null":
            cdp_eval(
                ws_url, f'localStorage.setItem("{key}",{json.dumps(data)})'
            )
            restored += 1

    # Inject engine + UI
    with open(
        os.path.join(project_dir, "engine.js"), "r", encoding="utf-8"
    ) as f:
        engine = f.read()
    with open(os.path.join(project_dir, "ui.js"), "r", encoding="utf-8") as f:
        ui = f.read()
    result = cdp_eval(ws_url, engine + ";\n" + ui)
    return result == "ok", restored


def uninject(ws_url: str) -> None:
    """Remove plugin completely — restore WhatsApp to original state"""
    cdp_eval(
        ws_url,
        """(function(){
            if(window.__wplus && window.__wplus.cleanup)
                window.__wplus.cleanup();
            ["wplus-btn","wplus-panel","wplus-css","wplus-header-restore",
             "wplus-style","wplus-css-blurMessages","wplus-css-blurContacts",
             "wplus-css-blurPhotos"].forEach(function(id){
                var e=document.getElementById(id); if(e) e.remove();
            });
            document.querySelectorAll(
                ".wplus-restore-btn,.wplus-b,.wpp,.wplus-msg-highlight,[id*=wplus]"
            ).forEach(function(e){e.remove();});
            document.querySelectorAll(".wplus-blur-t,.wplus-blur-p").forEach(function(e){
                e.classList.remove("wplus-blur-t","wplus-blur-p");
            });
            window.__wplus = undefined;
        })()""",
    )
    log("Plugin uninjected")


def sync(ws_url: str) -> int:
    changes = 0
    # Check immediate sync flag
    cdp_eval(
        ws_url,
        '(function(){var f=localStorage.getItem("wplus_sync_now");'
        'if(f)localStorage.removeItem("wplus_sync_now");})()',
    )
    for key, path in FILES.items():
        val = cdp_eval(ws_url, f'localStorage.getItem("{key}")')
        if isinstance(val, str) and val != "null":
            current = load_file(path, "")
            if val != current:
                if save_file(path, val):
                    changes += 1
    # Sync debug log (less frequent — only every 5th call)
    if next(_sync_call_count) % 5 == 4:
        try:
            log_val = cdp_eval(ws_url, 'localStorage.getItem("wplus_log")')
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


# ── Tray Icon ────────────────────────────────────────────────
def create_icon() -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([8, 4, 56, 56], radius=8, fill="#25D366")
    try:
        font = ImageFont.truetype("segoeui.ttf", 22)
    except OSError as error:
        log(f"Could not load tray font: {error}")
        font = ImageFont.load_default()
    draw.text((14, 14), "W+", fill="white", font=font)
    return img


def on_quit(icon: Any, item: Any) -> None:
    log("Shutting down...")
    # Uninject before exit
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
    # Uninject first, then mark for re-inject
    if state["ws_url"]:
        uninject(state["ws_url"])
    state["injected"] = False
    log("Re-injecting...")


def on_open_data(icon: Any, item: Any) -> None:
    os.startfile(DATA_DIR)


def create_tray() -> Any:
    return pystray.Icon(
        "WPlus",
        create_icon(),
        "WPlus — WhatsApp Plugin",
        menu=pystray.Menu(
            pystray.MenuItem(
                lambda text: f"Status: {state['status']}", None, enabled=False
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Re-inject Plugin", on_reinject),
            pystray.MenuItem("Open Data Folder", on_open_data),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit WPlus", on_quit),
        ),
    )


# ── Service Loop ─────────────────────────────────────────────
def service_loop() -> None:
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        f.write(
            f"WPlus Service started {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        )
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(
            f"[WPlus] Session started {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        )

    # Start file server for media saving
    try:
        start_file_server(18733)
        log("File server on port 18733")
    except (OSError, RuntimeError) as error:
        log(f"File server error: {error}")

    sync_tick = 0

    while state["running"]:
        try:
            # Phase 1: Wait for WhatsApp + inject
            if not state["injected"]:
                log("Waiting for WhatsApp...")
                while state["running"] and not is_wa_running():
                    time.sleep(3)
                if not state["running"]:
                    break

                log("Connecting...")
                time.sleep(8)

                wa = None
                for _ in range(20):
                    if not state["running"]:
                        break
                    wa = get_wa_target()
                    if wa:
                        break
                    time.sleep(2)

                if not wa:
                    log("Connection failed")
                    time.sleep(5)
                    continue

                ws_url = wa["webSocketDebuggerUrl"]
                state["ws_url"] = ws_url
                log("Injecting...")
                ok, restored = inject(ws_url)
                if ok:
                    state["injected"] = True
                    log(f"Active ({restored} restored)")
                else:
                    log("Inject failed")
                    time.sleep(5)
                    continue

            # Phase 2: Sync loop (every 5 seconds)
            time.sleep(5)
            sync_tick += 1

            # Check WhatsApp alive
            wa = get_wa_target()
            if not wa:
                if state["injected"]:
                    log("WhatsApp closed")
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

            ws_url = wa["webSocketDebuggerUrl"]
            state["ws_url"] = ws_url

            # Check plugin alive (every 60 seconds)
            if sync_tick % 12 == 0:
                alive = cdp_eval(
                    ws_url,
                    'window.__wplus&&window.__wplus.ready?"yes":"no"',
                )
                if alive != "yes":
                    log("Plugin lost, re-injecting...")
                    state["injected"] = False
                    continue

            # Sync
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

    # Final cleanup
    ws_url = state["ws_url"]
    if ws_url is not None:
        try:
            sync(ws_url)
        except (OSError, ValueError, subprocess.SubprocessError) as error:
            log(f"Shutdown sync failed: {error}")
        uninject(ws_url)
    log("Service stopped")


# ── Entry ────────────────────────────────────────────────────
def main() -> None:
    icon = create_tray()
    t = threading.Thread(target=service_loop, daemon=True)
    t.start()
    icon.run()
    state["running"] = False
    t.join(timeout=10)


if __name__ == "__main__":
    main()
