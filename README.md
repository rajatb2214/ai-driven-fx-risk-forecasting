# Ethara Workbench

Full-stack project and task management assessment app built with zero external dependencies.

## Run

```bash
npm start
```

Open `http://localhost:3000`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@ethara.ai | Admin@123 |
| Manager | manager@ethara.ai | Manager@123 |
| Member | member@ethara.ai | Member@123 |

## Features

- Authentication with login, registration, session tokens, and protected APIs.
- Role-based access control:
  - Admin can create and delete projects/tasks.
  - Manager can create projects/tasks and manage tasks.
  - Member can view visible work and update assigned task status.
- Project management with owner, status, due date, progress, and task totals.
- Task management with project relationship, assignee, priority, status, due date, and status updates.
- Dashboard with totals, completion percentage, overdue work, status chart, priority chart, and upcoming tasks.
- Validation, loading, empty, error, and toast states.
- Responsive UI for desktop and mobile.
- JSON persistence in `data/db.json`.

## REST API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/me`
- `GET /api/users`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Notes

The app uses Node's built-in `http`, `fs`, `path`, and `crypto` modules, so no package installation is required.
