# Rockfall-AI frontend

React + TypeScript + Vite client for the Rockfall-AI screening API.

```bash
npm install
npm run dev
```

The dev server proxies `/predict`, `/health`, and `/model` to `http://127.0.0.1:8000`.
Set `VITE_API_BASE_URL` if the API runs elsewhere.
