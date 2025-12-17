# ===== STAGE 1 : BUILD =====
FROM node:18 AS builder

WORKDIR /app

# Copier uniquement les fichiers nécessaires pour le cache
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Build de l'application (OBLIGATOIRE pour le pipeline)
RUN npm run build

# ===== STAGE 2 : RUNTIME =====
FROM node:18-slim

WORKDIR /app

# Copier l'app buildée et les dépendances
COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "start"]
