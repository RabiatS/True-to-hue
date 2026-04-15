<div align="center">
<img width="1937" height="952" alt="true to hue" src="https://github.com/user-attachments/assets/dbbdc99f-feda-40bb-81a4-da427518824c" />

</div>

# True to Hue

AI-powered brand color system generator with export tools for CSS, tokens, and handoff assets.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm.cmd install`
2. Run `npm.cmd run dev`, click **API key**, and choose **OpenAI**, **Gemini**, or **Claude** (key stays in your browser only).  
   Optional: [.env.local](.env.example) can supply `VITE_OPENAI_API_KEY` for dev-only direct OpenAI (never commit secrets).
3. App URL: the dev server prints in the terminal (default port `3000`).

## Theme generation on GitHub Pages

Use **API key** on the site to paste your own provider key, or use **test mode** (project name starting with `!test`).  
Optional hosted API: [DEPLOY-PROXY.md](DEPLOY-PROXY.md) and `public/theme-api.json` / `VITE_THEME_API_URL`.

## Project Structure

- `src/` - React app source code
- `prototypes/` - standalone HTML exploration and backup prototypes
- `docs/backups/` - notes/documentation for backup prototypes
