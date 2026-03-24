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

## API Endpoints Used
- `POST /api/auth/local` (login)
- `GET /api/videos` (fetch first available video)
- `GET /api/video-progress/me/:videoId` (read current user progress)
- `POST /api/video-progress/me` (upsert progress)


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

