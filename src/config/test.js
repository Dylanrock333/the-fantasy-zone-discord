// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    // main
    "1544547612659679294": {
      chatChannelId: "1544548090025877604",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549139619004686366",
      matchupChannelId: "1549303658452222003",
      leaderboardChannelId: "1551612311863558356",
    },
    // test
    "1547852208677199943": {
      chatChannelId: "1548100929906151537",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549126393076654130",
      matchupChannelId: "1550018778983702548",
      leaderboardChannelId: "1551612094900600984",
      tradeCompareChannelId: "1550331446365917224",
    },
    //weenie huts jrs
    "1552814146477629463": {
      chatChannelId: "1552814147572465814",
      leagueId: 565242447,
      weeklyReportsChannelId: "1552814147421474819",
      matchupChannelId: "1552814147421474820",
      leaderboardChannelId: "1552814147421474825",
      tradeCompareChannelId: "1552814147572465815",
    },
  },
};
