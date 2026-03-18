Deployment (single Vercel project, path-based)

Summary
- We deploy the SPA as one Vercel project and serve the whole app from `/`, `/admin/*`, and `/provider/*`.
- `vercel.json` rewrites ensure SPA routing returns `index.html` for these paths.

Quick steps
1. Commit and push your repo to GitHub (or GitLab/Bitbucket).

2. In Vercel:
   - Import the repository and create a new Project.
   - Vercel will use `vercel.json` to run `npm run build` and serve `dist`.

3. Environment variables
   - Add your Firebase and other secret keys in Vercel under Project Settings > Environment Variables.
   - If you need different values per path, use a single set and detect roles client-side (e.g., based on user role) or split into separate projects.

4. Test routes
   - Visit `/` for customer, `/admin` for admin UI, `/provider` for service provider UI.

Notes
- The SPA must handle client-side routing (this repo already uses `react-router-dom`).
- If you want separate env var sets and deployments per role, create 3 Vercel Projects instead.
