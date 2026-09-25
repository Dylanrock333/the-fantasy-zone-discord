// On login: log the bot's tag and make sure every guild has a current leaderboard panel.
const { Events } = require("discord.js");
const { syncLeaderboardPanelForAllGuilds } = require("../features/leaderboard/panel");
const { logger } = require("../utils/logger");
const { ensureTradePanelForAllGuilds } = require("../features/tradeCompare/panelSetup");

const name = Events.ClientReady;
const once = true;

async function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);
  await syncLeaderboardPanelForAllGuilds(client);
  await ensureTradePanelForAllGuilds(client);
}

module.exports = { name, once, execute };
