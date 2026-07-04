# Architectural Essays — Vercel Blob backend

Your page now stores PDFs in **Vercel Blob** instead of the browser's
artifact storage. There's no database: each PDF's filename encodes its
own id and title (`essays/<id>__<title>.pdf`), so the list of essays is
just whatever Vercel Blob returns when asked.

## Files

```
.
├── index.html        ← your page, updated to call the API below
├── api/
│   ├── essays.js      ← GET (list) / DELETE (remove one)
│   └── upload.js      ← issues upload tokens for direct browser→Blob uploads
└── package.json
```

Uploads go **directly from the browser to Blob storage** (not through a
serverless function), so you're not limited by Vercel's ~4.5MB request
body cap — PDFs up to 50MB work out of the box (change
`maximumSizeInBytes` in `api/upload.js` if you want a different cap).

## Deploy steps

1. **Push this folder to a GitHub repo** (or drag-and-drop deploy via the
   Vercel dashboard / `vercel` CLI — either works, no framework config
   needed).

2. **Import the project into Vercel.** Framework preset: "Other" is fine,
   there's no build step.

3. **Add a Blob store:**
   - In your Vercel project → **Storage** tab → **Create Database** →
     **Blob**.
   - Connect it to this project.
   - Vercel automatically sets the `BLOB_READ_WRITE_TOKEN` environment
     variable for you — you don't need to create it manually.

4. **Deploy.** That's it — visit your deployment URL, use "Add essay" to
   upload a PDF, and it'll persist for anyone who visits the page (blobs
   are created with `access: 'public'`, so PDF links are viewable by
   anyone who has the URL, same as before with shared artifact storage).

## Local development (optional)

```bash
npm install -g vercel
npm install
vercel dev
```

`vercel dev` pulls in your Blob token automatically once the store is
linked (`vercel link` first if you haven't).

## Notes / things you might want to tweak

- **Deleting essays** removes the blob entirely — there's no trash/undo.
- Anyone with a card's PDF URL can open it (blob access is `public`);
  there's no auth layer. If you want essays private to only you, that
  needs an auth check in `api/essays.js`/`api/upload.js` plus switching
  Blob access — happy to add that if you want it.
- The 50MB per-file cap is set in `api/upload.js` (`onBeforeGenerateToken`).
