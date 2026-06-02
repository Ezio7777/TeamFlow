# TeamFlow Backend

Express.js + MongoDB REST API with Socket.IO real-time layer.

## Quick Start

```bash
cp .env.example .env
# Fill in your values
npm install
npm run dev
```

## Health Check

```
GET /health
```

## Folder Structure

```
src/
├── config/         # Database + Firebase Admin init
├── constants/      # Roles, task statuses, activity types
├── controllers/    # Business logic per resource
├── middleware/     # auth.js, roleCheck.js, validate.js, errorHandler.js
├── models/         # Mongoose schemas
├── routes/         # Express routers wired to controllers
├── services/       # activityService (fire-and-forget logging)
├── sockets/        # Socket.IO setup and event handlers
├── utils/          # asyncHandler, apiResponse
├── validations/    # Joi schemas
├── app.js          # Express app factory
└── server.js       # HTTP + Socket.IO server entry
```
