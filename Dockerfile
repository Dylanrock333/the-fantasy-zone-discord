# Production image: installs runtime dependencies, re-registers slash
# commands, then starts the bot. APP_ENV, DISCORD_TOKEN, DISCORD_CLIENT_ID
# and FANTASY_AGENT_URL are supplied at runtime.
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p data
CMD ["sh", "-c", "npm run deploy-commands && npm start"]
