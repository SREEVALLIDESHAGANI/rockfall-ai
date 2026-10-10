# Rockfall-AI: AI-Based Rockfall Prediction and Alert System for Open-Pit Mines

**Department of Artificial Intelligence & Machine Learning — Anurag University (Team No: 19)**  
*Sreevalli Deshagani (23EG107F63) · Thanvi Rao (23EG107F57) · Pranith Reddy (23EG107F11)*

An intelligent, multi-sensor geotechnical decision-support system designed to predict slope failures in open-pit mines and trigger automated safety response protocols (worker evacuation, haulage restriction, and siren alarms).

---

## Architecture Overview

- **Unified Production Engine (`/backend`)**: FastAPI REST API mounted with the production frontend SPA (`/frontend/dist`). Serves the web interface, static evaluation diagnostics, and live ML inference on a single port (`8000`).
- **Machine Learning Core (`/ml`)**: Supervised scikit-learn pipeline featuring proxy engineering (`slope_energy_proxy`, `hydro_loading_proxy`, `kinematic_weakness_proxy`) trained on geomechanical rock mass variables.
- **Interactive Web Client (`/frontend`)**: React 18, TypeScript, React Leaflet GIS mapping, 2D Open-Pit Bench physics simulation, and Web Audio emergency sirens.

---

## One-Click Local Deployment

### Option A: Windows Launcher (Fastest)
Double-click `run_production.bat` in the root folder, or run:
```powershell
.\run_production.bat
```
This automatically boots the unified production server and opens `http://127.0.0.1:8000` in your browser.

### Option B: Manual Command
```powershell
# 1. Build frontend (if modified)
cd frontend
npm run build
cd ..

# 2. Run unified production server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### Option C: Development Mode (Hot Reloading)
- **Backend API**: `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload`
- **Frontend Dev**: `cd frontend; npm run dev` (running on `http://localhost:5173`)

---

## Free Cloud Deployment (e.g. Render / Railway / Fly.io)

Because the application is now packaged as a **single unified Python service**, deploying to free cloud hosting takes only one configuration:

### Deploying on [Render.com](https://render.com)
1. Create a new **Web Service** connected to this Git repository.
2. Set **Build Command**:
   ```bash
   pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..
   ```
3. Set **Start Command**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```

---

## Production Endpoints

| URL Path | Type | Function |
| :--- | :--- | :--- |
| `http://127.0.0.1:8000/` | Web App | Full interactive interface & open-pit bench sandbox |
| `http://127.0.0.1:8000/alerts` | Web App | Control Room Command & Siren Dispatch |
| `http://127.0.0.1:8000/assess` | Web App | Geotechnical parameter screening & 2D physics |
| `http://127.0.0.1:8000/insights` | Web App | Model leaderboard & interactive confusion matrix |
| `http://127.0.0.1:8000/health` | API | Real-time backend & model health monitor (`200 OK`) |
| `http://127.0.0.1:8000/docs` | Swagger | Interactive API testing documentation |
| `http://127.0.0.1:8000/predict` | API (POST) | Multiclass ML probability prediction engine |

---

## Verification & Tests
- **Backend Tests (pytest)**: `python -m pytest backend/tests` (7/7 passed, 100%)
- **Frontend Tests (vitest)**: `cd frontend; npm test` (3/3 passed, 100%)
- **Production Build (tsc & vite)**: `cd frontend; npm run build` (Clean build, 0 errors)
