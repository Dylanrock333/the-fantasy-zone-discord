// Production overrides: the real league's guild(s). Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    "1544547612659679294": {
      chatChannelId: "1544548090025877604",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549139619004686366",
      matchupChannelId: "1549303658452222003",
      leaderboardChannelId: "1551612311863558356",
      // tradeCompareChannelId omitted: trade-compare panel is disabled in prod for now.
    },
  },
};
