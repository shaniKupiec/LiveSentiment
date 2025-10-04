# 🚀 LiveSentiment Render.com Deployment Guide

## Prerequisites
- GitHub repository with your LiveSentiment code
- Render.com account (free)
- Basic understanding of environment variables

## Step-by-Step Deployment

### 1. Push Your Code to GitHub
```bash
# Make sure all your changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin deploy  # or your branch name
```

**Note**: You can deploy from any branch. When creating services on Render, select your branch (e.g., `deploy`) instead of `main`.

### 2. Create Render.com Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 3. Create PostgreSQL Database
1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `livesentiment-db`
   - **Database**: `livesentiment`
   - **User**: `livesentiment_user`
   - **Plan**: Free
4. Click **"Create Database"**
5. **Save the connection string** - you'll need it later!

### 4. Deploy Backend Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `livesentiment-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Branch**: `deploy` (or your branch name)
   - **Plan**: Free
5. Add Environment Variables:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://0.0.0.0:10000
   DB_HOST=dpg-d3fp6evfte5s73dcjbd0-a
   DB_PORT=5432
   DB_NAME=livesentiment_db
   DB_USER=livesentiment_db_user
   DB_PASSWORD=[Your database password from Render]
   DB_SSL_MODE=Require
   Jwt__Key=[Generate a secure random key - at least 32 characters]
   Jwt__Issuer=LiveSentiment
   Jwt__Audience=LiveSentiment
   ```
6. Click **"Create Web Service"**

### 5. Deploy Frontend Service
1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `livesentiment-frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Branch**: `deploy` (or your branch name)
   - **Plan**: Free
5. Add Environment Variables:
   ```
   VITE_API_URL=https://livesentiment-backend.onrender.com
   ```
6. Click **"Create Web Service"**

### 6. Configure Custom Domain (Optional)
1. Go to your frontend service settings
2. Click **"Custom Domains"**
3. Add your domain (if you have one)
4. Update DNS records as instructed

## Environment Variables Reference

### Backend Environment Variables
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

### Frontend Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://livesentiment-backend.onrender.com` |

## Deployment Process
1. **Build**: Render builds your Docker containers
2. **Database Migration**: Backend runs migrations automatically
3. **Health Check**: Render verifies services are running
4. **SSL**: Automatic HTTPS certificates
5. **Deploy**: Services go live

## Monitoring Your Deployment

### Health Checks
- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: `https://your-frontend.onrender.com`

### Logs
- View logs in Render dashboard
- Monitor for errors and performance

### Free Tier Limitations
- **Sleep Mode**: Services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes ~30 seconds
- **Database**: 1GB storage, 1 month retention
- **Bandwidth**: 100GB/month

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Dockerfile paths and dependencies
2. **Database Connection**: Verify connection string format
3. **Environment Variables**: Ensure all required variables are set
4. **CORS Issues**: Check API URL configuration

### Debugging Steps
1. Check Render logs for errors
2. Verify environment variables
3. Test health endpoints
4. Check database connectivity

## Post-Deployment Testing
1. **Health Check**: Visit `/api/health` endpoint
2. **Authentication**: Test signup/login flow
3. **Database**: Create a test presentation
4. **Frontend**: Verify UI loads correctly

## Next Steps
After successful deployment:
1. Test all existing features
2. Monitor performance and logs
3. Plan SignalR implementation
4. Consider upgrading to paid plan for production use

## Support
- Render Documentation: [render.com/docs](https://render.com/docs)
- Render Community: [community.render.com](https://community.render.com)
- Your deployment URLs will be:
  - Backend: `https://livesentiment-backend.onrender.com`
  - Frontend: `https://livesentiment-frontend.onrender.com`
