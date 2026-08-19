# Setup & Run Instructions

## 1. Prerequisites

- Node.js v18+ and npm v9+
- No external database needed — SQLite runs as a local file.

## 2. Installation

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 3. Database Setup

From `backend/`:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

This creates `backend/prisma/dev.db` and seeds 3 demo users.

## 4. Start the Backend

From `backend/`:

```bash
npm run dev
```

Runs on **http://localhost:5000**.

## 5. Start the Frontend

From `frontend/` (in a separate terminal):

```bash
npm run dev
```

Runs on **http://localhost:5173**.

## 6. Demo Login Credentials

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |

## 7. API Base URL

`http://localhost:5000/api`

Configured in `frontend/.env` as `VITE_API_BASE_URL`. Uploaded files (profile pictures) are served statically from `http://localhost:5000/uploads/...`.

## 8. Basic Testing Instructions

### Auth flow

1. Open http://localhost:5173 — you should be redirected to `/login`.
2. Log in with one of the demo credentials above, or register a new account at `/register`.
3. On success you land on the dashboard showing your name, headline, and a "People you may know" list.
4. Click **Logout** to clear the session and return to `/login`.

### Profile flow

1. Click your name in the navbar (or the welcome card on the dashboard) to open your own profile at `/profile/:id`.
2. Click **Edit profile** to go to `/profile/edit`. Update name, headline, about, and location, then **Save changes**.
3. Use **Change photo** to upload a profile picture (multer stores it under `backend/uploads/profile-pictures/`, served at `/uploads/profile-pictures/<file>`).
4. Add/remove **Skills** (tag chips with an add form), **Education**, and **Experience** entries from your own profile — the add/delete controls only appear on your own profile.
5. From the dashboard, click another user in "People you may know" to view their profile. Edit/add/delete controls are hidden on other users' profiles, confirming read-only access.
6. Connection count is now live (post count stays `0` until posts are implemented).

### Connections, follow & search flow

1. Go to **Search** in the navbar, search by name, headline, or skill (e.g. `designer`, `react`). Results are paginated 10 per page — use Previous/Next.
2. On a search result or another user's profile, the relationship button reflects live state:
   - **Connect** — no relationship yet → sends a request.
   - **Pending** — you already sent a request (disabled).
   - **Accept** / **Reject** — shown when the other user sent *you* a request.
   - **Connected** — request accepted; click it to remove the connection.
   - A separate **Follow** / **Unfollow** button is always available independent of connection status.
   - You never see a Connect/Follow button on your own profile.
3. Go to **My Network** in the navbar to see two tabs: **My Connections** (accepted, with a Remove button) and **Requests** (pending incoming, with Accept/Reject).
4. Try it with the seeded users: log in as Alice, search for "Bob", click **Connect**. Log out, log in as Bob, open **My Network → Requests**, click **Accept**. Log back in as Alice — Bob now shows **Connected** and appears under **My Connections**.

### Notifications flow

1. The bell icon in the navbar shows an unread-count badge and opens a dropdown with your latest notifications. Unread ones are highlighted; clicking one marks it read. **Mark all as read** clears the badge. **View all notifications** opens the full `/notifications` page (paginated, 20 per page).
2. Notifications are created automatically for: someone sending you a connection request, someone accepting your connection request, someone liking your post, someone commenting on your post. You never get a notification for liking/commenting on your own post.
3. Quick test with seeded users: log in as Alice, send Bob a connection request → log in as Bob, see the "Alice Johnson sent you a connection request" notification in the bell dropdown → Accept it from **My Network → Requests** → log back in as Alice and see "Bob Smith accepted your connection request".
4. Post likes/comments have no feed UI yet, but can be triggered via the API to see notifications fire (see endpoints below).

### Messaging flow

