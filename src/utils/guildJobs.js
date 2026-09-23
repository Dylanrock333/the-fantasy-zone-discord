// Shared per-guild loop used by the *ForAllGuilds job helpers.
const { SERVERS } = require("../config/servers");
const { logger } = require("./logger");

// Runs fn(client, guildId) for each configured guild; one guild's failure is logged and doesn't stop the rest.
async function runForAllGuilds(client, fn, label) {
  for (const guildId of Object.keys(SERVERS)) {
    try {
      await fn(client, guildId);
    } catch (err) {
      logger.error(`${label} failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { runForAllGuilds };
