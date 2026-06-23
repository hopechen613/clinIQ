from functools import lru_cache

from anthropic import Anthropic

from app.config import ANTHROPIC_API_KEY


@lru_cache
def get_client() -> Anthropic:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not set. Add it to backend/.env")
    return Anthropic(api_key=ANTHROPIC_API_KEY)
