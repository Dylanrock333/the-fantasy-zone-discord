// One-off script: registers every slash command in src/commands with each configured guild.
require("dotenv/config");
const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const path = require("node:path");
const { logger } = require("./utils/logger");
const { SERVERS } = require("./config/servers");

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set");
}

async function main() {
  const commandsDir = path.join(__dirname, "commands");
  const files = readdirSync(commandsDir).filter((f) => f.endsWith(".js"));

  const body = [];
  for (const file of files) {
    const { command } = require(path.join(commandsDir, file));
    if (command?.data) body.push(command.data.toJSON());
  }

  const rest = new REST().setToken(DISCORD_TOKEN);
  const guildIds = Object.keys(SERVERS);

  // Guild-scoped commands update instantly (global ones can take an hour), so register per guild.
  for (const guildId of guildIds) {
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId), { body });
    logger.info(`Deployed ${body.length} command(s) to guild ${guildId}.`);
  }
}

main().catch((err) => {
  logger.error("Failed to deploy commands:", err);
  process.exit(1);
});
