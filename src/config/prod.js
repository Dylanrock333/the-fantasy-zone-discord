// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    // main (PHI PSI)
    "1544547612659679294": {
      mainChatChannelId: "1544547613724909621",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549139619004686366",
      matchupChannelId: "1549303658452222003",
      leaderboardChannelId: "1551612311863558356",
      tradeCompareChannelId: "1552423423240708166",
    },
    //main weenie huts jrs
    "1552814146477629463": {
      mainChatChannelId: "1552814147421474817",
      leagueId: 565242447,
      weeklyReportsChannelId: "1552814147421474819",
      matchupChannelId: "1552814147421474820",
      leaderboardChannelId: "1552814147421474825",
      tradeCompareChannelId: "1552814147572465815",
    },
  },
};
