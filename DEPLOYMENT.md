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

Firebase Auth (unauthorized-domain) troubleshooting
- If you see `auth/unauthorized-domain` when signing up or signing in, add your Vercel domain to Firebase's authorized domains:
   1. Open the Firebase Console for project `modular-magpie-424219-p4`.
   2. Go to Authentication → Settings → Authorized domains.
   3. Add the deployed domain(s): `homeserv-live.vercel.app` (and any other domains you use, e.g., `homeserv.vercel.app` or your custom domain).
   4. Also add local development hosts: `localhost`, `127.0.0.1`, and `localhost:5173` if you run the Vite preview.

- For OAuth providers (Google, Facebook, etc.), ensure any OAuth redirect URIs configured in their developer consoles include your production domain and `http://localhost:5173` for testing.
- Confirm `authDomain` in `firebase-applet-config.json` matches your Firebase project's auth domain (it currently is `modular-magpie-424219-p4.firebaseapp.com`).

After adding domains, re-try the signup flow in the deployed app (you don't need to redeploy; changes take effect immediately).

Vercel environment variables (set these in Project Settings > Environment Variables)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_FIRESTORE_DATABASE_ID`
- `GEMINI_API_KEY` (if used)

Notes
- The app now prefers Vite env vars (prefixed with `VITE_`). If they are present in Vercel, the app uses them; otherwise it falls back to `firebase-applet-config.json` for local/debug convenience.
- After setting env vars in Vercel, trigger a redeploy or push to rebuild.
