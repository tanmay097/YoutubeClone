# Vidora: a YouTube-style video app (web · iOS/Android · Mac/Windows)

An MVP video-sharing platform with **video upload, subscriptions, likes and comments**. It has a dark, YouTube-inspired UI. ImageKit serves thumbnails, avatars, icons and other visuals.

```
apps/
  web/       Next.js 16: website + REST API (the single backend for every client)
  mobile/    Expo SDK 58 (React Native): native iOS + Android app
  desktop/   Electron: native Mac/Windows app wrapping the web UI
packages/
  shared/    Types, zod schemas, typed API client, ImageKit + formatting helpers
assets/
  icons/     SVG icon set that is uploaded to ImageKit (`npm run seed:icons`)
scripts/     dev-db.mjs: local MongoDB for development (data in .devdb/)
```

## 1. Prerequisites

- **Node 22.13+** (required by Expo SDK 58; Node 20 prints warnings and may break `expo start`)
- A **MongoDB** database. The free MongoDB Atlas cluster works.
- An **ImageKit** account (free tier). You need the URL endpoint, public key and private key, from Dashboard → Developer options.
- A **Vercel Blob** store for videos (Vercel dashboard → Storage). Its `BLOB_READ_WRITE_TOKEN` is needed for local dev too.
- For mobile: the **Expo Go** app on your phone, or the iOS Simulator / Android Emulator.

## 2. Setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local       # fill in MongoDB + ImageKit + Blob + JWT_SECRET
cp apps/mobile/.env.example apps/mobile/.env       # optional, see below
npm run seed:icons                                 # uploads assets/icons/*.svg to ImageKit /vidora/icons
```

Until ImageKit is configured, the icons fall back to local copies in `apps/web/public/icons`. Thumbnail and avatar uploads need ImageKit.

## 3. Run

| What | Command |
|---|---|
| Web + API | `npm run dev:web`, then open http://localhost:3000 |
| Desktop app | `npm run dev:desktop` (start `dev:web` first; it waits for port 3000) |
| Mobile app | `npm run dev:mobile`, then scan the QR code with Expo Go, or press `i` / `a` |

**Mobile networking:** the phone must reach the Next.js server over your Wi-Fi. By default the app uses the Expo dev-server's IP with port 3000. If that doesn't work, set `EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:3000` in `apps/mobile/.env`. The web dev server already listens on `0.0.0.0`.

**Desktop builds:** `npm run dist -w desktop` produces a `.dmg` or `.exe` in `apps/desktop/release`. Set `DESKTOP_APP_URL` to your deployed web URL when building for real users.

## 4. How it works

- **Auth:** email + password (bcrypt) issues a JWT. Web and desktop keep it in an httpOnly cookie. Mobile stores it in the device keychain (`expo-secure-store`) and sends `Authorization: Bearer`. The API accepts either.
- **Upload:** the thumbnail goes **straight from the client to ImageKit**, using signed params from `GET /api/imagekit-auth`. The video goes **straight from the client to Vercel Blob**: `POST /api/videos/upload` only issues a short-lived token limited to `videos/<userId>/`, MP4/WebM/MOV and 500 MB. The client then calls `POST /api/videos` with the blob URL, and the server checks the blob with `head()` before creating the record. Nothing large passes through a function, which matters because Vercel caps request bodies at 4.5 MB.
- **Playback:** `streamUrl` is the Blob CDN URL, which serves HTTP Range requests (206), so seeking works on web, iOS and Android.
- **Likes / subscriptions:** idempotent toggles backed by unique compound indexes, with denormalised counters (`likeCount`, `subscriberCount`, `commentCount`).
- **ImageKit transforms:** cards use `w-640,h-360`, the player poster uses `w-1280,h-720`, and avatars use `fo-face,r-max`.

### API

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` | – | Returns `{ user, token }` and sets the cookie |
| `GET /api/auth/me` · `PATCH /api/auth/me` · `POST /api/auth/logout` | ✓ for PATCH | Current user / change avatar / sign out |
| `GET /api/imagekit-auth` | ✓ | Signed ImageKit upload params |
| `GET /api/videos?cursor=` · `POST /api/videos` | ✓ for POST | Paginated feed / create a video from an uploaded blob |
| `POST /api/videos/upload` | ✓ | Vercel Blob client-upload token (`handleUpload`) |
| `GET /api/videos/:id` · `POST /api/videos/:id/view` | – | Details (+ `likedByMe`, `subscribedToOwner`) / count a view |
| `POST /api/videos/:id/like` | ✓ | Toggle like |
| `GET/POST /api/videos/:id/comments` · `DELETE /api/comments/:id` | ✓ for writes | Comments |
| `POST /api/channels/:id/subscribe` | ✓ | Toggle subscription (not to yourself) |

## 5. Deploy to Vercel

1. **MongoDB Atlas:** create a free M0 cluster and a database user. Under Network Access, allow `0.0.0.0/0`, since Vercel has no fixed IPs. Copy the `mongodb+srv://…/vidora` URI.
2. **Vercel project:** import the repo and set **Root Directory = `apps/web`**. Framework and npm workspaces are detected automatically.
3. **Blob:** Storage → Create → Blob, then connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Environment variables:** `MONGODB_URI`, `JWT_SECRET` (a new one: `openssl rand -base64 32`), `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`, `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`. Then deploy.
5. **Point the native apps at it:** `DESKTOP_APP_URL=https://<app>.vercel.app` for desktop builds, and `EXPO_PUBLIC_API_URL=https://<app>.vercel.app` in `apps/mobile/.env`.

The Blob Hobby tier is small (about 1 GB stored and 10 GB transferred a month), so watch usage once real videos are being watched.

## 6. Scripts

`npm run typecheck` · `npm run lint` · `npm run build` (web production build)

## Known limits and next iterations

- Video blobs aren't deleted when a video is removed (there's no delete feature yet), and an upload abandoned before publishing leaves an orphan blob.
- No transcoding. Videos play in the format they were uploaded in. MOV may not play in every browser; MP4 (H.264) is the safest.
- Planned next: subscriptions feed, watch history, dislikes.
