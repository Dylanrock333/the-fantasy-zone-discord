// Per-guild panel picks not yet searched; selects update this, only Search renders results.
const pendingByGuild = new Map();
const getPending = (guildId) => pendingByGuild.get(guildId) || {};
const setPending = (guildId, updates) => pendingByGuild.set(guildId, { ...getPending(guildId), ...updates });

module.exports = { getPending, setPending };
