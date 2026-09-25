// Tuesday weekly recap: power-rankings image plus league summary, posted to each guild's weekly-reports channel.
const { getGuildConfig } = require("../config");
const { getWeeklyRecap } = require("../utils/fantasyBotClient");
const { sendChunked } = require("../utils/chunkedSend");
const { base64ToAttachment } = require("../utils/imageUtils");
const { forEachGuild } = require("../utils/forEachGuild");

// Posts the power-rankings image (if fantasy-bot produced one) and the summary to the guild's weekly-reports channel.
async function postWeeklyRecap(client, guildId) {
  const config = getGuildConfig(guildId, "weeklyReportsChannelId");
  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const { week, league_summary, power_rankings, power_ranking_image_base64 } =
    await getWeeklyRecap(config.leagueId);

  if (power_ranking_image_base64) {
    const attachment = base64ToAttachment(power_ranking_image_base64, `week-${week}-power-rankings.png`);
    await channel.send({ files: [attachment] });
  }

  await sendChunked(channel, `**Week ${week} League Summary**\n${league_summary}`);

  return { week, teamCount: power_rankings.length };
}

// Runs the recap for every configured guild (cron).
async function postWeeklyRecapForAllGuilds(client) {
  await forEachGuild(client, postWeeklyRecap, "Weekly recap");
}

module.exports = { postWeeklyRecap, postWeeklyRecapForAllGuilds };
