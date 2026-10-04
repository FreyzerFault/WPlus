#!/usr/bin/env python3
# WPlus Service v1.2 — by KuchiSofts
# Smart background service: auto-detects WhatsApp, injects, syncs, reconnects
import http.client
import json
import os
import subprocess
import sys
import time
from typing import Any, TypedDict


class CDPTarget(TypedDict):
    url: str
    type: str
    webSocketDebuggerUrl: str


script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
DATA_DIR = os.path.join(project_dir, "data")
os.makedirs(DATA_DIR, exist_ok=True)

FILES = {
    "wplus_del": os.path.join(DATA_DIR, "deleted_messages.json"),
    "wplus_cfg": os.path.join(DATA_DIR, "settings.json"),
}
LOG_FILE = os.path.join(DATA_DIR, "debug.log")

# PowerShell snippet reporting whether WhatsApp is running.
PS_WA_RUNNING = (
    "Get-Process -Name 'WhatsApp*' -ErrorAction SilentlyContinue"
    " | Select-Object -First 1 | ForEach-Object { 'yes' }"
)

# Reads and clears the "sync now" flag, returning "yes"/"no".
JS_SYNC_FLAG = (
    '(function(){var f=localStorage.getItem("wplus_sync_now");'
    'if(f){localStorage.removeItem("wplus_sync_now");return "yes";}'
    'return "no";})()'
)

# Reports whether the injected plugin is still alive in the page.
JS_ALIVE = 'window.__wplus && window.__wplus.ready ? "yes" : "no"'

# Clear log on startup
with open(LOG_FILE, "w", encoding="utf-8") as f:
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    f.write(f"[WPlus] Session started {stamp}\n")


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
        print(f"Could not save {path}: {error}", file=sys.stderr)
        return False


def get_wa_target() -> CDPTarget | None:
    """Find WhatsApp page via debug port"""
    connection = http.client.HTTPConnection("127.0.0.1", 9222, timeout=3)
    try:
        connection.request("GET", "/json")
        targets = json.loads(connection.getresponse().read())
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
    except (OSError, ValueError, TypeError, AttributeError):
        return None
    finally:
        connection.close()
    return None


def cdp_eval(ws_url: str, code: str) -> Any | None:
    """Execute JS in WhatsApp page via CDP"""
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
    msg_path = os.path.join(project_dir, "_cdp.json")
    with open(msg_path, "w", encoding="utf-8") as f:
        f.write(cdp)
    ps = (
        f"$ws=New-Object System.Net.WebSockets.ClientWebSocket;"
        f"$ct=[System.Threading.CancellationToken]::None;"
        f'$ws.ConnectAsync([System.Uri]::new("{ws_url}"),$ct).Wait();'
        f'$msg=[System.IO.File]::ReadAllText("{msg_path}");'
        f"$b=[System.Text.Encoding]::UTF8.GetBytes($msg);"
        f"$ws.SendAsync([System.ArraySegment[byte]]::new($b),"
        f"[System.Net.WebSockets.WebSocketMessageType]::Text,"
        f"$true,$ct).Wait();"
        f"$buf=New-Object byte[] 262144;"
        f"$ws.ReceiveAsync([System.ArraySegment[byte]]::new($buf),$ct)"
        f".Wait()|Out-Null;"
        f"[System.Text.Encoding]::UTF8.GetString($buf).Trim([char]0);"
        f"$ws.Dispose()"
    )
    try:
        r = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-Command", ps],
            capture_output=True,
            text=True,
            timeout=30,
        )
        os.remove(msg_path)
        outer = json.loads(r.stdout.strip())
        return outer.get("result", {}).get("result", {}).get("value")
    except (OSError, subprocess.SubprocessError, ValueError, AttributeError):
        try:
            os.remove(msg_path)
        except FileNotFoundError:
            pass
        return None


