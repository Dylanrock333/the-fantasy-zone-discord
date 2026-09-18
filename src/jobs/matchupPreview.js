const { SERVERS } = require("../config/servers");
const { getMatchupPreview } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { base64ToAttachment } = require("../utils/imageUtils");
const { logger } = require("../utils/logger");

// Finds the most recent text message this bot posted in the guild's
// weekly-reports channel - i.e. the summary paragraph from the last
// weekly recap - to use as prior context for the matchup preview prompt.
// Returns null if there's no weekly-reports channel configured or no
// matching message.
async function getLastRecapSummary(client, config) {
  if (!config.weeklyReportsChannelId) return null;
  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const messages = await channel.messages.fetch({ limit: 20 });
  const lastSummary = messages.find((m) => m.author.id === client.user.id && m.content);
  return lastSummary ? lastSummary.content : null;
}

// Posts the matchup scoreboard graphic (if fantasy-bot generated one), then
// the look-ahead summary paragraph, into the given guild's configured
// matchup channel. If image generation failed server-side
// (matchup_image_base64 is null), only the paragraph is posted - no text
// fallback for the matchup table.
async function postMatchupPreview(client, guildId) {
  const config = SERVERS[guildId];
  if (!config) throw new Error(`No server config for guild ${guildId}`);
  if (!config.matchupChannelId) {
    throw new Error(`No matchupChannelId configured for guild ${guildId}`);
  }

  const channel = await client.channels.fetch(config.matchupChannelId);

  let previousRecapContext = null;
  try {
    previousRecapContext = await getLastRecapSummary(client, config);
  } catch (err) {
    logger.error(`Fetching last weekly recap message failed for guild ${guildId}, continuing without it:`, err);
  }

  const { week, league_preview, matchups, matchup_image_base64 } =
    await getMatchupPreview(config.leagueId, 0, previousRecapContext);

  if (matchup_image_base64) {
    const attachment = base64ToAttachment(matchup_image_base64, `week-${week}-matchup-preview.png`);
    await channel.send({ files: [attachment] });
  }

  for (const chunk of splitMessage(`**Week ${week} Matchups Ahead**\n${league_preview}`)) {
    await channel.send(chunk);
  }

  return { week, matchupCount: matchups.length };
}

// Runs the matchup preview for every configured guild; used by the
// scheduled cron job.
async function postMatchupPreviewForAllGuilds(client) {
  for (const guildId of Object.keys(SERVERS)) {
    try {
      await postMatchupPreview(client, guildId);
    } catch (err) {
      logger.error(`Matchup preview failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { postMatchupPreview, postMatchupPreviewForAllGuilds };
