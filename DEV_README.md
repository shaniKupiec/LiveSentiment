# Developer Quick Reference

This guide is for developers working on the LiveSentiment project. It summarizes the most common commands and workflows.

---

## 1. Docker Compose (Full Stack)

### Production Mode (Current Setup)
- **Start all services (backend, frontend, db):**
  ```sh
  docker-compose up --build
  ```
  Use this when you want to test the complete integration or simulate production environment.

- **Stop all services:**
  ```sh
  docker-compose down
  ```

### Development Mode (Live Reload)
- **Start all services with live reload:**
  ```sh
  docker-compose -f docker-compose.dev.yml up --build
  ```
  This enables hot reloading for both frontend and backend. Changes will be reflected immediately without rebuilding containers.

- **Stop development services:**
  ```sh
  docker-compose -f docker-compose.dev.yml down
  ```

**Key differences in development mode:**
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:5000` (dotnet watch)
- Code changes are reflected immediately
- No need to rebuild containers for code changes

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

## 7. API Usage Examples

### Creating Questions via Swagger

The API provides a Swagger interface at `http://localhost:5000/swagger` for testing endpoints.

#### Endpoint
**POST** `/api/presentations/{presentationId}/questions`

#### Example JSON Bodies

**1. Multiple Choice (Single Answer)**
```json
{
  "text": "What is your role in the organization?",
  "type": 1,
  "configuration": {
    "options": ["Student", "Teacher", "Administrator", "Other"],
    "allowOther": false
  },
  "enableTextAnalysis": false,
  "enableSentimentAnalysis": false,
  "enableEmotionAnalysis": false,
  "enableKeywordExtraction": false,
  "order": 1
}
```

**2. Open-Ended with NLP Analysis**
```json
{
  "text": "What feedback do you have about the presentation?",
  "type": 6,
  "configuration": {
    "maxLength": 500,
    "minLength": 10,
    "placeholder": "Please share your thoughts..."
  },
  "enableTextAnalysis": true,
  "enableSentimentAnalysis": true,
  "enableEmotionAnalysis": true,
  "enableKeywordExtraction": true,
  "order": 2
}
```

**3. Word Cloud**
```json
{
  "text": "What words come to mind when you think of this topic?",
  "type": 7,
  "configuration": {
    "maxWords": 3,
    "minWordLength": 2,
    "placeholder": "Enter 1-3 words"
  },
  "enableTextAnalysis": true,
  "enableSentimentAnalysis": true,
  "enableEmotionAnalysis": false,
  "enableKeywordExtraction": true,
  "order": 3
}
```

**4. Numeric Rating**
```json
{
  "text": "Rate the presentation from 1-10",
  "type": 3,
  "configuration": {
    "minValue": 1,
    "maxValue": 10,
    "stepSize": 1,
    "labels": {
      "1": "Very Poor",
      "5": "Average",
      "10": "Excellent"
    }
  },
  "enableTextAnalysis": false,
  "enableSentimentAnalysis": false,
  "enableEmotionAnalysis": false,
  "enableKeywordExtraction": false,
  "order": 4
}
```

**5. Yes/No Question**
```json
{
  "text": "Did you find this presentation helpful?",
  "type": 4,
  "configuration": {},
  "enableTextAnalysis": false,
  "enableSentimentAnalysis": false,
  "enableEmotionAnalysis": false,
  "enableKeywordExtraction": false,
  "order": 5
}
```

#### Question Types Reference
- `1` = MultipleChoiceSingle
- `2` = MultipleChoiceMultiple  
- `3` = NumericRating
- `4` = YesNo
- `5` = SliderScale
- `6` = OpenEnded
- `7` = WordCloud

#### Important Notes
- **NLP Features**: Only text-based questions (type 6=OpenEnded, type 7=WordCloud) can have NLP enabled
- **Configuration**: The `configuration` field varies by question type and contains type-specific settings
- **Order**: If set to 0, it will be auto-assigned
- **Authentication**: You need to be logged in (include your JWT token in the Authorization header)

---

## 8. Troubleshooting
- If ports are in use, stop other services or change the port in config files.
- If you change dependencies, rebuild containers: `docker-compose build`.
- If you change environment variables, restart containers: `docker-compose down && docker-compose up`.

---

Happy coding! 