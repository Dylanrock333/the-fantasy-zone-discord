const { SERVERS } = require("../config/servers");
const { getWeeklyRecap } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { logger } = require("../utils/logger");

// Posts the league-summary paragraph, then the power-ranking table, into the
// given guild's configured weekly-reports channel.
async function postWeeklyRecap(client, guildId) {
  const config = SERVERS[guildId];
  if (!config) throw new Error(`No server config for guild ${guildId}`);
  if (!config.weeklyReportsChannelId) {
    throw new Error(`No weeklyReportsChannelId configured for guild ${guildId}`);
  }

  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const { week, league_summary, power_rankings } = await getWeeklyRecap(config.leagueId);

  for (const chunk of splitMessage(`**Week ${week} League Summary**\n${league_summary}`)) {
    await channel.send(chunk);
  }

  const rankingsText = power_rankings
    .map((r, i) => `**#${i + 1}** ${r.tag} — ${r.team}\n> ${r.blurb}`)
    .join("\n\n");
  for (const chunk of splitMessage(`**🏆 Power Rankings**\n\n${rankingsText}`)) {
    await channel.send(chunk);
  }

  return { week, teamCount: power_rankings.length };
}

// Runs the recap for every configured guild; used by the scheduled cron job.
async function postWeeklyRecapForAllGuilds(client) {
  for (const guildId of Object.keys(SERVERS)) {
    try {
      await postWeeklyRecap(client, guildId);
    } catch (err) {
      logger.error(`Weekly recap failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { postWeeklyRecap, postWeeklyRecapForAllGuilds };
