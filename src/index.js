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
const { startScheduledJobs } = require("./jobs/scheduler");

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN must be set in the environment");
}

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

client.commands = new Collection();

async function main() {
  client.buttons = await loadButtonHandlers();
  client.modals = await loadModalHandlers();
  client.selects = await loadSelectHandlers();

  await loadCommands(client);
  await loadEvents(client);

  await client.login(DISCORD_TOKEN);
  startScheduledJobs(client);
}

main().catch((err) => {
  logger.error("Failed to start bot:", err);
  process.exit(1);
});
