
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

RUN if [ -z "$VITE_API_URL" ] || [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then \
      echo "錯誤：必須提供 VITE_API_URL 和 VITE_GOOGLE_CLIENT_ID"; \
      echo "範例：docker build --build-arg VITE_API_URL=https://xxx --build-arg VITE_GOOGLE_CLIENT_ID=xxx ."; \
      exit 1; \
    fi

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build


FROM nginxinc/nginx-unprivileged:1.28-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
