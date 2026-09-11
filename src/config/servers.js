// Hardcoded per-server config. Each entry maps a Discord guild to the
// fantasy channel it talks in and the league it's tied to on fantasy-bot.
// TODO: move this to a database once we need more than a couple servers.
const SERVERS = {
  "GUILD_ID_A": { channelId: "CHANNEL_ID_A", leagueId: "LEAGUE_ID_A" },
  "GUILD_ID_B": { channelId: "CHANNEL_ID_B", leagueId: "LEAGUE_ID_B" },
};

function getServerConfig(guildId) {
  return SERVERS[guildId];
}

module.exports = { SERVERS, getServerConfig };
