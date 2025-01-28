# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# docker build --build-arg NEXTAUTH_SECRET=$NEXTAUTH_SECRET --build-arg DATABASE_URL=$DATABASE_URL --build-arg HOST=$HOST -t nom-image .

FROM node:18-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Examples of build args and env
ARG NEXTAUTH_SECRET
ARG DATABASE_URL
ARG HOST
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV HOST=$HOST

FROM base AS deps
# https://github.com/oven-sh/bun/issues/5545 pour bun
RUN apk --no-cache add ca-certificates wget && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk && \
    apk add --no-cache --force-overwrite glibc-2.28-r0.apk && \
    npm i -g bun
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

FROM deps AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]