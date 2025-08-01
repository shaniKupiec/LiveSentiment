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

### Database Access
- **pgAdmin:** http://localhost:5050 (admin@admin.com / admin)
- **PostgreSQL:** localhost:5432 (postgres / postgres)
- **Database name:** livesentiment

### Useful PostgreSQL Queries

**Show all databases:**
```sql
SELECT datname FROM pg_database;
```

**Show all tables in current database:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Check which database you're connected to:**
```sql
SELECT current_database();
```

**View table structure:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Presenter';
```

**Basic data queries:**
```sql
-- View all presenters
SELECT * FROM "Presenter";

-- View all presentations with presenter info
SELECT p.*, pr.name as presenter_name 
FROM "Presentation" p 
JOIN "Presenter" pr ON p.presenter_id = pr.id;

-- View active polls
SELECT * FROM "Poll" WHERE active = true;

-- View recent responses
SELECT r.*, p.question 
FROM "Response" r 
JOIN "Poll" p ON r.poll_id = p.id 
ORDER BY r.timestamp DESC 
LIMIT 10;

-- Count responses per poll
SELECT p.question, COUNT(r.id) as response_count 
FROM "Poll" p 
LEFT JOIN "Response" r ON p.id = r.poll_id 
GROUP BY p.id, p.question;
```

**Reset database (if needed):**
```sql
-- Drop all tables (WARNING: This will delete all data!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

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