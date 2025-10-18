# Environment Variables Setup

This document explains how to set up environment variables for the LiveSentiment application.

## Development Setup

### 1. Create .env file
Create a `.env` file in the project root directory with the following content:

```env
# API Keys for Development
GROQ_API_KEY=your-actual-groq-api-key-here
HUGGINGFACE_API_KEY=your-actual-huggingface-api-key-here

# Database Configuration (for local development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=livesentiment
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration (for local development)
JWT_KEY=your-super-secret-key-with-at-least-32-characters-for-jwt-signing
JWT_ISSUER=LiveSentiment
JWT_AUDIENCE=LiveSentiment
```

### 2. Get API Keys

#### Groq API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and replace `your-actual-groq-api-key-here` in your `.env` file

#### HuggingFace API Key
1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Sign up or log in
3. Create a new token with "Read" permissions
4. Copy the token and replace `your-actual-huggingface-api-key-here` in your `.env` file

### 3. Run Development Environment
```bash
docker-compose -f docker-compose.dev.yml up --build
```

The application will automatically load the `.env` file and use the API keys for development.

## Production Setup (Render.com)

### Environment Variables in Render Dashboard
Add the following environment variables in your Render dashboard:

#### Backend Service Environment Variables:
```
GROQ_API_KEY=your-actual-groq-api-key-here
HUGGINGFACE_API_KEY=your-actual-huggingface-api-key-here
JWT_KEY=your-super-secret-key-with-at-least-32-characters-for-jwt-signing
JWT_ISSUER=LiveSentiment
JWT_AUDIENCE=LiveSentiment
ASPNETCORE_ENVIRONMENT=Production
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=your-production-db-name
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_SSL_MODE=Require
```

## Configuration Files

### appsettings.json
- Contains default configuration for production
- Includes JWT settings, logging, and API key placeholders
- Used as base configuration

### appsettings.Development.json
- Contains development-specific settings
- Includes local database connection string
- Overrides production settings for development

### Removed Files
- `appsettings.NLP.json` - Consolidated into main appsettings files

## Security Notes

1. **Never commit your `.env` file** - It contains sensitive API keys
2. **Use strong JWT keys** - Generate a secure random string for production
3. **Rotate API keys regularly** - Especially if they're compromised
4. **Use different keys for development and production** - Never use production keys in development

## Troubleshooting

### API Keys Not Working
1. Verify the API keys are correct in your `.env` file
2. Check that the `.env` file is in the project root directory
3. Ensure the API keys have the correct permissions
4. Check the application logs for authentication errors

### Database Connection Issues
1. Verify database credentials in your `.env` file
2. Ensure PostgreSQL is running on the specified port
3. Check that the database exists and is accessible

### JWT Authentication Issues
1. Verify JWT configuration in your `.env` file
2. Ensure the JWT key is at least 32 characters long
3. Check that issuer and audience match between client and server
