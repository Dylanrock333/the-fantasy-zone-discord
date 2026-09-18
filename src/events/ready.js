const { Events } = require("discord.js");
const { logger } = require("../utils/logger");
const { ensurePanelForAllGuilds } = require("../features/tradeCompare/bootstrap");

const name = Events.ClientReady;
const once = true;

async function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);
  await ensurePanelForAllGuilds(client);
}

module.exports = { name, once, execute };
