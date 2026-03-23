# Video Session App (React + Material UI + Strapi)

Basic full-stack app where authenticated users watch a video hosted on Google Drive and resume from their saved watch position.

## Stack
- Frontend: React + Vite + Material UI
- Backend: Strapi v4 + Users & Permissions plugin
- DB: SQLite (default)

## Features
- User login with Strapi local auth (`/api/auth/local`)
- Video playback in React
- Progress persistence per user + video
- Resume from last saved timestamp after re-login

## Project Structure
- `backend/`: Strapi API
- `frontend/`: React + Material UI app

## 1) Prerequisites
- Node.js `18.x`, `20.x`, or `22.x`
- npm `>= 8`

## 2) Backend Setup (Strapi)

```bash
cd backend
cp .env.example .env
npm install
npm run develop
```

Then in Strapi Admin (`http://localhost:1337/admin`):

1. Create your admin account.
2. Go to **Content Manager** and create at least one `Video` entry.
3. For each video set:
   - `title` (required)
   - Either `streamUrl` OR `driveFileId`
   - Optional `description`, `durationSeconds`
4. Go to **Settings -> Users & Permissions Plugin -> Roles -> Authenticated** and enable:
   - `video`: `find`, `findOne`
   - `video-progress`: `getMeProgress`, `upsertMeProgress`
5. Create a normal app user at **Content Manager -> User** (or via `/api/auth/local/register`).

## 3) Frontend Setup (React)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## API Endpoints Used
- `POST /api/auth/local` (login)
- `GET /api/videos` (fetch first available video)
- `GET /api/video-progress/me/:videoId` (read current user progress)
- `POST /api/video-progress/me` (upsert progress)

## Google Drive Notes
- If `streamUrl` is set, frontend uses it directly.
- If only `driveFileId` is set, frontend builds:
  - `https://drive.google.com/uc?export=download&id=<FILE_ID>`
- Ensure the Drive file is shared appropriately so the browser can fetch it.

## Progress Payload Shape
`POST /api/video-progress/me`

```json
{
  "videoId": 1,
  "watchedSeconds": 125.32,
  "durationSeconds": 726.5
}
```

The backend computes and stores `completionPercent` and `lastWatchedAt`.

## Important Limitation
Google Drive preview embeds (`/file/d/.../preview`) do not expose reliable playback events to your app. For resume tracking, use a direct playable stream/download URL.
