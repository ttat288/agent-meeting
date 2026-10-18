# Agent Meeting cho server công ty: không tunnel, chạy sau reverse proxy (xem docs/DEPLOY.md)
FROM node:22-alpine
WORKDIR /app
COPY package.json LICENSE ./
COPY bin ./bin
COPY src ./src
ENV NODE_ENV=production PORT=3000
# Thư mục cho biên bản (bật bằng -e AGENT_MEETING_MINUTES_DIR=/data và gắn volume)
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null || exit 1
CMD ["node", "bin/cli.js", "--local", "--no-open"]
