const { SERVERS } = require("../config/servers");
const { logger } = require("./logger");

// Runs fn(client, guildId) for every configured guild, logging (and
// continuing past) any per-guild failure. Used by job functions'
// *ForAllGuilds variants, which the scheduled cron jobs call.
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
