# TaskFlow — TestDriver evaluation

A small Next.js task manager built to evaluate [TestDriver.ai](https://testdriver.ai), an AI code reviewer that runs each pull request in a sandbox.

## Features

- List, add, complete and delete tasks
- Filter by status (all / pending / completed)
- Task stats (total, pending, completed)
- In-memory API at `/api/tasks` (resets on server restart)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.
