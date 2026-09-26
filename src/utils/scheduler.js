// Cron schedules for the weekly recap and matchup preview jobs.
const cron = require("node-cron");
const { logger } = require("./logger");
const { settings } = require("../config");
const { postWeeklyRecapForAllGuilds } = require("../jobs/weeklyRecap");
const { postMatchupPreviewForAllGuilds } = require("../jobs/matchupPreview");

// Cron expressions from config/default.js; only the preview has an explicit timezone.
const { weeklyRecapCron, matchupPreviewCron, matchupPreviewTz } = settings.schedules;

// Registers both cron jobs; failures are logged, never thrown.
function startScheduledJobs(client) {
  cron.schedule(weeklyRecapCron, () => {
    logger.info("Running scheduled weekly recap...");
    postWeeklyRecapForAllGuilds(client).catch((err) =>
      logger.error("Scheduled weekly recap failed:", err)
    );
  });

  cron.schedule(
    matchupPreviewCron,
    () => {
      logger.info("Running scheduled matchup preview...");
      postMatchupPreviewForAllGuilds(client).catch((err) =>
        logger.error("Scheduled matchup preview failed:", err)
      );
    },
    { timezone: matchupPreviewTz }
  );
}

module.exports = { startScheduledJobs };
