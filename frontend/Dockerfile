# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---- Development mode ----
FROM base AS dev
WORKDIR /app
COPY . .
EXPOSE 5173
# Run Vite dev server on 0.0.0.0 so host can access
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ---- Production build ----
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build:dev

# ---- Production server ----
FROM nginx:alpine AS prod
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist ./
# Optional: custom Nginx config for SPA routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
