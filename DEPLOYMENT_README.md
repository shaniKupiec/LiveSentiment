# 🚀 LiveSentiment Deployment Guide

This document provides a comprehensive guide for deploying the LiveSentiment application to production, including important lessons learned and configuration details.

## Overview

LiveSentiment is deployed on **Render.com** using Docker containers with the following architecture:
- **Backend**: ASP.NET Core 8.0 with PostgreSQL
- **Frontend**: React with Vite
- **Database**: PostgreSQL (Render managed)
- **Real-time**: SignalR (ready for implementation)

## Deployment Architecture

### Services Structure
```
LiveSentiment/
├── backend/          ← Backend service root directory
│   ├── Dockerfile    ← Backend Docker configuration
│   └── ...
├── frontend/         ← Frontend service root directory
│   ├── Dockerfile    ← Frontend Docker configuration
│   └── ...
└── render.yaml       ← Render configuration (optional)
```

## Backend Service Configuration

### Render Service Settings
- **Name**: `livesentiment-backend`
- **Environment**: `Docker`
- **Root Directory**: `backend` ⚠️ **CRITICAL**
- **Dockerfile Path**: `Dockerfile`
- **Docker Build Context Directory**: `.` (dot)
- **Docker Command**: *(leave empty)*
- **Branch**: `deploy`
- **Plan**: `Free`

### Environment Variables
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:10000
DB_HOST=dpg-d3fp6evfte5s73dcjbd0-a
DB_PORT=5432
DB_NAME=livesentiment_db
DB_USER=livesentiment_db_user
DB_PASSWORD=[Your database password]
DB_SSL_MODE=Require
Jwt__Key=[Generate a secure random key - at least 32 characters]
Jwt__Issuer=LiveSentiment
Jwt__Audience=LiveSentiment
```

### Important Backend Notes
- **Individual DB Variables**: Use separate environment variables instead of connection strings
- **Port Configuration**: Uses Render's dynamic port (10000)
- **Database Migrations**: Run automatically on startup
- **CORS Configuration**: Includes frontend domain for production

## Frontend Service Configuration

### Render Service Settings
- **Name**: `livesentiment-frontend`
- **Environment**: `Docker`
- **Root Directory**: `frontend` ⚠️ **CRITICAL**
- **Dockerfile Path**: `Dockerfile`
- **Docker Build Context Directory**: `.` (dot)
- **Docker Command**: *(leave empty)*
- **Branch**: `deploy`
- **Plan**: `Free`

### Environment Variables
```bash
REACT_APP_API_URL=https://livesentiment-backend.onrender.com
```

## Database Configuration

### PostgreSQL Database
- **Name**: `livesentiment-db`
- **Database**: `livesentiment_db`
- **User**: `livesentiment_db_user`
- **Plan**: `Free` (1GB storage, 1 month retention)

### Connection String Format
The application builds connection strings from individual environment variables:
```
Host={DB_HOST};Port={DB_PORT};Database={DB_NAME};Username={DB_USER};Password={DB_PASSWORD};SSL Mode={DB_SSL_MODE};
```

## Critical Deployment Lessons

### 1. Root Directory Configuration
**⚠️ MOST IMPORTANT**: Always set the correct root directory for each service:
- **Backend**: Root Directory = `backend`
- **Frontend**: Root Directory = `frontend`

**Why**: This determines the build context and file paths for Docker builds.

### 2. Connection String Issues
**Problem**: Hardcoded localhost connection strings in `appsettings.json`
**Solution**: Remove hardcoded connection strings and use environment variables

**Before** (❌ Wrong):
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=livesentiment;Username=postgres;Password=postgres"
}
```

**After** (✅ Correct):
```json
"ConnectionStrings": {
}
```

### 3. Environment Variable Priority
The application checks for connection strings in this order:
1. `ConnectionStrings__DefaultConnection` (if exists)
2. Individual `DB_*` variables (preferred method)

