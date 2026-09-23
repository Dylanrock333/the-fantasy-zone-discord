// Cron schedules for the weekly recap and matchup preview jobs.
const cron = require("node-cron");
const { logger } = require("../utils/logger");
const { postWeeklyRecapForAllGuilds } = require("./weeklyRecap");
const { postMatchupPreviewForAllGuilds } = require("./matchupPreview");

// Tuesday 00:00, after Monday Night Football.
const WEEKLY_RECAP_CRON = "0 0 * * 2";

// Thursday 17:00 Central, before Thursday Night Football.
const MATCHUP_PREVIEW_CRON = "0 17 * * 4";
const MATCHUP_PREVIEW_TZ = "America/Chicago";

// Registers both cron jobs; failures are logged, never thrown.
function startScheduledJobs(client) {
  cron.schedule(WEEKLY_RECAP_CRON, () => {
    logger.info("Running scheduled weekly recap...");
    postWeeklyRecapForAllGuilds(client).catch((err) =>
      logger.error("Scheduled weekly recap failed:", err)
    );
  });

  cron.schedule(
    MATCHUP_PREVIEW_CRON,
    () => {
      logger.info("Running scheduled matchup preview...");
      postMatchupPreviewForAllGuilds(client).catch((err) =>
        logger.error("Scheduled matchup preview failed:", err)
      );
    },
    { timezone: MATCHUP_PREVIEW_TZ }
  );
}

module.exports = { startScheduledJobs };
