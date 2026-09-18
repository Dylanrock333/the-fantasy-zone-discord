// In-memory session store for the trade-compare panel. No DB exists in this
// bot yet, so a restart loses in-flight picks - bootstrap.js resets the
// standing panel message back to a fresh session automatically on startup.
const sessions = new Map(); // messageId -> session
const panelMessageByGuild = new Map(); // guildId -> messageId

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

module.exports = {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  setPanelMessageId,
  findGuildByPanelMessageId,
};
