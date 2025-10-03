#!/bin/bash

# LiveSentiment Render.com Deployment Helper Script
echo "🚀 LiveSentiment Render.com Deployment Helper"
echo "=============================================="

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run this from your project root."
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ All code changes committed to git"
echo "2. ✅ Repository pushed to GitHub"
echo "3. ✅ Render.com account created"
echo "4. ✅ PostgreSQL database created on Render"
echo "5. ✅ Environment variables prepared"

echo ""
read -p "Have you completed all the above steps? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the checklist items first, then run this script again."
    exit 1
fi

echo ""
echo "🔧 Generating JWT Secret Key..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "your-super-secret-jwt-key-change-this-in-production")

echo "Generated JWT Secret: $JWT_SECRET"
echo ""
echo "📝 Environment Variables for Backend:"
echo "====================================="
echo "ASPNETCORE_ENVIRONMENT=Production"
echo "ASPNETCORE_URLS=http://0.0.0.0:10000"
echo "ConnectionStrings__DefaultConnection=[Your PostgreSQL connection string from Render]"
echo "Jwt__Key=$JWT_SECRET"
echo "Jwt__Issuer=LiveSentiment"
echo "Jwt__Audience=LiveSentiment"
echo ""
echo "📝 Environment Variables for Frontend:"
echo "======================================"
echo "VITE_API_URL=https://livesentiment-backend.onrender.com"
echo ""
echo "🌐 Your deployment URLs will be:"
echo "Backend:  https://livesentiment-backend.onrender.com"
echo "Frontend: https://livesentiment-frontend.onrender.com"
echo ""
echo "📖 Follow the detailed guide in RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "✅ Ready to deploy! Go to render.com and create your services."
