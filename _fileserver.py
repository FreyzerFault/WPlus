#!/usr/bin/env python3
# WPlus File Server — serves saved media and accepts file uploads
# from the injected JS. Runs on localhost:18733

import base64
import binascii
from io import BytesIO
import json
import os
import re
import threading
import time
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any
from urllib.parse import unquote, urlsplit

from PIL import Image, ImageSequence

# NOTE: wplus.py rewrites the __file__ expression below when freezing the
# app into an EXE, so it must stay on a single line and keep its exact text.
_BASE_DIR = r"D:\Tools\WPlus"

DATA_DIR = os.path.join(_BASE_DIR, "data")
MEDIA_DIRS = {
    "image": os.path.join(DATA_DIR, "Images"),
    "sticker": os.path.join(DATA_DIR, "Images"),
    "video": os.path.join(DATA_DIR, "Videos"),
    "ptt": os.path.join(DATA_DIR, "Sounds"),
    "audio": os.path.join(DATA_DIR, "Sounds"),
    "document": os.path.join(DATA_DIR, "Docs"),
}
for d in set(MEDIA_DIRS.values()):
    os.makedirs(d, exist_ok=True)

NEW_MSGS = os.path.join(DATA_DIR, "new_messages.json")
DEL_MSGS = os.path.join(DATA_DIR, "deleted_messages.json")
SETTINGS = os.path.join(DATA_DIR, "settings.json")

MIME_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "mp4": "video/mp4",
    "ogg": "audio/ogg",
    "mp3": "audio/mpeg",
    "pdf": "application/pdf",
}
DEFAULT_MIME = "application/octet-stream"
EXT_BY_TYPE = {
    "image": "jpg",
    "video": "mp4",
    "ptt": "ogg",
    "audio": "mp3",
    "sticker": "webp",
    "document": "bin",
}
MEDIA_TYPES = ("image", "video", "ptt", "audio", "sticker", "document")
EXPIRY_MS = 172800000  # 48h: WhatsApp "delete for everyone" window
MAX_STICKER_INPUT_BYTES = 20 * 1024 * 1024
MAX_STICKER_OUTPUT_BYTES = 500 * 1024
MAX_STICKER_FRAMES = 100
MAX_STICKER_DURATION_MS = 10000
BASE64_CHARS = set(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "0123456789+/=\n\r"
)
BASE64_PREFIXES = (
    "/9j/",     # JPEG
    "AAAA",    # Various
    "UklG",    # RIFF/WebP
    "iVBOR",   # PNG
    "JVBER",   # PDF
    "T2dn",    # OGG
    "GkXE",    # WebM
    "data:",   # Data URL
)


def load_json(path: str, default: Any = None) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return default if default is not None else []


def save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        pass  # Silent

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        request_path = urlsplit(self.path).path
        # Serve media files: /media/Images/filename.jpg
        if request_path.startswith("/media/"):
            rel_path = unquote(request_path[7:]).replace("/", os.sep)
            filepath = _resolve_data_path(rel_path)
            if filepath and os.path.isfile(filepath):
                ext = filepath.rsplit(".", 1)[-1].lower()
                mime = MIME_TYPES.get(ext, DEFAULT_MIME)
                try:
                    with open(filepath, "rb") as media_file:
                        content = media_file.read()
                except OSError as error:
                    self.send_error(404, explain=str(error))
                    return
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", mime)
                self.end_headers()
                self.wfile.write(content)
                return
        # Get deleted messages
        if request_path == "/deleted":
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = load_json(DEL_MSGS, [])
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # Get settings
        if request_path == "/settings":
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = load_json(SETTINGS, {})
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            self.send_error(400, "Invalid Content-Length")
            return
        if length < 0:
            self.send_error(400, "Invalid Content-Length")
            return
        if length > MAX_STICKER_INPUT_BYTES * 4 // 3 + 1024:
            self._json_error(413, "La imagen supera el límite de 20 MB.")
            return
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400, "Request body must contain valid JSON")
            return
        if not isinstance(data, dict):
            self.send_error(400, "Request body must be a JSON object")
            return

        request_path = urlsplit(self.path).path
        if request_path == "/sticker/convert":
            try:
                result = convert_sticker(data)
            except (ValueError, OSError, Image.DecompressionBombError) as error:
                self._json_error(422, str(error))
                return
            self._ok(result)
            return

        # Save a new message (backup)
        if request_path == "/msg/new":
            msgs = load_json(NEW_MSGS, [])
            # Deduplicate
            if not any(m.get("id") == data.get("id") for m in msgs):
                # Save media to file if present
                media_path = self._save_media(data)
                if media_path:
                    data["mediaFile"] = media_path
                    # Remove base64 from JSON
                    data.pop("media", None)
                    data.pop("body", None)
                msgs.append(data)
                # Clean messages older than 48h
                cutoff = time.time() * 1000 - EXPIRY_MS
                expired = [m for m in msgs if m.get("time", 0) < cutoff]
                msgs = [m for m in msgs if m.get("time", 0) >= cutoff]
                # Delete media files for expired messages
                for exp in expired:
                    self._remove_media(exp)
                save_json(NEW_MSGS, msgs)
            self._ok({"saved": True})
            return