### 4. Docker Build Context
- **Root Directory = `backend`**: Dockerfile path = `Dockerfile`
- **Root Directory = `frontend`**: Dockerfile path = `Dockerfile`
- **Build Context**: Automatically set to the root directory

### 5. Port Configuration
- **Backend**: Uses `ASPNETCORE_URLS=http://0.0.0.0:10000`
- **Frontend**: Uses default port 80 (handled by nginx)

## Deployment URLs

After successful deployment:
- **Backend API**: `https://livesentiment-backend.onrender.com`
- **Frontend**: `https://livesentiment-frontend.onrender.com`
- **Health Check**: `https://livesentiment-backend.onrender.com/api/health`

## Free Tier Limitations

### Render Free Tier
- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes ~30 seconds
- **Database**: 1GB storage, 1 month retention
- **Bandwidth**: 100GB/month

### Performance Considerations
- **SignalR**: Will work but may have connection issues during sleep/wake cycles
- **Database**: Limited storage and retention
- **Scaling**: No auto-scaling on free tier

## Troubleshooting

### Common Issues

#### 1. Build Failures
**Error**: `MSB1003: Specify a project or solution file`
**Solution**: Ensure Root Directory is set correctly (`backend` or `frontend`)

#### 2. Database Connection Issues
**Error**: `Failed to connect to 127.0.0.1:5432`
**Solution**: 
- Remove hardcoded connection strings from `appsettings.json`
- Use individual `DB_*` environment variables
- Verify database credentials

#### 3. CORS Issues
**Error**: Frontend can't connect to backend
**Solution**: Add frontend URL to CORS origins in `Startup.cs`

#### 4. Migration Failures
**Error**: Database migration errors
**Solution**: 
- Ensure database is empty and ready
- Check connection string format
- Verify database permissions

### Debug Commands
```bash
# Test database connection
dotnet LiveSentiment.dll --test-db

# Run migrations only
dotnet LiveSentiment.dll --migrate
```

## Production Checklist

### Before Deployment
- [ ] Remove all debug logging and console outputs
- [ ] Set correct Root Directory for each service
- [ ] Configure all environment variables
- [ ] Remove hardcoded connection strings
- [ ] Update CORS origins for production
- [ ] Test locally with production-like configuration

### After Deployment
- [ ] Test health endpoint
- [ ] Verify database connection
- [ ] Test authentication flow
- [ ] Check CORS configuration
- [ ] Monitor logs for errors
- [ ] Test all CRUD operations

## Next Steps

### Phase 2: SignalR Implementation
- Implement real-time question broadcasting
- Add audience response collection
- Test SignalR connectivity in production

### Phase 3: NLP Integration
- Add sentiment analysis services
- Implement real-time result aggregation
- Configure NLP providers (Azure, AWS, or local)

### Phase 4: Production Optimization
- Upgrade to paid Render plan
- Implement Redis for SignalR backplane
- Add monitoring and logging
- Set up CI/CD pipeline

## Support and Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Health Check**: Monitor service status via health endpoints
- **Logs**: Check Render dashboard for detailed logs

## Environment Variables Reference

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Environment setting | `Production` |
| `ASPNETCORE_URLS` | Server binding | `http://0.0.0.0:10000` |
| `DB_HOST` | Database hostname | `dpg-d3fp6evfte5s73dcjbd0-a` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `livesentiment_db` |
| `DB_USER` | Database username | `livesentiment_db_user` |
| `DB_PASSWORD` | Database password | `W1...........` |
| `DB_SSL_MODE` | SSL connection mode | `Require` |
| `Jwt__Key` | JWT secret key | `your-super-secret-key-32-chars-min` |
| `Jwt__Issuer` | JWT issuer | `LiveSentiment` |
| `Jwt__Audience` | JWT audience | `LiveSentiment` |

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://livesentiment-backend.onrender.com` |

---

**Last Updated**: October 2024  
**Deployment Status**: ✅ Backend Deployed, Frontend Ready  
**Next Phase**: SignalR Implementation
