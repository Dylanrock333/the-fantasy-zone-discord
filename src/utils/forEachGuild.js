// Shared per-guild loop used by the *ForAllGuilds job helpers.
const { GUILDS } = require("../config");
const { logger } = require("./logger");

// Runs fn(client, guildId) for each configured guild; one guild's failure is logged and doesn't stop the rest.
async function forEachGuild(client, fn, label) {
  for (const guildId of Object.keys(GUILDS)) {
    try {
      await fn(client, guildId);
    } catch (err) {
      logger.error(`${label} failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { forEachGuild };