# Message deleted — move from new to deleted
        if request_path == "/msg/deleted":
            msg_id = data.get("id")
            # Find in new messages
            new_msgs = load_json(NEW_MSGS, [])
            found = None
            remaining = []
            for m in new_msgs:
                if m.get("id") == msg_id:
                    found = m
                else:
                    remaining.append(m)

            # Merge with incoming data (has the backed-up content)
            if found:
                for k, v in data.items():
                    if v and k not in found:
                        found[k] = v
                entry = found
            else:
                entry = data

            # Save media if not already saved
            if not entry.get("mediaFile"):
                media_path = self._save_media(entry)
                if media_path:
                    entry["mediaFile"] = media_path
                    entry.pop("media", None)

            # Remove raw base64 body for media messages
            if self._is_long_body(entry):
                entry["body"] = ""

            # Add to deleted messages
            del_msgs = load_json(DEL_MSGS, [])
            if not any(m.get("id") == msg_id for m in del_msgs):
                del_msgs.append(entry)
                save_json(DEL_MSGS, del_msgs)

            # Remove from new messages
            save_json(NEW_MSGS, remaining)

            self._ok({
                "deleted": True,
                "hasMedia": bool(entry.get("mediaFile")),
            })
            return

        # Save settings
        if request_path == "/settings":
            save_json(SETTINGS, data)
            self._ok({"saved": True})
            return
# Migrate — re-process old deleted messages, save their media to files
        if request_path == "/migrate":
            del_msgs = load_json(DEL_MSGS, [])
            migrated = 0
            for msg in del_msgs:
                if msg.get("mediaFile"):
                    continue  # Already has a file
                media_path = self._save_media(msg)
                if media_path:
                    msg["mediaFile"] = media_path
                    # Clear the base64 body to save space
                    if self._is_long_body(msg):
                        msg["body"] = ""
                    if msg.get("media"):
                        msg["media"] = ""
                    migrated += 1
            if migrated > 0:
                save_json(DEL_MSGS, del_msgs)
            self._ok({"migrated": migrated, "total": len(del_msgs)})
            return

        # Cleanup — remove expired new messages + their media
        if request_path == "/cleanup":
            cutoff = time.time() * 1000 - EXPIRY_MS
            msgs = load_json(NEW_MSGS, [])
            expired = [m for m in msgs if m.get("time", 0) < cutoff]
            remaining = [m for m in msgs if m.get("time", 0) >= cutoff]
            cleaned_files = 0
            for exp in expired:
                if self._remove_media(exp):
                    cleaned_files += 1
            save_json(NEW_MSGS, remaining)
            self._ok({
                "removed": len(expired),
                "files": cleaned_files,
                "remaining": len(remaining),
            })
            return

        self.send_response(404)
        self.end_headers()

    @staticmethod
    def _remove_media(msg: dict[str, Any]) -> bool:
        """Delete the media file of a message. Returns True if removed."""
        media_file = msg.get("mediaFile")
        if not media_file:
            return False
        if not isinstance(media_file, str):
            return False
        filepath = _resolve_data_path(media_file)
        if filepath is None:
            return False
        try:
            os.remove(filepath)
        except FileNotFoundError:
            return False
        return True

    @staticmethod
    def _is_long_body(msg: dict[str, Any]) -> bool:
        """True when the message carries a large base64 body payload."""
        body = msg.get("body")
        return bool(
            msg.get("mediaFile") and isinstance(body, str) and len(body) > 200
        )

    def _save_media(self, data: dict[str, Any]) -> str | None:
        """Extract base64 media and save to file.

        Returns the path relative to DATA_DIR, or None when the message
        carries no recognisable media payload.
        """
        media = data.get("media")
        media_b64 = media if isinstance(media, str) else None
        body = data.get("body")
        body_b64 = body if isinstance(body, str) else ""

        # Check multiple sources for base64 data
        if not media_b64:
            # Body might be base64 media
            if (len(body_b64) > 100
                    and data.get("type", "") in MEDIA_TYPES
                    and self._looks_like_media(body_b64)):
                media_b64 = body_b64

        if not media_b64:
            return None

        # Determine type and extension
        msg_type = data.get("type", "image")
        if not isinstance(msg_type, str):
            msg_type = "image"
        ext = EXT_BY_TYPE.get(msg_type, "bin")

        # Handle data: URLs
        raw_b64 = media_b64
        if raw_b64.startswith("data:"):
            parts = raw_b64.split(",", 1)
            if len(parts) == 2:
                raw_b64 = parts[1]
                # Extract extension from mime
                mime = ""
                if ":" in parts[0]:
                    mime = parts[0].split(";")[0].split(":")[1]
                for name in ("png", "webp", "mp4", "ogg"):
                    if name in mime:
                        ext = name
                        break

        try:
            raw_bytes = base64.b64decode(raw_b64)
        except (binascii.Error, ValueError, TypeError):
            return None

        # Generate filename
        sender_value = data.get("sender")
        sender = str(sender_value or "unknown").split("@", 1)[0]
        sender = re.sub(r"[^A-Za-z0-9_-]", "_", sender)[:64] or "unknown"
        ts = time.strftime("%Y%m%d_%H%M%S")
        filename = f"WPlus_{sender}_{ts}_{uuid.uuid4().hex}.{ext}"

        # Save to folder
        folder = MEDIA_DIRS.get(msg_type, MEDIA_DIRS["document"])
        filepath = os.path.join(folder, filename)
        with open(filepath, "wb") as f:
            f.write(raw_bytes)

        # Return relative path for serving
        rel = os.path.relpath(filepath, DATA_DIR).replace(os.sep, "/")
        return rel

    @staticmethod
    def _looks_like_media(body_b64: str) -> bool:
        """Heuristically detect a base64 media payload inside a body."""
        # Check common base64 prefixes
        if body_b64.startswith(BASE64_PREFIXES):
            return True
        # Otherwise, fall back to a character-set sniff on a sample
        if len(body_b64) > 500:
            return all(c in BASE64_CHARS for c in body_b64[:200])
        return False

    def _ok(self, data: dict[str, Any]) -> None:
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _json_error(self, status: int, message: str) -> None:
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))


