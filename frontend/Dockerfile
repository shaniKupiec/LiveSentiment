# Build stage: install dependencies and build the Vite app
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: serve the build output with Nginx
FROM nginx:alpine
# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext
# Copy Vite build output (dist) to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration template for SPA routing
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Set default backend URL if not provided
ENV BACKEND_URL=https://livesentiment-backend.onrender.com
EXPOSE 80
# Use envsubst to substitute environment variables in nginx config
CMD ["sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"] 