# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE=/v1
ARG VITE_KAKAO_CLIENT_ID=
ARG VITE_KAKAO_REDIRECT_URI=

ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_KAKAO_CLIENT_ID=${VITE_KAKAO_CLIENT_ID}
ENV VITE_KAKAO_REDIRECT_URI=${VITE_KAKAO_REDIRECT_URI}

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location /v1/ {\n\
        proxy_pass http://backend:8080/v1/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
