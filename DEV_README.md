# Developer Quick Reference

This guide is for developers working on the LiveSentiment project. It summarizes the most common commands and workflows.

---

## 1. Docker Compose (Full Stack)

- **Start all services (backend, frontend, db):**
  ```sh
  docker-compose up --build
  ```
  Use this when you want to test the full stack together, or for production-like local testing.

- **Stop all services:**
  ```sh
  docker-compose down
  ```

---

## 2. Frontend Development

- **Install dependencies (first time or after adding new packages):**
  ```sh
  cd frontend
  npm install
  ```

- **Start Vite dev server (hot reload):**
  ```sh
  npm run dev
  ```
  Use this for rapid frontend development. The app will be at http://localhost:5173 (default).

---

## 3. Backend Development

- **Restore .NET dependencies (first time or after adding new packages):**
  ```sh
  cd backend
  dotnet restore
  ```

- **Run backend in development mode:**
  ```sh
  dotnet run
  ```
  The API will be at http://localhost:5000.

---

## 4. Database

- **Database is managed by Docker Compose.**
- To reset the DB, stop all containers, delete the `db_data` Docker volume, and restart Compose.

---

## 5. Entity Framework Core (Backend Migrations)

- **Add a migration:**
  ```sh
  dotnet ef migrations add <MigrationName>
  ```
- **Apply migrations:**
  ```sh
  dotnet ef database update
  ```

---

## 6. When to Use Docker Compose vs. Local Dev Servers

- **Use Docker Compose:**
  - When you want to test the full stack (frontend, backend, db) together.
  - For production or staging deployments.

- **Use local dev servers:**
  - When actively developing frontend or backend for faster feedback (hot reload, breakpoints, etc).
  - You can run the frontend and backend outside Docker, but the database is easiest to manage with Docker Compose.

---

## 7. Troubleshooting
- If ports are in use, stop other services or change the port in config files.
- If you change dependencies, rebuild containers: `docker-compose build`.
- If you change environment variables, restart containers: `docker-compose down && docker-compose up`.

---

Happy coding! 