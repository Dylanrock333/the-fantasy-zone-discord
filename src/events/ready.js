// On login: log the bot's tag and make sure every guild has current leaderboard and trade-compare panels.
const { Events } = require("discord.js");
const { syncLeaderboardPanelForAllGuilds } = require("../features/leaderboard/panel");
const { logger } = require("../utils/logger");
const { ensureTradePanelForAllGuilds } = require("../features/tradeCompare/panelSetup");
const { ensureTeamPickerPanelForAllGuilds } = require("../features/onboarding/panelSetup");
const { ensureMemberGroupsForAllGuilds } = require("../features/onboarding/channels");

const name = Events.ClientReady;
const once = true; // only on the first login

// Posts or refreshes each guild's standing panels (they may be stale or missing after a restart),
// and self-heals private channels for anyone already linked.
async function execute(client) {
  logger.info(`Logged in as ${client.user.tag}`);
  await syncLeaderboardPanelForAllGuilds(client);
  await ensureTradePanelForAllGuilds(client);
  await ensureTeamPickerPanelForAllGuilds(client);
  await ensureMemberGroupsForAllGuilds(client);
}

module.exports = { name, once, execute };
