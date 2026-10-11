FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@10.9.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN npm install -g pnpm@10.9.0 && mkdir /data && chown node:node /data
COPY --from=build --chown=node:node /app /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/exam-studio.db
USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
