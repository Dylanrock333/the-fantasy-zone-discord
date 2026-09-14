const { SERVERS } = require("../config/servers");
const { getWeeklyRecap } = require("../utils/fantasyAgentClient");
const { splitMessage } = require("../utils/splitMessage");
const { logger } = require("../utils/logger");

// Posts one matchup-recap message per matchup, then a final league-summary
// message, into the given guild's configured weekly-reports channel.
async function postWeeklyRecap(client, guildId) {
  const config = SERVERS[guildId];
  if (!config) throw new Error(`No server config for guild ${guildId}`);
  if (!config.weeklyReportsChannelId) {
    throw new Error(`No weeklyReportsChannelId configured for guild ${guildId}`);
  }

  const channel = await client.channels.fetch(config.weeklyReportsChannelId);
  const { week, matchup_recaps, league_summary } = await getWeeklyRecap(config.leagueId);

  await channel.send(`**Week ${week} Recaps**`);
  for (const m of matchup_recaps) {
    const header = `**${m.home_team} vs ${m.away_team}** — winner: ${m.winner}`;
    for (const chunk of splitMessage(`${header}\n${m.recap}`)) {
      await channel.send(chunk);
    }
  }

  for (const chunk of splitMessage(`**League Summary**\n${league_summary}`)) {
    await channel.send(chunk);
  }

  return { week, matchupCount: matchup_recaps.length };
}

// Runs the recap for every configured guild; used by the scheduled cron job.
async function postWeeklyRecapForAllGuilds(client) {
  for (const guildId of Object.keys(SERVERS)) {
    try {
      await postWeeklyRecap(client, guildId);
    } catch (err) {
      logger.error(`Weekly recap failed for guild ${guildId}:`, err);
    }
  }
}

module.exports = { postWeeklyRecap, postWeeklyRecapForAllGuilds };
