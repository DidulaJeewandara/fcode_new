# LinkedIn Clone MVP — Instructions

## 1. Project Overview

A LinkedIn-style social/professional networking app built for a time-limited coding competition. It covers authentication, editable profiles (skills/education/experience), a connection & follow system with live status, a post feed (create/edit/delete, images, likes, comments, share), notifications, and basic 1:1 messaging — all as a REST API with a React frontend.

## 2. Technology Stack

**Frontend**: React, Vite, JavaScript, Tailwind CSS, React Router, Axios
**Backend**: Node.js, Express.js, JavaScript
**Database**: SQLite, accessed via Prisma ORM
**Auth**: JWT (jsonwebtoken) + bcrypt password hashing
**Uploads**: Multer (local disk storage, served statically)

## 3. Prerequisites

- Node.js v18+ and npm v9+
- No external database needed — SQLite runs as a local file, no separate DB server to install.

## 4. Installation Commands

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 5. Environment Variables

Both apps read config from a `.env` file. Example files are provided — copy them if `.env` doesn't already exist:

**`backend/.env`** (copy from `backend/.env.example`)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_this_secret"
JWT_EXPIRES_IN="7d"
PORT=5000
```

**`frontend/.env`** (copy from `frontend/.env.example`)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

> Both `backend/.env` and `frontend/.env` are already present in this project for convenience — you only need to copy the `.env.example` files if you ever delete them or start fresh.

## 6. Database Setup

From `backend/`:

```bash
npx prisma migrate dev
npx prisma generate
```

This creates `backend/prisma/dev.db` and applies all migrations (users, skills, education, experience, connections, follows, posts, likes, comments, notifications, conversations, messages).

## 7. Seed Database

From `backend/`:

```bash
npm run seed
```

Creates 3 demo users with profiles (skills/education/experience), an accepted connection, a pending connection request, follows, 3 posts with likes/comments, matching notifications, and a sample conversation — so the app looks populated on first login.

> To fully reset to this clean seeded state at any time: `npx prisma migrate reset --force` (re-applies all migrations and re-seeds automatically).

## 8. Start the Backend

From `backend/`:

```bash
npm run dev
```

Runs on **http://localhost:5000**. Uploaded images are served statically from `http://localhost:5000/uploads/...`.

## 9. Start the Frontend

From `frontend/` (in a separate terminal):

```bash
npm run dev
```

Runs on **http://localhost:5173**.

## 10. Demo Accounts

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |

Alice and Bob are already connected; Carol has a pending connection request to Alice, ready to Accept/Reject on first login.

## 11. API Overview

All endpoints are under `http://localhost:5000/api`. Except auth register/login, every route requires `Authorization: Bearer <token>`.

**Auth**
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

**Users / Profile**
- `GET /users` — list other users
- `GET /users/search?q=&page=&limit=` — search by name/headline/skill, paginated
- `GET /users/:id` — full profile (skills, education, experience, connectionCount, postCount)
- `PUT /users/me` — edit own profile
- `POST /users/me/profile-picture` — multipart image upload
- `GET /users/:userId/connection-status` — `NOT_CONNECTED | PENDING | CONNECTED | SELF`
- `POST/DELETE /users/:userId/follow`, `GET /users/:userId/followers`, `GET /users/:userId/following`
- Skills: `POST/DELETE /users/me/skills[/:skillId]`
- Education: `POST/DELETE /users/me/education[/:educationId]`
- Experience: `POST/DELETE /users/me/experience[/:experienceId]`

**Connections**
- `POST /connections/:userId`, `PATCH /connections/:requestId/accept`, `PATCH /connections/:requestId/reject`, `DELETE /connections/:userId`, `GET /connections`, `GET /connections/requests`

**Posts**
- `GET /posts?page=&limit=` — paginated feed
- `POST /posts` — multipart, fields `content` + optional `image`
- `GET /posts/:postId`, `PUT /posts/:postId` (owner only), `DELETE /posts/:postId` (owner only)
- `POST/DELETE /posts/:postId/like`, `POST /posts/:postId/share`
- `GET /posts/:postId/comments?page=&limit=`, `POST /posts/:postId/comments`

**Notifications**
- `GET /notifications?page=&limit=` — returns `{ notifications, unreadCount, ... }`
- `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

**Conversations & Messages**
- `POST /conversations` — body `{ userId }`, starts or reuses a 1:1 conversation
- `GET /conversations` — list with last message
- `GET /conversations/:id/messages?page=&limit=`, `POST /conversations/:id/messages`

All error responses use the shape `{ "message": "..." }` with a matching HTTP status (400 validation, 401 auth, 403 authorization, 404 not found, 409 conflict/duplicate, 500 unexpected).

## 12. Feature Checklist

| Area | Status |
|---|---|
| Register / Login / Logout | ✅ |
| JWT auth + protected routes | ✅ |
| Password hashing (bcrypt) | ✅ |
| View / edit profile, profile picture | ✅ |
| Skills / Education / Experience (add, delete own, view) | ✅ |
| Profile stats (connections, posts) | ✅ |
| Search users (name/headline/skill, paginated) | ✅ |
| Send / accept / reject / remove connection | ✅ |
| Live connection status on profile | ✅ |
| Follow / unfollow | ✅ |
| Create / edit / delete own post | ✅ |
| Post images | ✅ |
| Feed (paginated) | ✅ |
| Likes (no duplicates) | ✅ |
| Comments (paginated) | ✅ |
| Share (link copy + share count) | ✅ |
| Notifications (request, accept, like, comment) | ✅ |
| Messaging (conversations, messages, authorization) | ✅ |

## 13. How to Manually Test the Application

### Quick evaluator demo flow

1. **Register or log in** — open http://localhost:5173, either register a new account or log in as `alice@example.com` / `password123`.
2. **View profile** — click your name in the navbar to see the profile page (skills, education, experience, connection/post counts).
3. **Search another user** — click **Search**, type `bob` or `designer` or `react`.
4. **Send a connection request** — from the search results or Bob's profile, click **Connect**.
5. **Log in as another user** — log out, log in as `bob@example.com` / `password123`.
6. **Accept the connection** — open **My Network → Requests**, click **Accept**.
7. **Create a post** — on the home feed, type an update (optionally attach an image) and click **Post**.
8. **Like the post** — as a different user, click **Like** on a feed post.
9. **Comment** — click **Comment**, type a reply, click **Send**.
10. **View notification** — the bell icon shows an unread badge; open it to see "X liked/commented on your post."
11. **Send a message** — from a user's profile click **Message**, or open **Messages**, type and **Send**.
12. **View feed** — the home page (`/`) shows the paginated post feed with like/comment/share counts.

### Additional checks worth trying

- Try to edit/delete another user's post, skill, education, or experience entry — should be blocked with a 403-driven error message in the UI.
- Send the same connection request twice — second attempt is rejected as a duplicate.
- Like the same post twice — second attempt is rejected as a duplicate.
- Log out and try to visit `/` directly — redirected to `/login` (protected route).
- Submit the register form with a bad email or a password under 6 characters — inline validation error, no request sent for empty fields.

## 14. Known Limitations

- Messaging and notifications are REST-based (polled), not real-time — no WebSockets, as scoped for this MVP.
- "Share" copies a link and increments a share counter; it does not create a repost in the feed.
- Posts are a single global feed (not filtered to your network) — this keeps the MVP simple for demo purposes.
- No pagination on skills/education/experience lists (they're expected to stay small per profile).
- No password reset / email verification flow.
- No rate limiting — not needed for a local competition demo.
