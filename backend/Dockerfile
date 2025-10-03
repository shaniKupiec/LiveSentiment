# Use official .NET SDK image for build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Install netcat for database connectivity check
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/out ./

# Create a simple startup script for Render
RUN echo '#!/bin/bash\n\
echo "Starting LiveSentiment Backend..."\n\
echo "Waiting for database..."\n\
sleep 5\n\
echo "Running database migrations..."\n\
dotnet LiveSentiment.dll --migrate\n\
echo "Starting application..."\n\
dotnet LiveSentiment.dll' > start.sh && chmod +x start.sh

EXPOSE 10000
CMD ["./start.sh"] 