const cron = require("node-cron");
const { logger } = require("../utils/logger");
const { postWeeklyRecapForAllGuilds } = require("./weeklyRecap");
const { postMatchupPreviewForAllGuilds } = require("./matchupPreview");
const { postInjuryAlertsForAllGuilds } = require("./injuryAlerts");

// "0 0 * * 2" = every Tuesday at 00:00 - i.e. right after Monday Night
// Football wraps, before the new week's games start.
const WEEKLY_RECAP_CRON = "0 0 * * 2";

// "0 17 * * 4" = every Thursday at 17:00 Central - ahead of Thursday Night
// Football kickoff.
const MATCHUP_PREVIEW_CRON = "0 17 * * 4";
const MATCHUP_PREVIEW_TZ = "America/Chicago";

// Every 5 minutes - injury designations aren't anchored to a specific local
// kickoff time the way the matchup preview is, so no timezone option here.
const INJURY_ALERTS_CRON = "*/5 * * * *";

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

  cron.schedule(INJURY_ALERTS_CRON, () => {
    postInjuryAlertsForAllGuilds(client).catch((err) =>
      logger.error("Scheduled injury alerts failed:", err)
    );
  });
}

module.exports = { startScheduledJobs };
