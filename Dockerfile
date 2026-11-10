FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN printf 'server {\n    listen 80;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n    location = /healthz { access_log off; default_type text/plain; return 200 "ok\\n"; }\n    location = /index.html { add_header Cache-Control "no-cache"; }\n    location /assets/ { try_files $uri =404; add_header Cache-Control "public, max-age=31536000, immutable"; }\n    location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
