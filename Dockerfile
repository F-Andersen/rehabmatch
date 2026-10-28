FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY . .
ARG VITE_CONTACT_EMAIL=""
ARG VITE_CONTACT_PHONE=""
ARG VITE_CONTACT_OFFICE=""
RUN npm run db:generate && npm run build

FROM build AS api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "server"]

FROM nginx:1.28-alpine AS web
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
