#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Start the application (migrations will be applied automatically)
echo "Starting application..."
exec dotnet LiveSentiment.dll 