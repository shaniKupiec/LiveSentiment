# LiveSentiment Project

This project is a real-time sentiment and polling platform with:
- **Backend:** ASP.NET Core (C#) with SignalR
- **Frontend:** React + TypeScript + MUI (Vite)
- **Database:** PostgreSQL
- **Containerization:** Docker Compose

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v20.19+ recommended for Vite)
- [.NET SDK 8.0](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for running containers)

---

## 1. Running with Docker Compose (Recommended for full stack)

This will start the backend, frontend, and database together.

```sh
# From the project root
# Build and start all services

docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/swagger/index.html](http://localhost:5000/swagger/index.html)
- pgAdmin: [http://localhost:5050/browser/](http://localhost:5050/browser/)

To stop:
```sh
docker-compose down
```

---

## 2. Running Frontend for Development (Hot Reload)

```sh
cd frontend
npm install        # Only needed once
npm run dev        # Starts Vite dev server at http://localhost:5173
```

- The dev server supports hot module reload for fast development.
- The dev server runs on port 5173 by default (see terminal output).

---

## 3. Running Backend for Development

```sh
cd backend
# Restore dependencies (only once)
dotnet restore
# Run the backend
 dotnet run
```

- The backend will run at [http://localhost:5000](http://localhost:5000) by default.
- Update the connection string in `appsettings.Development.json` if you want to use a local DB instead of Docker.

---

## 4. Database
- By default, the database is managed by Docker Compose.
- The schema is initialized from `db/init.sql`.
- For local dev, you can connect to the DB using any PostgreSQL client (host: localhost, port: 5432, user: postgres, password: postgres).

---

## 5. Useful Commands

- Build all containers: `docker-compose build`
- Start all containers: `docker-compose up`
- Stop all containers: `docker-compose down`
- Run frontend dev server: `npm run dev` (in `frontend`)
- Run backend dev server: `dotnet run` (in `backend`)

---

## 6. Notes
- For production, always use Docker Compose to ensure all services are networked correctly.
- For development, you can run frontend and backend separately for faster feedback. 