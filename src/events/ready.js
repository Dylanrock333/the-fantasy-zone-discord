const { Events } = require("discord.js");
const { logger } = require("../utils/logger");

const name = Events.ClientReady;
const once = true;

function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);
}

module.exports = { name, once, execute };
