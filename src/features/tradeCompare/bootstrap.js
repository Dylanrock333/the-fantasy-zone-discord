// Posts and recovers the standing trade-compare panel - no slash command
// ever creates it. Called once per guild at startup, and again by
// events/messageDelete.js if someone deletes the panel message.
const { SERVERS } = require("../../config/servers");
const { getLeagueTeams } = require("../../utils/fantasyAgentClient");
const { createSession, setPanelMessageId } = require("./state");
const { renderPanel, PANEL_MARKER, DEFAULT_PROMPT } = require("./panel");
const { logger } = require("../../utils/logger");

// How far back to look for an already-posted panel when recovering after a
// restart. A dedicated, low-traffic fantasy channel comfortably fits this;
// in a very high-traffic channel the panel could scroll past this window
// and get duplicated - an accepted limitation for this MVP.
const HISTORY_SCAN_LIMIT = 50;

async function findExistingPanel(channel, botId) {
  const fetched = await channel.messages.fetch({ limit: HISTORY_SCAN_LIMIT });
  return fetched.find((m) => m.author.id === botId && m.embeds[0]?.footer?.text === PANEL_MARKER);
}

function freshSessionInit(config, teams) {
  return {
    guildId: config.guildId,
    channelId: config.tradeCompareChannelId,
    leagueId: config.leagueId,
    teams,
    teamA: null,
    teamB: null,
    rosterA: null,
    rosterB: null,
    selectedA: [],
    selectedB: [],
    prompt: DEFAULT_PROMPT,
    status: "pickingTeamA",
    createdAt: Date.now(),
  };
}

async function ensurePanel(client, guildId) {
  const config = SERVERS[guildId];
  if (!config?.tradeCompareChannelId || config.tradeCompareChannelId.startsWith("TEMP_")) {
    logger.warn(`Trade compare: no real tradeCompareChannelId configured for guild ${guildId}, skipping panel`);
    return null;
  }

  const channel = await client.channels.fetch(config.tradeCompareChannelId);
  const { teams } = await getLeagueTeams(config.leagueId);
  const init = freshSessionInit({ ...config, guildId }, teams);

  const existing = await findExistingPanel(channel, client.user.id);
  if (existing) {
    const session = createSession(existing.id, init);
    await existing.edit(renderPanel(session));
    setPanelMessageId(guildId, existing.id);
    return existing.id;
  }

  const posted = await channel.send(renderPanel(init));
  createSession(posted.id, init);
  setPanelMessageId(guildId, posted.id);
  return posted.id;
}

async function ensurePanelForAllGuilds(client) {
  for (const guildId of Object.keys(SERVERS)) {
    try {
      await ensurePanel(client, guildId);
    } catch (err) {
      logger.error(`Trade compare: failed to ensure panel for guild ${guildId}:`, err);
    }
  }
}

module.exports = { ensurePanel, ensurePanelForAllGuilds };
