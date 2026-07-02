# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/web
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3001
CMD ["pnpm", "start"]
