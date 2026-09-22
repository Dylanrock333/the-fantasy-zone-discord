// Hardcoded per-server config. Each entry maps a Discord guild to the
// fantasy channel it talks in and the league it's tied to on fantasy-bot.
// TODO: move this to a database once we need more than a couple servers.
const SERVERS = {
  // TODO: replace matchupChannelId placeholders with the real matchup channel IDs before deploying.
  // injuryChannelId: "" = opt-out (no injury alerts posted to this guild).
  "1544547612659679294": { channelId: "1544548090025877604", leagueId: 1992397255, weeklyReportsChannelId: "1549139619004686366", matchupChannelId: "1549303658452222003", injuryChannelId: "" },
  "1547852208677199943": { channelId: "1548100929906151537", leagueId: 1992397255,  weeklyReportsChannelId: "1549126393076654130", matchupChannelId: "1550018778983702548", injuryChannelId: "1550355786385989642" },
};

function getServerConfig(guildId) {
  return SERVERS[guildId];
}

module.exports = { SERVERS, getServerConfig };
