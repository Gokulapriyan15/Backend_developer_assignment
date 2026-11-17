# Session Booking API

REST API for a platform where teachers publish sessions, users book them, and completed sessions show up in the user's history.

Stack: Node.js · TypeScript · Express · MongoDB · Mongoose · Zod (request validation)

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB 4.4+ (local install or MongoDB Atlas)

### Install & run

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # development (auto-reload)
```

Production build:

```bash
npm run build
npm start
```

The server starts on `http://localhost:5000` by default. Check `GET /health` to confirm it is up.

### Environment variables

| Variable      | Required | Default       | Description               |
| ------------- | -------- | ------------- | ------------------------- |
| `MONGODB_URI` | Yes      | -             | MongoDB connection string |
| `PORT`        | No       | `5000`        | HTTP port                 |
| `NODE_ENV`    | No       | `development` | Runtime environment       |

---

## Project structure

```
src/
├── config/          # env loading, database connection
├── models/          # Mongoose schemas (User, Teacher, Session)
├── validators/      # Zod schemas for body / params / query
├── services/        # business logic + aggregation pipelines
├── controllers/     # parse request -> call service -> send response
├── routes/          # route definitions
├── middlewares/     # centralized error handling, 404 handler
├── utils/           # ApiError, asyncHandler, date helpers
├── app.ts           # Express app setup
└── server.ts        # entry point (DB connect, listen, graceful shutdown)
```

How a request flows: route → controller (validates input) → service (business rules, DB) → controller (response) . Any error thrown along the way goes to the centralized `errorHandler`.

---

## API

All responses use the same shape:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

| #   | Method  | Endpoint                                     | Description                                  |
| --- | ------- | -------------------------------------------- | -------------------------------------------- |
| 1   | `POST`  | `/users`                                     | Create a user (email must be unique)         |
| -   | `POST`  | `/teachers`                                  | Create a teacher (helper for testing)        |
| 2   | `POST`  | `/sessions`                                  | Create a session for a teacher               |
| 3   | `GET`   | `/sessions/available?dateTimestamp={ts}`     | AVAILABLE sessions on a date (aggregation)   |
| 4   | `POST`  | `/sessions/:id/book`                         | Book a session                               |
| 5   | `PATCH` | `/sessions/:id/complete`                     | Mark a booked session as completed           |
| 6   | `GET`   | `/users/:id/sessions`                        | User's upcoming + completed (aggregation)    |

### 1. Create user: `POST /users`

```json
{ "fullName": "Jane Doe", "email": "jane@example.com", "phone": "+919876543210" }
```

`201` created · `400` validation error · `409` email already exists

### Create teacher: `POST /teachers`

This endpoint is not one of the six required APIs. It exists so sessions can be created without inserting teachers into the database by hand.

```json
{ "fullName": "Dr. John Smith", "email": "john@example.com", "specialization": "Mathematics", "experience": 8 }
```

`201` created · `400` validation error · `409` email already exists

### 2. Create session: `POST /sessions`

```json
{ "teacherId": "<teacherId>", "startTime": "2026-12-01T10:00:00Z", "endTime": "2026-12-01T11:00:00Z" }
```

`startTime` and `endTime` accept an ISO-8601 string or a Unix timestamp in milliseconds. Status defaults to `AVAILABLE`.

`201` created · `400` validation error / `endTime` not after `startTime` · `404` teacher not found

### 3. Available sessions: `GET /sessions/available?dateTimestamp=1796083200000`

Returns all `AVAILABLE` sessions whose `startTime` falls on the same **UTC calendar day** as `dateTimestamp`, sorted by `startTime`, with teacher details joined in. `dateTimestamp` may be in milliseconds or seconds.

Pipeline: `$match (status + day range) → $sort → $lookup teacher → $unwind → $project`

`200` ok · `400` missing / invalid `dateTimestamp`

### 4. Book session: `POST /sessions/:id/book`

```json
{ "userId": "<userId>" }
```

`200` booked · `400` invalid id · `404` user or session not found · `409` session is not `AVAILABLE`

### 5. Complete session: `PATCH /sessions/:id/complete`

Sets `status = COMPLETED` and `completedAt = now`.

`200` completed · `400` invalid id · `404` session not found · `409` session is not `BOOKED`

### 6. User sessions: `GET /users/:id/sessions`

```json
{
  "success": true,
  "data": {
    "upcomingSessions": [ /* BOOKED, sorted by startTime asc */ ],
    "completedSessions": [ /* COMPLETED, sorted by completedAt desc */ ]
  }
}
```

Pipeline: `$match (userId) → $lookup teacher → $unwind → $project → $facet { upcoming, completed }`

`200` ok · `400` invalid id · `404` user not found

---

## Design notes

- **No double booking:** booking and completing each run as a single atomic `findOneAndUpdate` that includes the expected status in the filter (`{ _id, status: AVAILABLE }`). If two requests try to book the same session at once, only one matches. The other gets `409`.
- **Validation:** every body, param and query value is checked with Zod before it reaches the service layer. Invalid ObjectIds are rejected with `400` instead of causing Mongoose cast errors.
- **Centralized errors:** `ApiError`, Zod errors, Mongoose validation/cast errors, duplicate-key errors (`11000`) and malformed JSON are all mapped to consistent HTTP responses in `middlewares/error.middleware.ts`. Unexpected errors return `500` and are logged.
- **Indexes:** `{ status, startTime }` for the available-sessions query and `{ userId, status }` for the user-history query. `email` has a unique index on users.

---

## Postman

Import `postman/Session-Booking-API.postman_collection.json`. Run the collection top to bottom, either manually or with the Collection Runner. Created `userId`, `teacherId` and `sessionId` values are stored in collection variables automatically, and every request includes test assertions. Change the `baseUrl` variable if the server isn't on `localhost:5000`.
