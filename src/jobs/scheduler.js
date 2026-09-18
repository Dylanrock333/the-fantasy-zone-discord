const cron = require("node-cron");
const { logger } = require("../utils/logger");
const { postWeeklyRecapForAllGuilds } = require("./weeklyRecap");
const { postMatchupPreviewForAllGuilds } = require("./matchupPreview");

// "0 0 * * 2" = every Tuesday at 00:00 - i.e. right after Monday Night
// Football wraps, before the new week's games start.
const WEEKLY_RECAP_CRON = "0 0 * * 2";

// "0 17 * * 4" = every Thursday at 17:00 Central - ahead of Thursday Night
// Football kickoff.
const MATCHUP_PREVIEW_CRON = "0 17 * * 4";
const MATCHUP_PREVIEW_TZ = "America/Chicago";

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