def start_server(port: int = 18733) -> HTTPServer:
    server = HTTPServer(("127.0.0.1", port), Handler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server


def convert_sticker(data: dict[str, Any]) -> dict[str, Any]:
    """Convert a supported image into a WhatsApp-sized WebP sticker payload."""
    encoded = data.get("image")
    if not isinstance(encoded, str) or not encoded:
        raise ValueError("No se recibió ningún archivo de imagen.")

    try:
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("El archivo de imagen no tiene una codificación válida.") from error
    if not raw:
        raise ValueError("El archivo de imagen está vacío.")
    if len(raw) > MAX_STICKER_INPUT_BYTES:
        raise ValueError("La imagen supera el límite de 20 MB.")

    try:
        source = Image.open(BytesIO(raw))
        if source.format not in ("GIF", "JPEG", "PNG", "WEBP", "BMP"):
            raise ValueError("Formato no compatible. Usa GIF, PNG, JPEG o WebP.")
        frame_count = getattr(source, "n_frames", 1)
        if source.width * source.height * frame_count > 40_000_000:
            raise ValueError("La resolución de la imagen es demasiado grande.")
        if frame_count > MAX_STICKER_FRAMES:
            raise ValueError("La animación supera el límite de 100 fotogramas.")

        frames: list[Image.Image] = []
        durations: list[int] = []
        remaining = MAX_STICKER_DURATION_MS
        for frame in ImageSequence.Iterator(source):
            if remaining <= 0:
                break
            duration = max(20, int(frame.info.get("duration", 100) or 100))
            duration = min(duration, remaining)
            frames.append(frame.convert("RGBA").copy())
            durations.append(duration)
            remaining -= duration
        source.close()
    except (Image.DecompressionBombError, OSError) as error:
        raise ValueError("No se pudo leer el archivo de imagen.") from error

    if not frames:
        raise ValueError("La imagen no contiene fotogramas válidos.")

    animated = len(frames) > 1
    max_bytes = MAX_STICKER_OUTPUT_BYTES if animated else 100 * 1024
    encoded_webp: bytes | None = None
    for side in (512, 448, 384, 320):
        sticker_frames: list[Image.Image] = []
        for frame in frames:
            frame.thumbnail((side, side), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            canvas.alpha_composite(
                frame,
                ((side - frame.width) // 2, (side - frame.height) // 2),
            )
            sticker_frames.append(canvas)
        for quality in (75, 60, 45, 30):
            output = BytesIO()
            sticker_frames[0].save(
                output,
                format="WEBP",
                save_all=animated,
                append_images=sticker_frames[1:],
                duration=durations if animated else None,
                loop=0,
                quality=quality,
                method=6,
            )
            if output.tell() <= max_bytes:
                encoded_webp = output.getvalue()
                break
        if encoded_webp:
            break

    if encoded_webp is None:
        raise ValueError(
            "No se pudo comprimir el sticker por debajo del límite de WhatsApp."
        )

    return {
        "webp": base64.b64encode(encoded_webp).decode("ascii"),
        "animated": animated,
        "frames": len(frames),
        "durationMs": sum(durations),
        "size": len(encoded_webp),
    }


def _resolve_data_path(relative_path: str) -> str | None:
    """Resolve a DATA_DIR-relative path and prevent directory traversal."""
    data_root = os.path.realpath(DATA_DIR)
    resolved_path = os.path.realpath(os.path.join(data_root, relative_path))
    try:
        common_path = os.path.commonpath((data_root, resolved_path))
    except ValueError:
        return None
    if os.path.normcase(common_path) != os.path.normcase(data_root):
        return None
    return resolved_path
