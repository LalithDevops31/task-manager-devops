# Task Manager — DevOps Practice App

A simple full-stack Task Manager built for practising DevOps and SRE skills.

## Stack
- **Backend**: Node.js + Express (REST API, port 3001)
- **Frontend**: React + Vite (port 5173)

## Running locally

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint      | Description       |
|--------|---------------|-------------------|
| GET    | /tasks        | List all tasks    |
| GET    | /tasks/:id    | Get single task   |
| POST   | /tasks        | Create task       |
| PUT    | /tasks/:id    | Update task       |
| DELETE | /tasks/:id    | Delete task       |
| GET    | /health       | Health check      |

## DevOps Phases
- [ ] Phase 2 — Git
- [ ] Phase 3 — Docker
- [ ] Phase 4 — Jenkins CI
- [ ] Phase 5 — Kubernetes on EKS + ArgoCD
- [ ] Phase 6 — Prometheus + Grafana
- [ ] Phase 7 — OpenTelemetry + ELK
- [ ] Phase 8 — Terraform
