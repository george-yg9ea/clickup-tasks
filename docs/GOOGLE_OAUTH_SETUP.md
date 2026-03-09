# Google Cloud Console – OAuth setup for Sign in with Google

Use this to get **Client ID** and **Client Secret** for your app (for `.env.local` as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`).

---

## 1. Open the credentials page

Go to: **https://console.cloud.google.com/apis/credentials**

Sign in with the Google account you want to use for the project.

---

## 2. Create or select a project

- If you see **“Select a project”** at the top, click it and either:
  - **New project** → name it (e.g. “ClickUp Tasks”) → **Create**, or
  - Choose an existing project.
- Make sure that project is selected before the next steps.

---

## 3. Configure the OAuth consent screen (first time only)

You must have a consent screen before creating OAuth credentials.

1. In the left sidebar, open **“OAuth consent screen”** (under **“APIs & Services”**).
2. Choose **External** (unless your org uses Google Workspace and you want **Internal** only) → **Create**.
3. Fill in:
   - **App name:** e.g. `My ClickUp Tasks`
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue**.
5. **Scopes:** **Save and Continue** (default scopes are enough for sign-in).
6. **Test users (if External):** optional for now. **Save and Continue**.
7. **Summary** → **Back to Dashboard**.

---

## 4. Create OAuth 2.0 credentials

1. Go back to **APIs & Services** → **Credentials**:  
   **https://console.cloud.google.com/apis/credentials**
2. Click **+ Create credentials** → **OAuth client ID**.
3. **Application type:** **Web application**.
4. **Name:** e.g. `My ClickUp Tasks (Web)`.
5. **Authorized JavaScript origins**
   - For local dev, add:
     - `http://localhost:3000`
   - For production, add:
     - `https://your-domain.vercel.app` (replace with your actual Vercel domain)
6. **Authorized redirect URIs**
   - For local dev, add **exactly**:
     - `http://localhost:3000/api/auth/callback/google`
   - For production, add **exactly**:
     - `https://your-domain.vercel.app/api/auth/callback/google` (replace with your actual Vercel domain)
7. Click **Create**.

---

## 5. Copy Client ID and Client Secret

- A dialog shows **Client ID** and **Client secret**.
- **Copy both** and store them safely.
- **Important:** The client secret is only fully visible at creation. If you lose it, you’ll need to create a new secret (or new client) in the console.

---

## 6. Put them in your app

In your project root, in `.env.local`:

```env
AUTH_GOOGLE_ID=paste_your_client_id_here
AUTH_GOOGLE_SECRET=paste_your_client_secret_here
```

Also ensure you have:

```env
AUTH_SECRET=your_secret_from_npx_auth_secret
```

Generate `AUTH_SECRET` with:

```bash
npx auth secret
```

Restart the dev server after changing env vars.

---

## Quick reference

| Purpose                    | Value |
|---------------------------|--------|
| Credentials page           | https://console.cloud.google.com/apis/credentials |
| Local redirect URI        | `http://localhost:3000/api/auth/callback/google`   |
| Production redirect URI   | `https://your-domain.vercel.app/api/auth/callback/google`   |
| Production domain         | `https://your-domain.vercel.app`   |
| Env vars for NextAuth     | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` |

---

## Troubleshooting

- **“redirect_uri_mismatch”**  
  The redirect URI in the error must match **exactly** one of the **Authorized redirect URIs** in the OAuth client (including `http` vs `https`, port, and path like `/api/auth/callback/google`).

- **“Access blocked: This app’s request is invalid”**  
  Finish the OAuth consent screen (step 3) and ensure the app is not in a broken state (e.g. missing required fields).

- **Client secret not visible**  
  If the console only shows a truncated secret, create a new client secret for that OAuth client in the credentials page and update `AUTH_GOOGLE_SECRET` with the new value.
