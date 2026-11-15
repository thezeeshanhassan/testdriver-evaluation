# TaskFlow — TestDriver evaluation

A small Next.js task manager built to evaluate [TestDriver.ai](https://testdriver.ai), an AI code reviewer that runs each pull request in a sandbox.

## Features

- List, add, edit, complete and delete tasks
- Title validation (required, 3–80 chars, no duplicates) on both client and API
- Loading, empty and error states; duplicate-submit protection
- Search and sort (newest, oldest, A–Z)
- Dashboard layout with sidebar, stat cards and light/dark theme
- Filter by status (all / pending / completed)
- Task stats (total, pending, completed)
- In-memory API at `/api/tasks` (resets on server restart)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.