1. Open **Messages** in the navbar, or click **Message** on another user's profile (this starts/opens a conversation with them).
2. The left panel lists your conversations; select one to load its message history on the right. Type in the input and click **Send**.
3. Users can only read or send messages in conversations they are a participant of (enforced server-side, returns 403 otherwise).
4. Quick test: log in as Alice, go to Bob's profile, click **Message**, send "Hi Bob!". Log in as Bob, open **Messages**, see Alice's conversation and reply.

### API endpoints (all under `/api`, all require `Authorization: Bearer <token>` unless noted)

**Auth**
- `POST /auth/register` — body: `{ "name", "email", "password" }`
- `POST /auth/login` — body: `{ "email", "password" }`
- `GET /auth/me`

**Users / Profile**
- `GET /users` — list all other users (id, name, headline, profilePicture)
- `GET /users/search?q=&page=1&limit=10` — search by name, headline, or skill name; paginated, returns `{ users, page, limit, total, totalPages }`
- `GET /users/:id` — full profile: user fields + skills + education + experience + connectionCount + postCount
- `PUT /users/me` — update own profile — body: any of `{ "name", "headline", "bio", "location" }`
- `POST /users/me/profile-picture` — multipart form field `profilePicture` (image, max 5MB)
- `GET /users/:userId/connection-status` — returns `{ status: "NOT_CONNECTED" | "PENDING" | "CONNECTED" | "SELF", ... }` (PENDING also includes `direction` + `requestId`; CONNECTED includes `connectionId`)

**Follow** (independent of connections)
- `POST /users/:userId/follow`
- `DELETE /users/:userId/follow`
- `GET /users/:userId/followers`
- `GET /users/:userId/following`

**Connections**
- `POST /connections/:userId` — send a request (409 if already pending/connected, 400 if targeting yourself)
- `PATCH /connections/:requestId/accept` — only the receiver can accept
- `PATCH /connections/:requestId/reject` — only the receiver can reject
- `DELETE /connections/:userId` — remove an existing accepted connection
- `GET /connections` — the current user's accepted connections
- `GET /connections/requests` — pending requests sent *to* the current user

**Skills**
- `POST /users/me/skills` — body: `{ "name" }`
- `DELETE /users/me/skills/:skillId` — only the owner can delete (403 otherwise)

**Education**
- `POST /users/me/education` — body: `{ "school", "degree", "fieldOfStudy", "startDate", "endDate" }` (school required, rest optional)
- `DELETE /users/me/education/:educationId` — only the owner can delete (403 otherwise)

**Experience**
- `POST /users/me/experience` — body: `{ "title", "company", "description", "startDate", "endDate" }` (title + company required)
- `DELETE /users/me/experience/:experienceId` — only the owner can delete (403 otherwise)

**Notifications**
- `GET /notifications?page=1&limit=20` — returns `{ notifications, unreadCount, page, limit, total, totalPages }`
- `PATCH /notifications/:id/read` — only the recipient can mark their own notification as read (403 otherwise)
- `PATCH /notifications/read-all` — marks all of the current user's notifications as read

Notification types (auto-created, sender never notified about their own action): `CONNECTION_REQUEST`, `CONNECTION_ACCEPTED`, `POST_LIKE`, `POST_COMMENT`.

**Conversations & Messages** (1:1 only; REST, no WebSockets)
- `POST /conversations` — body: `{ "userId" }`; starts a conversation or returns the existing one between the two users
- `GET /conversations` — the current user's conversations with `otherUser` + `lastMessage`
- `GET /conversations/:id/messages?page=1&limit=20` — only participants can read (403 otherwise)
- `POST /conversations/:id/messages` — body: `{ "content" }`; only participants can send (403 otherwise)

**Posts** (minimal — backend only, no feed UI yet; exists to support like/comment notifications)
- `POST /posts` — body: `{ "content" }`
- `POST /posts/:postId/like` / `DELETE /posts/:postId/like`
- `POST /posts/:postId/comments` — body: `{ "content" }`

### Manual API testing (curl example)

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s http://localhost:5000/api/users/1 -H "Authorization: Bearer $TOKEN"

curl -s -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"headline":"New headline"}'
```
