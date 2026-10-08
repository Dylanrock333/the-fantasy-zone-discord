// Posts and recovers the standing "Pick Your Team" panel - no slash command
// ever creates it. Called once per guild at startup.
const { GUILDS, settings } = require("../../config");
const { renderPanel, PANEL_MARKER } = require("./panel");
const { forEachGuild } = require("../../utils/forEachGuild");
const { logger } = require("../../utils/logger");

// How far back to look for an already-posted panel when recovering after a restart.
const HISTORY_SCAN_LIMIT = settings.panels.teamPickerScanLimit;

// Finds the bot's earlier panel in the channel by its embed footer marker.
async function findExistingPanel(channel, botId) {
  const fetched = await channel.messages.fetch({ limit: HISTORY_SCAN_LIMIT });
  return fetched.find((m) => m.author.id === botId && m.embeds[0]?.footer?.text === PANEL_MARKER);
}

// Reuses the existing panel or posts a new one.
// Returns the panel's message ID, or null if the guild has no team-picker channel configured.
async function ensureTeamPickerPanel(client, guildId) {
  const config = GUILDS[guildId];
  if (!config?.welcomeTeamPickerChannelId) {
    logger.warn(`Team picker: no welcomeTeamPickerChannelId configured for guild ${guildId}, skipping panel`);
    return null;
  }

  const channel = await client.channels.fetch(config.welcomeTeamPickerChannelId);
  const existing = await findExistingPanel(channel, client.user.id);
  if (existing) return existing.id;

  const posted = await channel.send(renderPanel());
  return posted.id;
}

// Runs the panel setup for every configured guild (on startup).
async function ensureTeamPickerPanelForAllGuilds(client) {
  await forEachGuild(client, ensureTeamPickerPanel, "Team picker panel setup");
}

module.exports = { ensureTeamPickerPanel, ensureTeamPickerPanelForAllGuilds };
