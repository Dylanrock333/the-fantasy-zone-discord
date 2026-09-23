// Per-guild config: chat/report/matchup/leaderboard channel IDs and the fantasy-bot league each guild uses.
// TODO: move this to a database once we need more than a couple servers.
const SERVERS = {
  //main
  "1544547612659679294": { channelId: "1544548090025877604", leagueId: 1992397255, weeklyReportsChannelId: "1549139619004686366", matchupChannelId: "1549303658452222003", leaderboardChannelId: "1551612311863558356" , tradeCompareChannelId: ""},
  //test
  "1547852208677199943": { channelId: "1548100929906151537", leagueId: 1992397255,  weeklyReportsChannelId: "1549126393076654130", matchupChannelId: "1550018778983702548", leaderboardChannelId: "1551612094900600984", tradeCompareChannelId: "1550331446365917224"  },
 };

// Returns a guild's config; throws if the guild (or the requested channel field) isn't configured.
function getServerConfig(guildId, requiredChannelField) {
  const config = SERVERS[guildId];
  if (!config) throw new Error(`No server config for guild ${guildId}`);
  if (requiredChannelField && !config[requiredChannelField]) {
    throw new Error(`No ${requiredChannelField} configured for guild ${guildId}`);
  }
  return config;
}

module.exports = { SERVERS, getServerConfig };
