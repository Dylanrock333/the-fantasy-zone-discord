// Test environment: every guild the test deployment serves, in the new format. Anything else falls back to default.js.
module.exports = {
  // guild ID -> its channels and league (field meanings: see guilds in default.js)
  guilds: {
    // main (PHI PSI)
    "1544547612659679294": {
      chatChannelId: "1544548090025877604",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1549139619004686366",
      matchupChannelId: "1549303658452222003",
      leaderboardChannelId: "1551612311863558356",
      tradeCompareChannelId: "1552423423240708166",
    },
    //main weenie huts jrs
    "1552814146477629463": {
      chatChannelId: "1552814147572465814",
      leagueId: 565242447,
      weeklyReportsChannelId: "1552814147421474819",
      matchupChannelId: "1552814147421474820",
      leaderboardChannelId: "1552814147421474825",
      tradeCompareChannelId: "1552814147572465815",
    },
    //Brotherhood of the gridiron (TEST)
    "1554504461236310036": {
      chatChannelId: "1554504461672644652",
      leagueId: 1992397255,
      weeklyReportsChannelId: "1554504461236310040",
      matchupChannelId: "1554504461236310041",
      leaderboardChannelId: "1554504461672644651",
      tradeCompareChannelId: "1554504461672644653",
    },
    //weenie huts jrs (TEST)
    "1554504954113171488": {
      chatChannelId: "1554504954830655498",
      leagueId: 565242447,
      weeklyReportsChannelId: "1554504954570481837",
      matchupChannelId: "1554504954570481838",
      leaderboardChannelId: "1554504954570481843",
      tradeCompareChannelId: "1554504954830655499",
    },
  },
};
