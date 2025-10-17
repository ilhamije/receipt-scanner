# frontend/Dockerfile
# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Suppress npm update notices
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Copy package files
COPY package*.json ./

# Install dependencies (clean + reproducible)
RUN npm ci

# Copy source code
COPY . .

# Build the React app (Vite)
RUN npm run build:dev

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

# Copy build output into standard nginx html dir
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/dev.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]