# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app

# Build args for env vars
ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY

# Install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build app
COPY . .
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config for React Router
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  gzip on; \
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
  location / { try_files $uri $uri/ /index.html; } \
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
