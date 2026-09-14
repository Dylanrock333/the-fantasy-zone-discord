const cron = require("node-cron");
const { logger } = require("../utils/logger");
const { postWeeklyRecapForAllGuilds } = require("./weeklyRecap");

// "0 0 * * 2" = every Tuesday at 00:00 - i.e. right after Monday Night
// Football wraps, before the new week's games start.
const WEEKLY_RECAP_CRON = "0 0 * * 2";

function startScheduledJobs(client) {
  cron.schedule(WEEKLY_RECAP_CRON, () => {
    logger.info("Running scheduled weekly recap...");
    postWeeklyRecapForAllGuilds(client).catch((err) =>
      logger.error("Scheduled weekly recap failed:", err)
    );
  });
}

module.exports = { startScheduledJobs };
