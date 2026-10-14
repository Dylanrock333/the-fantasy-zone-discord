// Cron schedules for the weekly recap and matchup preview jobs.
const cron = require("node-cron");
const { logger } = require("../utils/logger");
const { settings } = require("../config");
const { postWeeklyRecapForAllGuilds } = require("./weeklyRecap");
const { postMatchupPreviewForAllGuilds } = require("./matchupPreview");

// Cron expressions and shared timezone from config/default.js.
const { weeklyRecapCron, matchupPreviewCron, scheduleTz } = settings.schedules;

// Registers both cron jobs; failures are logged, never thrown.
function startScheduledJobs(client) {
  cron.schedule(
    weeklyRecapCron,
    () => {
      logger.info("Running scheduled weekly recap...");
      postWeeklyRecapForAllGuilds(client).catch((err) =>
        logger.error("Scheduled weekly recap failed:", err)
      );
    },
    { timezone: scheduleTz }
  );

  cron.schedule(
    matchupPreviewCron,
    () => {
      logger.info("Running scheduled matchup preview...");
      postMatchupPreviewForAllGuilds(client).catch((err) =>
        logger.error("Scheduled matchup preview failed:", err)
      );
    },
    { timezone: scheduleTz }
  );
}

module.exports = { startScheduledJobs };
