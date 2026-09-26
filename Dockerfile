# Production image: installs runtime dependencies only and starts the bot.
# APP_ENV, DISCORD_TOKEN and FANTASY_AGENT_URL are supplied at runtime.
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
CMD ["node", "src/index.js"]
