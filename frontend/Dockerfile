# Build stage: install dependencies and build the Vite app
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage: serve the build output with Nginx
FROM nginx:alpine
# Copy Vite build output (dist) to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 