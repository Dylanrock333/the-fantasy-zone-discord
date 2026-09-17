const { SERVERS } = require("../config/servers");
const { getWeeklyRecap } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { base64ToAttachment } = require("../utils/imageUtils");
const { logger } = require("../utils/logger");

// Posts the power-ranking graphic (if fantasy-bot generated one), then the
// league-summary paragraph, into the given guild's configured
// weekly-reports channel. If image generation failed server-side
// (power_ranking_image_base64 is null), only the paragraph is posted - no
// text fallback for the rankings.
async function postWeeklyRecap(client, guildId) {
  const config = SERVERS[guildId];
  if (!config) throw new Error(`No server config for guild ${guildId}`);
  if (!config.weeklyReportsChannelId) {
    throw new Error(`No weeklyReportsChannelId configured for guild ${guildId}`);
  }

  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const { week, league_summary, power_rankings, power_ranking_image_base64 } =
    await getWeeklyRecap(config.leagueId);

  if (power_ranking_image_base64) {
    const attachment = base64ToAttachment(power_ranking_image_base64, `week-${week}-power-rankings.png`);
    await channel.send({ files: [attachment] });
  }

  for (const chunk of splitMessage(`**Week ${week} League Summary**\n${league_summary}`)) {
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
