// On login: log the bot's tag and make sure every guild has a current leaderboard panel.
const { Events } = require("discord.js");
const { ensureLeaderboardPanelForAllGuilds } = require("../jobs/leaderboard");
const { logger } = require("../utils/logger");

const name = Events.ClientReady;
const once = true;

async function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);
  await ensureLeaderboardPanelForAllGuilds(client);
}

module.exports = { name, once, execute };