def is_wa_running() -> bool:
    """Check if WhatsApp process is running"""
    try:
        r = subprocess.run(
            ["powershell", "-Command", PS_WA_RUNNING],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return "yes" in r.stdout
    except (OSError, subprocess.SubprocessError):
        return False


def inject(ws_url: str) -> tuple[bool, int]:
    """Inject engine + UI into WhatsApp"""
    # Restore saved data from disk
    restored = 0
    for key, path in FILES.items():
        data = load_file(path, "null")
        if data and data != "null":
            escaped = json.dumps(data)
            cdp_eval(ws_url, f'localStorage.setItem("{key}", {escaped})')
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


def sync(ws_url: str) -> tuple[int, bool]:
    """Pull data from WhatsApp localStorage to disk"""
    changes = 0
    # Check for immediate sync flag
    flag = cdp_eval(
        ws_url,
        '(function(){var f=localStorage.getItem("wplus_sync_now");'
        'if(f){localStorage.removeItem("wplus_sync_now");return "yes";}'
        'return "no";})()',
    )

    for key, path in FILES.items():
        val = cdp_eval(ws_url, f'localStorage.getItem("{key}")')
        if isinstance(val, str) and val != "null":
            current = load_file(path, "")
            if val != current:
                if save_file(path, val):
                    changes += 1

    # Sync debug log
    try:
        log_val = cdp_eval(ws_url, 'localStorage.getItem("wplus_log")')
        if isinstance(log_val, str) and log_val != "null":
            entries = json.loads(log_val)
            if isinstance(entries, list) and len(entries) > 0:
                lines = [
                    f"WPlus Debug Log — {time.strftime('%Y-%m-%d %H:%M:%S')}",
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
        print(f"Could not sync debug log: {error}", file=sys.stderr)

    return changes, flag == "yes"


def main() -> None:
    print()
    print("  WPlus v1.2 — by KuchiSofts")
    print("  ===========================")
    print(f"  Data: {DATA_DIR}")
    print()
    sys.stdout.flush()

    injected = False
    last_ws_url = None
    sync_tick = 0
    total_syncs = 0

    while True:
        try:
            # ── Phase 1: Wait for WhatsApp ────────────────────
            if not injected:
                # Check if WhatsApp is running
                if not is_wa_running():
                    print(
                        "  Waiting for WhatsApp Desktop...", end="", flush=True
                    )
                    while not is_wa_running():
                        print(".", end="", flush=True)
                        time.sleep(3)
                    print(" detected!", flush=True)
                    time.sleep(8)  # Wait for WebView2 to initialize

                # Find debug port
                print("  Connecting...", end="", flush=True)
                wa = None
                for _ in range(30):
                    wa = get_wa_target()
                    if wa:
                        break
                    print(".", end="", flush=True)
                    time.sleep(2)

                if not wa:
                    print(" failed. Retrying...", flush=True)
                    time.sleep(5)
                    continue

                last_ws_url = wa["webSocketDebuggerUrl"]
                print(" connected!", flush=True)

                # Inject
                print("  Injecting WPlus...", end="", flush=True)
                ok, restored = inject(last_ws_url)
                if ok:
                    print(
                        f" done! ({restored} saved items restored)", flush=True
                    )
                    injected = True
                    print()
                    print("  \u2705 WPlus is active!")
                    print(
                        "  \u2022 Settings and messages sync to disk "
                        "automatically"
                    )
                    print(
                        "  \u2022 If WhatsApp restarts, WPlus re-injects "
                        "automatically"
                    )
                    print("  \u2022 Press Ctrl+C to stop")
                    print()
                    sys.stdout.flush()
                else:
                    print(f" error: {ok}", flush=True)
                    time.sleep(5)
                    continue

            # ── Phase 2: Sync loop ────────────────────────────
            time.sleep(3)
            sync_tick += 1

            # Check if WhatsApp is still alive
            wa = get_wa_target()
            if not wa:
                if injected:
                    # WhatsApp closed — do final sync
                    print(
                        "\n  WhatsApp closed. Waiting for restart...",
                        flush=True,
                    )
                    if last_ws_url:
                        try:
                            sync(last_ws_url)
                        except (
                            OSError,
                            ValueError,
                            subprocess.SubprocessError,
                        ):
                            print("  Final sync failed.", file=sys.stderr)
                    injected = False
                    last_ws_url = None
                    continue
                else:
                    continue

            last_ws_url = wa["webSocketDebuggerUrl"]

            # Check if plugin is still loaded
            if sync_tick % 10 == 0:  # Every 30 seconds
                alive = cdp_eval(
                    last_ws_url,
                    'window.__wplus && window.__wplus.ready ? "yes" : "no"',
                )
                if alive != "yes":
                    print(
                        "  Plugin lost (page reload?). Re-injecting...",
                        flush=True,
                    )
                    injected = False
                    continue

            # Sync data
            changes, was_immediate = sync(last_ws_url)
            if changes > 0:
                total_syncs += changes
                ts = time.strftime("%H:%M:%S")
                if was_immediate:
                    print(f"  [{ts}] Settings saved!", flush=True)
                else:
                    print(f"  [{ts}] Synced ({total_syncs} total)", flush=True)

        except KeyboardInterrupt:
            print("\n  Saving final state...", flush=True)
            if last_ws_url:
                try:
                    sync(last_ws_url)
                except (OSError, ValueError, subprocess.SubprocessError):
                    print("  Final sync failed.", file=sys.stderr)
            print("  Done. Goodbye!")
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
            error_text = str(error).lower()
            if "connect" in error_text or "target" in error_text:
                if injected:
                    print("\n  Connection lost. Reconnecting...", flush=True)
                    injected = False
            else:
                print(f"\n  Service error: {error}", file=sys.stderr)
            time.sleep(3)


if __name__ == "__main__":
    main()
