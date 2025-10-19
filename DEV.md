# 🛠️ LiveSentiment Development Guide

This guide covers everything you need to set up and run LiveSentiment locally for development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **[Node.js](https://nodejs.org/)** (v20.19+ recommended for Vite)
- **[.NET SDK 8.0](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)**
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**
- **[Git](https://git-scm.com/)** (for version control)

### Recommended Tools

- **[Visual Studio Code](https://code.visualstudio.com/)** with extensions:
  - C# Dev Kit
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Docker
- **[Postman](https://www.postman.com/)** (for API testing)
- **[pgAdmin](https://www.pgadmin.org/)** (for database management)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/LiveSentiment.git
cd LiveSentiment
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
# See Environment Variables section below
```

### 3. Start Development Environment

```bash
# Start all services with live reload (Recommended)
docker-compose -f docker-compose.dev.yml up --build

# Or start production-like environment
docker-compose up --build
```

### 4. Access the Application

- **Frontend**: [http://localhost:5173](http://localhost:5173) (dev) or [http://localhost:3000](http://localhost:3000) (prod)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Database Admin**: [http://localhost:5050](http://localhost:5050) (admin@admin.com / admin)

## 🔧 Environment Variables

### Required API Keys

#### **Groq API Key**
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file


### Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# ===========================================
# API Keys for Development
# ===========================================
GROQ_API_KEY=your-actual-groq-api-key-here

# ===========================================
# Database Configuration (for local development)
# ===========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=livesentiment
DB_USER=postgres
DB_PASSWORD=postgres

# ===========================================
# JWT Configuration (for local development)
# ===========================================
JWT_KEY=your-super-secret-key-with-at-least-32-characters-for-jwt-signing
JWT_ISSUER=LiveSentiment
JWT_AUDIENCE=LiveSentiment

# ===========================================
# Frontend Configuration
# ===========================================
VITE_API_URL=http://localhost:5000
```

## 🐳 Docker Development

### Development Mode (Recommended)

**Start all services with live reload:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Stop development services:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Key differences in development mode:**
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:5000` (dotnet watch)
- Code changes are reflected immediately
- No need to rebuild containers for code changes

### Production Mode

**Start all services (backend, frontend, db):**
```bash
docker-compose up --build
```

**Stop all services:**
```bash
docker-compose down
```

Use this when you want to test the complete integration or simulate production environment.

## 💻 Local Development (Without Docker)

### Hybrid Development Approach (Best of Both Worlds)

For active development, you can run services locally for faster feedback:

#### **Terminal 1: Start Database**
```bash
docker-compose up db pgadmin
```

#### **Terminal 2: Start Backend**
```bash
cd backend
dotnet restore
dotnet run
```

#### **Terminal 3: Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Individual Service Setup

#### **Frontend Development**

```bash
cd frontend

# Install dependencies (first time or after adding new packages)
npm install

# Start Vite dev server (hot reload)
npm run dev
```

- Runs on `http://localhost:5173` with hot reload
- Much faster feedback loop for UI changes
- Better debugging with browser dev tools

#### **Backend Development**

```bash
cd backend

# Restore .NET dependencies (first time or after adding new packages)
dotnet restore

# Run backend in development mode
dotnet run
```

- Runs on `http://localhost:5000`
- Hot reload for code changes
- Better debugging with breakpoints
- Faster compilation

#### **Database Setup**

```bash
# Keep PostgreSQL and pgAdmin in Docker
docker-compose up db pgadmin
```

- Easy to reset/rebuild when needed
- Consistent database state
- Access via pgAdmin at `http://localhost:5050`

## 🗄️ Database Management

### Database Access

- **pgAdmin**: [http://localhost:5050](http://localhost:5050) (admin@admin.com / admin)
- **PostgreSQL**: localhost:5432 (postgres / postgres)
- **Database name**: livesentiment

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

-- View active questions
SELECT * FROM "Question" WHERE is_live = true;

-- View recent responses
SELECT r.*, q.text as question_text 
FROM "Response" r 
JOIN "Question" q ON r.question_id = q.id 
ORDER BY r.timestamp DESC 
LIMIT 10;
```

**Reset database (if needed):**
```sql
-- Drop all tables (WARNING: This will delete all data!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Entity Framework Core Migrations

**Add a migration:**
```bash
cd backend
dotnet ef migrations add <MigrationName>
```

**Apply migrations:**
```bash
cd backend
dotnet ef database update
```

**Remove last migration:**
```bash
cd backend
dotnet ef migrations remove
```

## 🔍 Debugging

### Backend Debugging

#### **Visual Studio Code**
1. Install C# Dev Kit extension
2. Open the backend folder
3. Set breakpoints in your code
4. Press F5 to start debugging

#### **Command Line Debugging**
```bash
cd backend
dotnet run --configuration Debug
```

### Frontend Debugging

#### **Browser DevTools**
1. Open browser developer tools (F12)
2. Use React Developer Tools extension
3. Set breakpoints in JavaScript/TypeScript
4. Use console.log for debugging

#### **Vite DevTools**
- Hot Module Replacement (HMR) for instant updates
- Source maps for debugging
- Error overlay for runtime errors

### Database Debugging

#### **pgAdmin**
1. Access [http://localhost:5050](http://localhost:5050)
2. Login with admin@admin.com / admin
3. Navigate to your database
4. Use Query Tool for SQL debugging

#### **Entity Framework Logging**
Add to `appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### **Port Already in Use**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change ports in configuration files
```

#### **Database Connection Issues**
1. Ensure PostgreSQL is running: `docker-compose up db`
2. Check connection string in `.env` file
3. Verify database credentials
4. Check if database exists

#### **API Key Issues**
1. Verify API keys are correct in `.env` file
2. Check API key permissions
3. Ensure `.env` file is in project root
4. Restart services after changing environment variables

#### **Frontend Build Issues**
```bash
cd frontend

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force
```

#### **Backend Build Issues**
```bash
cd backend

# Clear build artifacts
dotnet clean
dotnet restore
dotnet build

# Clear NuGet cache
dotnet nuget locals all --clear
```

### Performance Issues

#### **Slow API Responses**
1. Check database query performance
2. Enable Entity Framework query logging
3. Check for N+1 query problems
4. Optimize database indexes

#### **Frontend Performance**
1. Use React DevTools Profiler
2. Check for unnecessary re-renders
3. Optimize bundle size
4. Use lazy loading for components

## 📁 Project Structure

```
LiveSentiment/
├── backend/                 # ASP.NET Core API
│   ├── Controllers/         # API controllers
│   ├── Services/           # Business logic services
│   ├── Models/             # Data models and DTOs
│   ├── Data/               # Entity Framework context
│   ├── Migrations/         # Database migrations
│   ├── Hubs/               # SignalR hubs
│   └── Program.cs          # Application entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── package.json        # Dependencies and scripts
├── db/                     # Database initialization
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
└── .env.example           # Environment variables template
```

## 🔄 Development Workflow

### 1. **Feature Development**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test locally
# Commit changes
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature-name
```

### 2. **Database Changes**
```bash
# Add migration
cd backend
dotnet ef migrations add YourMigrationName

# Update database
dotnet ef database update

# Commit migration files
git add Migrations/
git commit -m "Add database migration"
```

### 3. **API Development**
1. Define models in `Models/` folder
2. Create controllers in `Controllers/` folder
3. Add services in `Services/` folder
4. Test with Swagger UI
5. Update frontend API service

### 4. **Frontend Development**
1. Create components in `components/` folder
2. Add pages in `pages/` folder
3. Update types in `types/` folder
4. Test with hot reload
5. Update API integration

## 📚 Useful Commands

### Docker Commands
```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

### Backend Commands
```bash
# Restore packages
dotnet restore

# Build project
dotnet build

# Run project
dotnet run

# Run tests
dotnet test

# Add migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## 🔧 Configuration Files

### Backend Configuration
- `appsettings.json` - Production settings
- `appsettings.Development.json` - Development settings
- `Program.cs` - Application configuration
- `Startup.cs` - Service configuration

### Frontend Configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `eslint.config.js` - ESLint configuration

### Docker Configuration
- `docker-compose.yml` - Production services
- `docker-compose.dev.yml` - Development services
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container

## 🚀 Deployment

### Local Production Test
```bash
# Build and run production containers
docker-compose up --build

# Test production build
curl http://localhost:5000/api/health
```

### Environment Variables for Production
See [README.md](./README.md) for deployment instructions and environment variable configuration.

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Standards

- Follow existing code patterns and conventions
- Add proper TypeScript types for frontend changes
- Include error handling and validation
- Write comprehensive tests for new features
- Update documentation for significant changes


---

**For feature documentation, see [FEATURES.md](./FEATURES.md)**
