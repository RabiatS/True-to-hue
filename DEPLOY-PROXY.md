# Deploy the theme API (keeps OpenAI key on the server)

You still need to add **`OPENAI_API_KEY`** in your host’s dashboard—this file cannot do that for you.

## Render (Docker)

1. Push this repo to GitHub (with `Dockerfile`, `render.yaml`, `server/`, `shared/`).
2. In [Render](https://render.com), **New → Blueprint** → connect the repo → apply `render.yaml`.
3. When prompted, set **`OPENAI_API_KEY`** (secret) to your key.
4. Wait for the deploy. Open **`https://<your-service>.onrender.com/health`** — expect `{"ok":true}`.
5. In **`public/theme-api.json`**, set `"themeApiUrl"` to that base URL (no trailing slash), commit, and push so GitHub Pages rebuilds.

## Railway / Fly / other

- **Start command:** `npm start`
- **Root:** repository root
- **Env:** `OPENAI_API_KEY` (required), `ALLOWED_ORIGINS` (optional; comma-separated origins), `PORT` (usually set by host)

## Defaults

- **Local proxy:** `npm run theme-proxy` → port **8787**
- **Docker:** listens on **`PORT`** or **8787**
