# 1. Сборка фронтенда
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2. Бэкенд, который отдаёт API и собранный фронтенд с одного порта
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Moscow \
    DATABASE_URL=sqlite:////data/app.db \
    FRONTEND_DIST=/app/static \
    SEED_ON_STARTUP=1
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend /frontend/dist ./static
VOLUME ["/data"]
EXPOSE 8000
# База и демо-данные создаются при первом старте, если файл базы пуст
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
