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

## 6. Recommended Development Approach: Hybrid (Best of Both Worlds)

### **For Active Development: Run Services Locally**

**Frontend (Vite):**
```bash
cd frontend
npm install
npm run dev
```
- Runs on `http://localhost:5173` with hot reload
- Much faster feedback loop for UI changes
- Better debugging with browser dev tools

**Backend (.NET):**
```bash
cd backend
dotnet restore
dotnet run
```
- Runs on `http://localhost:5000`
- Hot reload for code changes
- Better debugging with breakpoints
- Faster compilation

**Database: Use Docker (Recommended)**
```bash
docker-compose up db pgadmin
```
- Keep PostgreSQL and pgAdmin in Docker
- Easy to reset/rebuild when needed
- Consistent database state

### **Quick Start Commands for Development**

For typical development:
```bash
# Terminal 1: Start database
docker-compose up db pgadmin

# Terminal 2: Start backend
cd backend && dotnet run

# Terminal 3: Start frontend  
cd frontend && npm run dev
```

### **When to Use Full Docker Compose**

Use `docker-compose up --build` when:
- Testing the complete integration
- Simulating production environment
- When you need to verify everything works together
- Before committing major changes

### **Why This Hybrid Approach?**

1. **Faster Development**: Local services have much faster hot reload
2. **Better Debugging**: You can set breakpoints and use IDE debugging
3. **Database Consistency**: Docker ensures the database is always in a known state
4. **Flexibility**: You can run just the services you're actively working on

---

## 7. Troubleshooting
- If ports are in use, stop other services or change the port in config files.
- If you change dependencies, rebuild containers: `docker-compose build`.
- If you change environment variables, restart containers: `docker-compose down && docker-compose up`.

---

Happy coding! 