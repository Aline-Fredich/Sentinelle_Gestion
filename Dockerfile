# ==============================================================================
# SENTINEL GESTION — Dockerfile de Production Multi-Stage
# Image ultra-légère (Alpine Linux), sécurisée (non-root) et optimisée (Standalone)
# ==============================================================================

# Étape 1 : Image de base Alpine
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Étape 2 : Dépendances
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Étape 3 : Compilation (Builder)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true

RUN npm run build

# Étape 4 : Image d'Exécution Minimale (Runner)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Création d'un groupe et utilisateur système sans privilèges root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copie des fichiers publics et des artefacts compilés
COPY --from=builder /app/public ./public

# Configuration des permissions pour le cache Next.js
RUN mkdir .next && chown nextjs:nodejs .next

# Copie de la version standalone et des assets statiques
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Sonde de santé intégrée au conteneur Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
