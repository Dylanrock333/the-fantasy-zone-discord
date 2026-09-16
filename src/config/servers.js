// Hardcoded per-server config. Each entry maps a Discord guild to the
// fantasy channel it talks in and the league it's tied to on fantasy-bot.
// TODO: move this to a database once we need more than a couple servers.
const SERVERS = {
  "1544547612659679294": { channelId: "1544548090025877604", leagueId: 1992397255, weeklyReportsChannelId: "1549139619004686366" },
  "1547852208677199943": { channelId: "1548100929906151537", leagueId: 1992397255, weeklyReportsChannelId: "1549126393076654130" },
};

function getServerConfig(guildId) {
  return SERVERS[guildId];
}

module.exports = { SERVERS, getServerConfig };
