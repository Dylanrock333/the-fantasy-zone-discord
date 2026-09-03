require("dotenv/config");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { logger } = require("./utils/logger");
const {
  loadCommands,
  loadEvents,
  loadButtonHandlers,
  loadModalHandlers,
  loadSelectHandlers,
} = require("./utils/loaders");

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
});

client.commands = new Collection();

async function main() {
  client.buttons = await loadButtonHandlers();
  client.modals = await loadModalHandlers();
  client.selects = await loadSelectHandlers();

  await loadCommands(client);
  await loadEvents(client);

  await client.login(DISCORD_TOKEN);
}

main().catch((err) => {
  logger.error("Failed to start bot:", err);
  process.exit(1);
});
