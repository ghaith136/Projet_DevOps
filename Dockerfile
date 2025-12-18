# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# Copier seulement les fichiers nécessaires
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Important: Utiliser node directement au lieu de npm start
CMD ["node", "server.js"]
