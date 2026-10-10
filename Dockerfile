# Multi-stage Dockerfile for unified single-port Rockfall AI deployment
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend ./
ENV VITE_API_BASE_URL=""
RUN npm run build

# Python backend runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, ml models and data
COPY backend ./backend
COPY ml ./ml
COPY data ./data

# Copy built frontend assets into frontend/dist for FastAPI StaticFiles mounting
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
