# git-reflow Backend

Local Node.js API server for the git-reflow web app and Chrome extension.

## Responsibilities

- Verify Google ID tokens.
- Issue and revoke local bearer sessions.
- Store user templates and template versions.
- Publish, like, view, and import network templates.
- Track template usage events.
- Serve the latest GitHub Home template to the extension.

## Tech Stack

| Purpose | Technology |
| --- | --- |
| HTTP server | Node.js `node:http` |
| Config | `dotenv` |
| Google login verification | `google-auth-library` |
| Local database | SQLite via `better-sqlite3` |
| Template validation | `packages/shared/src/templateSchema.js` |

## Run

```powershell
cd web/BE
npm install
npm run dev
```

Default URL:

```text
http://localhost:8787
```

## Environment

Create `web/BE/.env`:

```env
PORT=8787
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
```

Optional:

```env
SQLITE_DB_PATH=C:\absolute\path\to\git-reflow.sqlite
```

`GOOGLE_CLIENT_ID` must match the frontend `VITE_GOOGLE_CLIENT_ID`. No client secret is used because the app verifies Google ID tokens.

## Local Data

The backend stores data in:

```text
web/BE/data/git-reflow.sqlite
```

SQLite WAL/SHM sidecar files may also be created in the same directory. `web/BE/data` is ignored by git.

On startup, if the SQLite database is empty and legacy JSON stores exist, the backend imports:

```text
web/BE/data/templates.json
web/BE/data/sessions.json
web/BE/data/template-usage.json
```

## API

```http
GET /health
```

```http
POST /api/auth/google
GET /api/auth/me
POST /api/auth/logout
```

```http
GET /api/templates
POST /api/templates
GET /api/templates/:templateId
DELETE /api/templates/:templateId
POST /api/templates/github-home
GET /api/templates/github-home/latest
```

```http
GET /api/templates/network
GET /api/templates/network/:networkTemplateId
POST /api/templates/network/:networkTemplateId/like
POST /api/templates/network/:networkTemplateId/view
POST /api/templates/network/:networkTemplateId/import
POST /api/templates/:templateId/publish
DELETE /api/templates/:templateId/publish
```

```http
GET /api/template-usage
POST /api/template-usage
```

## Validation

```powershell
node --check server.js
node --check db.js
```

