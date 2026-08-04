# Estapa 1: Construcción (Build)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL por defecto si Render no pasa la variable en el ARG
ARG NEXT_PUBLIC_API_URL=https://testscrapingmunicipio.onrender.com/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Etapa 2: Servidor de Producción (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_API_URL=https://testscrapingmunicipio.onrender.com/api

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
