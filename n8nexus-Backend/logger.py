import logging
import sys


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    log = logging.getLogger("openai_chat")
    if log.handlers:
        return log
    log.setLevel(level)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    )
    log.addHandler(handler)
    return log
