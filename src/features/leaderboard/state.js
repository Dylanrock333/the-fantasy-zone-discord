// Per-guild panel picks not yet searched; selects update this, only Search renders results.
// guildId -> { position, sortBy, size }. In memory only, so picks reset on restart.
const pendingByGuild = new Map();
// Current picks for a guild ({} if none yet).
const getPending = (guildId) => pendingByGuild.get(guildId) || {};
// Merges new picks into the guild's existing ones.
const setPending = (guildId, updates) => pendingByGuild.set(guildId, { ...getPending(guildId), ...updates });

module.exports = { getPending, setPending };
