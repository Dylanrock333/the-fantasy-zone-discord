require("dotenv/config");
const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const path = require("node:path");
const { logger } = require("./utils/logger");

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

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

  const route = DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
    : Routes.applicationCommands(DISCORD_CLIENT_ID);

  await rest.put(route, { body });
  logger.info(`Deployed ${body.length} command(s)${DISCORD_GUILD_ID ? " to guild" : " globally"}.`);
}

main().catch((err) => {
  logger.error("Failed to deploy commands:", err);
  process.exit(1);
});
