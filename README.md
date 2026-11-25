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
uploads/     Uploaded video files (local disk, gitignored)
```

## 1. Prerequisites

- **Node 22.13+** (required by Expo SDK 58; Node 20 prints warnings and may break `expo start`)
- A **MongoDB** database. The free MongoDB Atlas cluster works.
- An **ImageKit** account (free tier). You need the URL endpoint, public key and private key, from Dashboard → Developer options.
- For mobile: the **Expo Go** app on your phone, or the iOS Simulator / Android Emulator.

## 2. Setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local       # fill in MongoDB + ImageKit + JWT_SECRET
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
- **Upload:** the thumbnail goes **straight from the client to ImageKit**, using signed params from `GET /api/imagekit-auth`. The video file streams to `POST /api/videos` and is written to `uploads/` (MP4/WebM/MOV, at most 500 MB).
- **Playback:** `GET /api/videos/:id/stream` supports HTTP Range requests (206), so seeking works on web, iOS and Android.
- **Likes / subscriptions:** idempotent toggles backed by unique compound indexes, with denormalised counters (`likeCount`, `subscriberCount`, `commentCount`).
- **ImageKit transforms:** cards use `w-640,h-360`, the player poster uses `w-1280,h-720`, and avatars use `fo-face,r-max`.

### API

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` | – | Returns `{ user, token }` and sets the cookie |
| `GET /api/auth/me` · `PATCH /api/auth/me` · `POST /api/auth/logout` | ✓ for PATCH | Current user / change avatar / sign out |
| `GET /api/imagekit-auth` | ✓ | Signed ImageKit upload params |
| `GET /api/videos?cursor=` · `POST /api/videos` | ✓ for POST | Paginated feed / multipart upload |
| `GET /api/videos/:id` · `POST /api/videos/:id/view` | – | Details (+ `likedByMe`, `subscribedToOwner`) / count a view |
| `GET /api/videos/:id/stream` | – | Range-aware video stream |
| `POST /api/videos/:id/like` | ✓ | Toggle like |
| `GET/POST /api/videos/:id/comments` · `DELETE /api/comments/:id` | ✓ for writes | Comments |
| `POST /api/channels/:id/subscribe` | ✓ | Toggle subscription (not to yourself) |

## 5. Scripts

`npm run typecheck` · `npm run lint` · `npm run build` (web production build)

## Known limits and next iterations

- Videos are stored on local disk, which doesn't persist on serverless hosts like Vercel. Move them to S3/R2/ImageKit before deploying.
- No transcoding. Videos play in the format they were uploaded in. MOV may not play in every browser; MP4 (H.264) is the safest.
- Planned next: search, channel pages, subscriptions feed, watch history, dislikes.
