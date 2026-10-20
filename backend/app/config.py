import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'app.db'}")

# Каталог собранного фронтенда; если его нет, отдаётся только API
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist"))

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

SEED_ON_STARTUP = os.getenv("SEED_ON_STARTUP", "1") == "1"

# Координаты новых мероприятий по адресу через Nominatim (OpenStreetMap). В тестах отключено — без сети
GEOCODING_ENABLED = os.getenv("GEOCODING_ENABLED", "1") == "1"
GEOCODER_URL = os.getenv("GEOCODER_URL", "https://nominatim.openstreetmap.org/search")
