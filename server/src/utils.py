from datetime import datetime
from pathlib import Path
import threading

_LOG_FILE = Path("game_log.txt")
_lock = threading.Lock()


def write_message_to_file(message: str) -> None:
    """
    Append a message to a log file with a timestamp.
    Thread-safe (safe for websocket / async server use).
    """
    timestamp = datetime.utcnow().isoformat()

    line = f"[{timestamp}] {message}\n"

    with _lock:
        with _open_file() as f:
            f.write(line)


def _open_file():
    """
    Internal helper so we always append safely.
    """
    return _LOG_FILE.open("a", encoding="utf-8")