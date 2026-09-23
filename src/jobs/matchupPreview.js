// Thursday matchup preview: scoreboard image plus look-ahead summary, posted to each guild's matchup channel.
const { getServerConfig } = require("../config/servers");
const { getMatchupPreview } = require("../utils/fantasyAgentClient");
const { sendChunked } = require("../utils/splitMessage");
const { base64ToAttachment } = require("../utils/imageUtils");
const { runForAllGuilds } = require("../utils/guildJobs");
const { logger } = require("../utils/logger");

// Returns the bot's latest weekly-recap summary text (prior context for the preview), or null.
async function getLastRecapSummary(client, config) {
  if (!config.weeklyReportsChannelId) return null;
  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const messages = await channel.messages.fetch({ limit: 20 });
  const lastSummary = messages.find((m) => m.author.id === client.user.id && m.content);
  return lastSummary ? lastSummary.content : null;
}

// Posts the matchup image (if fantasy-bot produced one) and the preview text to the guild's matchup channel.
async function postMatchupPreview(client, guildId) {
  const config = getServerConfig(guildId, "matchupChannelId");
  const channel = await client.channels.fetch(config.matchupChannelId);

  // Recap context is optional; a failure here shouldn't block the preview.
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

  await sendChunked(channel, `**Week ${week} Matchups Ahead**\n${league_preview}`);

  return { week, matchupCount: matchups.length };
}

// Runs the matchup preview for every configured guild (cron).
async function postMatchupPreviewForAllGuilds(client) {
  await runForAllGuilds(client, postMatchupPreview, "Matchup preview");
}

module.exports = { postMatchupPreview, postMatchupPreviewForAllGuilds };
