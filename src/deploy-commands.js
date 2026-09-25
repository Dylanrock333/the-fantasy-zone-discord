// One-off script: registers every slash command in src/commands with each guild configured for APP_ENV.
require("dotenv/config");
const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const path = require("node:path");
const { logger } = require("./utils/logger");
const { GUILDS, requireEnv, env } = require("./config");

requireEnv("DISCORD_TOKEN", "DISCORD_CLIENT_ID");

async function main() {
  const commandsDir = path.join(__dirname, "commands");
  const files = readdirSync(commandsDir).filter((f) => f.endsWith(".js"));

  const body = [];
  for (const file of files) {
    const { command } = require(path.join(commandsDir, file));
    if (command?.data) body.push(command.data.toJSON());
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const guildIds = Object.keys(GUILDS);

  // Guild-scoped commands update instantly (global ones can take an hour), so register per guild.
  for (const guildId of guildIds) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), { body });
    logger.info(`Deployed ${body.length} command(s) to guild ${guildId}.`);
  }
}

main().catch((err) => {
  logger.error("Failed to deploy commands:", err);
  process.exit(1);
});
