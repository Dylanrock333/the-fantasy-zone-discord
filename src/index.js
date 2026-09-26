// Bot entry point: loads handlers, logs in, and starts the scheduled jobs.
require("dotenv/config");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { logger } = require("./utils/logger");
const {
  loadCommands,
  loadEvents,
  loadButtonHandlers,
  loadModalHandlers,
  loadSelectHandlers,
} = require("./utils/loaders");
const { startScheduledJobs } = require("./utils/scheduler");
const { env, requireEnv } = require("./config");

requireEnv("DISCORD_TOKEN");

// Guilds for channels/interactions; GuildMessages + MessageContent to read chat messages.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  // Message/Channel partials so messageDelete still fires for the trade
  // compare panel if it ages out of discord.js's message cache.
  partials: [Partials.Message, Partials.Channel],
});

// Filled by loadCommands; interactionCreate looks slash commands up here by name.
client.commands = new Collection();

// Loads every handler before logging in so no interaction arrives unhandled, then starts the cron jobs.
async function main() {
  // customId -> handler maps that interactionCreate routes to
  client.buttons = await loadButtonHandlers();
  client.modals = await loadModalHandlers();
  client.selects = await loadSelectHandlers();

  await loadCommands(client);
  await loadEvents(client);

  await client.login(env.DISCORD_TOKEN);
  startScheduledJobs(client);
}

main().catch((err) => {
  logger.error("Failed to start bot:", err);
  process.exit(1);
});
