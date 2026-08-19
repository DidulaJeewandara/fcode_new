# LinkedIn Clone MVP

A LinkedIn-style social/professional networking app built for a time-limited coding competition.

## Features

- Authentication (register, login, JWT, protected routes)
- Profiles (edit, profile picture, skills, education, experience, stats)
- Connections (search, request, accept/reject, remove, live status)
- Follow / unfollow (independent of connections)
- Posts (create, edit, delete, image upload, feed, like, comment, share)
- Notifications (connection requests/accepts, likes, comments)
- 1:1 messaging (REST-based conversations)

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT + bcrypt

## Structure

```
/
  frontend/   React app (Vite)
  backend/    Express API (Prisma + SQLite)
  README.md
  instruction.md
  requirements.txt
```

See [instruction.md](./instruction.md) for full setup, run, and testing instructions — including the demo accounts and a step-by-step evaluator walkthrough.
