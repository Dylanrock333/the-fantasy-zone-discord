// In-memory session store for the trade-compare panel. No DB exists in this
// bot yet, so a restart loses in-flight picks - panelSetup.js resets the
// standing panel message back to a fresh session automatically on startup.
const { MessageFlags } = require("discord.js");
const { DEFAULT_PROMPT } = require("./panel");

const sessions = new Map(); // messageId -> session
const panelMessageByGuild = new Map(); // guildId -> messageId

// The user-editable part of a session; also what Cancel resets to.
const emptyPicks = () => ({
  teamA: null,
  teamB: null,
  rosterA: null,
  rosterB: null,
  selectedA: [],
  selectedB: [],
  prompt: DEFAULT_PROMPT,
  status: "pickingTeamA",
});

function newSession(config, teams) {
  return {
    guildId: config.guildId,
    channelId: config.tradeCompareChannelId,
    leagueId: config.leagueId,
    teams,
    ...emptyPicks(),
    createdAt: Date.now(),
  };
}

function createSession(messageId, init) {
  const session = { ...init };
  sessions.set(messageId, session);
  return session;
}

function getSession(messageId) {
  return sessions.get(messageId);
}

function updateSession(messageId, patch) {
  const session = sessions.get(messageId);
  if (!session) return null;
  Object.assign(session, patch);
  return session;
}

function deleteSession(messageId) {
  sessions.delete(messageId);
}

function setPanelMessageId(guildId, messageId) {
  panelMessageByGuild.set(guildId, messageId);
}

function findGuildByPanelMessageId(messageId) {
  for (const [guildId, id] of panelMessageByGuild) {
    if (id === messageId) return guildId;
  }
  return undefined;
}

// Wraps a panel handler: looks up the panel's session and replies "expired" if it's gone.
// Pass { ephemeral: true } for handlers (like opening a modal) that can't update the panel message.
function withSession(fn, { ephemeral = false } = {}) {
  return async (interaction) => {
    const session = getSession(interaction.message.id);
    if (session) return fn(interaction, session);

    const content = "This trade panel expired - it'll refresh automatically.";
    if (ephemeral) await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    else await interaction.update({ content, embeds: [], components: [] });
  };
}

module.exports = {
  newSession,
  emptyPicks,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  setPanelMessageId,
  findGuildByPanelMessageId,
  withSession,
};
