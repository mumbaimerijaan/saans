# SAANS Deployment Guide

This guide covers deploying SAANS:
1. **Frontend:** Cloudflare Pages
2. **Backend API:** Render / Railway
3. **Database:** Supabase PostgreSQL

---

## 1. Cloudflare Pages Deployment (Frontend)

### Method A: Connect via Git (Recommended)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository: `mumbaimerijaan/saans`.
3. In the **Set up builds and deployments** page, enter:
   - **Project name:** `saans`
   - **Production branch:** `main`
   - **Framework preset:** `Vite`
   - **Root directory:** `client`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Expand **Environment variables (advanced)** and configure:
   - `NODE_VERSION` = `20`
   - `VITE_API_BASE_URL` = `https://<YOUR-BACKEND-DOMAIN>` (e.g. `https://saans-api.onrender.com` or your backend URL)
   - `VITE_SUPABASE_URL` = `https://<YOUR_PROJECT_ID>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<YOUR_SUPABASE_ANON_KEY>`
   - `VITE_MAP_TILE_URL` = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
5. Click **Save and Deploy**.

> **Note on Routing:** The repository includes `client/public/_redirects` which instructs Cloudflare Pages to route all paths to `index.html` (HTTP 200), ensuring direct browser navigation and reloads on SPA routes (`/facilities`, `/get-help`, `/diy-lab`, etc.) work seamlessly.

### Method B: Deploy via Wrangler CLI
From your local terminal:
```bash
cd client
npm run build
npx wrangler pages deploy dist --project-name=saans
```

---

## 2. Backend Deployment (Render or Railway)

### Deploying on Render (Web Service):
1. Create a new **Web Service** on [Render](https://dashboard.render.com).
2. Connect `https://github.com/mumbaimerijaan/saans`.
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `FRONTEND_URL` = `https://saans.pages.dev` (or your Cloudflare Pages URL)
   - `JWT_SECRET` = `<YOUR_JWT_SECRET>`
   - `SUPABASE_URL` = `https://<YOUR_PROJECT_ID>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<YOUR_SUPABASE_SERVICE_ROLE_KEY>`
   - `SUPABASE_ANON_KEY` = `<YOUR_SUPABASE_ANON_KEY>`
   - `OPENROUTER_API_KEY` = `<YOUR_OPENROUTER_API_KEY>`
   - `OPENROUTER_MODEL` = `nvidia/nemotron-3.5-lightning:free`
   - `OPENROUTER_FALLBACK_MODEL` = `google/gemma-4-31b-it:free`
   - `OPENAQ_API_KEY` = `<YOUR_OPENAQ_API_KEY>`

---

## 3. Database (Supabase)
Ensure the schema migration in `supabase/all_in_one_setup.sql` has been executed in the Supabase SQL Editor.
