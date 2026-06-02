# TeamFlow — Real-Time Team Collaboration Platform

A production-ready, full-stack team collaboration platform with real-time features, role-based access control, Kanban board, team chat, and an AI-powered assistant.

## Features

- **Firebase Authentication** — register, login, logout, session persistence
- **Role-Based Access Control** — Admin, Manager, Member with enforced permissions
- **Project Management** — create, edit, delete, search, and view projects with task stats
- **Kanban Board** — drag-and-drop task management with real-time updates
- **Task Management** — CRUD, assignment, priority, due dates, status tracking
- **Real-Time Chat** — Socket.IO team messaging with typing indicators and online presence
- **Team Overview** — member management, role editing, online status
- **Built-in Assistant** — natural language task management
- **Activity Logs** — track all project and task events
- **Dark Mode** — system-default dark theme
- **Responsive Design** — works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI primitives
- TanStack Query (React Query)
- React Router v6
- @dnd-kit (drag and drop)
- Socket.IO Client
- Firebase Auth SDK
- React Hook Form + Zod

### Backend
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Socket.IO
- Firebase Admin SDK
- Joi validation
- Morgan logger + Helmet security

## Project Structure

```
teamflow/
├── backend/
│   └── src/
│       ├── config/         # DB and Firebase config
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth, role check, validation, error handler
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routers
│       ├── services/       # Activity logging
│       ├── sockets/        # Socket.IO handler
│       ├── validations/    # Joi schemas
│       ├── constants/      # Roles, statuses
│       ├── utils/          # Async handler, API response
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
        ├── api/            # Axios API functions
        ├── components/     # UI components
        ├── contexts/       # Auth and Socket contexts
        ├── hooks/          # React Query hooks
        ├── pages/          # Route pages
        ├── routes/         # Router setup + guards
        ├── services/       # Socket service
        └── types/          # TypeScript types
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster
- Firebase project (Auth enabled)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Fill in all Firebase values in .env
npm install
npm run dev
```

## Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | Frontend URL for CORS |
| `JWT_SECRET` | Secret for JWT (min 32 chars) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |

## API Documentation

### Auth
All protected routes require `Authorization: Bearer <firebase_id_token>`

### Projects
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/projects` | All | List projects |
| POST | `/api/projects` | Admin/Manager | Create project |
| PUT | `/api/projects/:id` | Admin/Manager | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

### Tasks
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/tasks` | All | List tasks |
| POST | `/api/tasks` | Admin/Manager | Create task |
| PUT | `/api/tasks/:id` | All* | Update task |
| DELETE | `/api/tasks/:id` | Admin/Manager | Delete task |

*Members can only update their own tasks' status

### Messages
| Method | Path | Description |
|---|---|---|
| GET | `/api/messages` | Get team messages |
| POST | `/api/messages` | Send message |

### Team
| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/team` | All | Get team info |
| POST | `/api/team/create` | Any | Create team |
| POST | `/api/team/join` | Any | Join team |
| GET | `/api/team/stats` | All | Get team stats |
| PUT | `/api/team/member-role` | Admin | Update role |

## Socket.IO Events

### Client → Server
- `chat:typing_start` — user starts typing
- `chat:typing_stop` — user stops typing
- `task:drag_update` — task dragged to new status

### Server → Client
- `message:new` — new chat message
- `task:created/updated/deleted` — task changes
- `project:created/updated/deleted` — project changes
- `user:online/offline` — presence updates
- `users:online_list` — full online user list
- `chat:typing_start/stop` — typing indicators

## Deployment

### Backend (Render / Railway)
1. Set all environment variables in the dashboard
2. Set build command: `npm install`
3. Set start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set all `VITE_` environment variables
2. Build command: `npm run build`
3. Output directory: `dist`

### Database (MongoDB Atlas)
1. Create a free cluster
2. Whitelist `0.0.0.0/0` for production
3. Copy the connection string to `MONGODB_URI`

## Assumptions

- Teams are isolated — users can only see their own team's data
- The first user to create a team becomes its Admin
- Members can only update status of tasks assigned to them
- The Assistant uses local command parsing (no external AI API)

## Future Improvements

- File attachments in chat
- Email notifications
- GitHub/GitLab integration
- Time tracking per task
- Gantt chart view
- Mobile app (React Native)
- Advanced analytics dashboard
